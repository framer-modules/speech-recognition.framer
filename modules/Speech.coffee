'''
음성인식 & 오디오 시각화 

@auther Jungho Song (dev@threeword.com)
@since 2017.01.16
'''
class Speech extends Framer.BaseClass

	# Events
	Events.Recognition = {}
	Events.Recognition.Start = 'recognitionStart'
	Events.Recognition.End = 'recognitionEnd'
	Events.Recognition.Speech = {}
	Events.Recognition.Speech.Start = 'recognitionSpeechStart'
	Events.Recognition.Speech.End = 'recognitionSpeechEnd'
	Events.Recognition.Result = {}
	Events.Recognition.Result.Final = 'recognitionResultFinal'
	Events.Recognition.Result.Interim = 'recognitionResultInterim'
	Events.Recognition.Error = 'recognitionError'

	Events.Analyser = {}
	Events.Analyser.Render = 'analyserRender'
	Events.Analyser.End = 'analyserEnd'


	recognizing = false
	ignoreEnd = ""
	finalTranscript = ""
	interimTranscripts = []
	audioStream = undefined
	context = undefined
	analyser = undefined
	source = undefined
	storageArr = undefined
	result = undefined

	renderId = undefined

	# Consturctor
	constructor: (options = {}) ->
		super
		# Speech recognition supported
		if window.SpeechRecognition or window.webkitSpeechRecognition
			@continuous = options.continuous if options.continuous
			@interimResults = options.interimResults if options.interimResults
			@lang = options.lang if options.lang

			@smoothingTimeConstant = options.smoothingTimeConstant if options.smoothingTimeConstant
			@minDecibels = options.minDecibels if options.minDecibels
			@maxDecibels = options.maxDecibels if options.maxDecibels
			@fftSize = options.fftSize if options.fftSize

			@_init options
		# Not supported
		else console.error "Not supported", "Speech recognition are not suported on this browser"

	# ----------------------------------------------------------------------------------
	# Properties
	# ----------------------------------------------------------------------------------

	# Properties : Recognitiion
	@define 'continuous', 
		default: false
		get: -> @_continuous
		set: (value) -> 
			@_continuous = value
			@recognizer.continuous = @_continuous if @recognizer

	@define 'interimResults', 
		default: true
		get: -> @_interimResults
		set: (value) -> 
			@_interimResults = value
			@recognizer.interimResults = @_interimResults if @recognizer

	@define 'lang', 
		default: 'ko-KR'
		get: -> @_lang
		set: (value) -> 
			@_lang = value
			@recognizer.lang = @_lang if @recognizer

	# Properties : Analyser
	# range : 0.0 ~ 1.0, default: .3
	@define 'smoothingTimeConstant', @simpleProperty('smoothingTimeConstant', 0.9)
	@define 'minDecibels', @simpleProperty('minDecibels', -90)
	@define 'maxDecibels', @simpleProperty('maxDecibels', -10)
	# range : 32 ~ 32768
	@define 'fftSize', @simpleProperty('fftSize', 32768)

	# ----------------------------------------------------------------------------------
	# Public 
	# ----------------------------------------------------------------------------------

	# Start
	start: ->
		return unless @recognizer
		console.log 'speech', 'start'

		#
		recognizing = false
		ignoreEnd = ""
		finalTranscript = ""
		interimTranscripts = []
		audioStream = undefined
		context = undefined
		analyser = undefined
		source = undefined
		storageArr = undefined
		result = undefined

		#
		@recognizer.start() unless recognizing

	# Stop
	stop: ->
		return unless @recognizer
		console.log 'speech', 'stop'

		#
		@recognizer.stop() if recognizing


	# ----------------------------------------------------------------------------------
	# Private
	# ----------------------------------------------------------------------------------

	_init: (options = {}) ->
		@recognizer = new (window.SpeechRecognition or window.webkitSpeechRecognition)()

		# Properties
		@recognizer.continuous = @continuous
		@recognizer.interimResults = @interimResults
		@recognizer.lang = @lang

		# Events
		@recognizer.onstart = @_onStart
		@recognizer.onend = @_onEnd
		@recognizer.onspeechstart = @_onSpeechStart
		@recognizer.onspeechend = @_onSpeechEnd
		@recognizer.onresult = @_onResult
		@recognizer.onerror = @_onError

	# ----------------------------------------------------------------------------------
	# Media Callback
	# ----------------------------------------------------------------------------------

	# Success
	_getUserMediaSuccessCallback: (stream) =>
		audioStream = stream
				
		window.AudioContext = window.AudioContext || window.webkitAudioContext
		context = new AudioContext()
		
		analyser = context.createAnalyser()
		analyser.smoothingTimeConstant = @smoothingTimeConstant;
		analyser.minDecibels = @minDecibels;
		analyser.maxDecibels = @maxDecibels;
		analyser.fftSize = @fftSize;
		
		source = context.createMediaStreamSource(stream)
		source.connect(analyser)
		analyser.connect context.destination
		
		#
		@_onRenderStart()

	# Error
	_getUserMediaErrorCallback: (error) => console.log error	


	# ----------------------------------------------------------------------------------
	# Events
	# ----------------------------------------------------------------------------------

	# Start
	_onStart: (e) =>
		console.log 'speech', '[event] start'
		recognizing = true
		

		# 오디오(마이크) 스트림 데이터 가져와서 분석기 렌더링
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
		navigator.getUserMedia 
			audio: true, @_getUserMediaSuccessCallback, @_getUserMediaErrorCallback

		# Fire
		@emit Events.Recognition.Start, @

	# End
	_onEnd: (e) =>
		console.log 'speech', '[event] end'
		recognizing = false
		
		# 분석기 렌러링 멈춤
		@_onRenderEnd()
		# 오디오 스트림 멈춤
		if audioStream
			track = audioStream.getTracks()[0]
			track.stop() if track
		# 오디오 컨텍스트 닫기
		context.close() if context

		# Fire
		@emit Events.Recognition.End, @

	# Speech start
	_onSpeechStart: (e) =>
		console.log 'speech', '[event] speech start'
		# Fire
		@emit Events.Recognition.Speech.Start, @

	# Speech end
	_onSpeechEnd: (e) =>
		console.log 'speech', '[event] speech end'
		# Fire
		@emit Events.Recognition.Speech.End, @

	# Result 
	_onResult: (e) =>
		interimTranscript = ''
		for i in [e.resultIndex...e.results.length]
			# Final
			if e.results[i].isFinal
				finalTranscript += e.results[i][0].transcript
				result = e.results[i][0]

				console.log 'speech', '[event] result : final : ' + finalTranscript

				# Fire
				@emit Events.Recognition.Result.Final, finalTranscript, result, e, @
			# Interim
			else
				interimTranscripts.push e.results[i][0].transcript
				interimTranscript += e.results[i][0].transcript

				console.log 'speech', '[event] result : interim : ' + interimTranscript

				# Fire
				@emit Events.Recognition.Result.Interim, interimTranscript, interimTranscripts, e, @

	# Error
	_onError: (e) =>
		console.log 'speech', '[event] ' + e

		ignoreEnd = e.error

		# Fire
		@emit Events.Recognition.Error, e, @


	# ----------------------------------------------------------------------------------
	# Analyser Render
	# ----------------------------------------------------------------------------------

	# Start
	_onRenderStart: =>
		return unless analyser
		return unless recognizing

		if renderId
			console.log 'speech', 'render : update'
			cancelAnimationFrame(renderId)
		else console.log 'speech', 'render : start'
		
		renderId = requestAnimationFrame( () => @_onRenderStart() )
		storageArr = new Uint8Array(analyser.frequencyBinCount)
		analyser.getByteFrequencyData(storageArr)

		# Fire
		@emit Events.Analyser.Render, storageArr, @

	# Stop
	_onRenderEnd: =>
		console.log 'speech', 'render : stop'

		#
		return unless renderId
		cancelAnimationFrame(renderId)
		renderId = undefined

		# Fire
		@emit Events.Analyser.End, @

	# ----------------------------------------------------------------------------------
	# Event Helper
	# ----------------------------------------------------------------------------------
	onRecognitionStart: (cb) -> @on Events.Recognition.Start, cb
	onRecognitionEnd: (cb) -> @on Events.Recognition.End, cb
	onRecognitionSpeechStart: (cb) -> @on Events.Recognition.Speech.Start, cb
	onRecognitionSpeechEnd: (cb) -> @on Events.Recognition.Speech.End, cb
	onRecognitionResultFinal: (cb) -> @on Events.Recognition.Result.Final, cb
	onRecognitionResultInterim: (cb) -> @on Events.Recognition.Result.Interim, cb
	onRecognitionError: (cb) -> @on Events.Recognition.Error, cb

	onAnalyserRender: (cb) -> @on Events.Analyser.Render, cb
	onAnalyserEnd: (cb) -> @on Events.Analyser.End, cb

#
window.Speech = Speech if window