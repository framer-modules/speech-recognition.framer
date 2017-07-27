# 배경
Screen.backgroundColor = "#E9EBEE"

# 볼래퍼
ballsWrapperUp = new Layer
	maxY: Screen.height/2
	width: Screen.width, height: Screen.height/2
	backgroundColor: ''
ballsWrapperDown = ballsWrapperUp.copySingle()
ballsWrapperDown.props = 
	minY: Screen.height/2
	opacity: .2

# 볼
ballsUp = []
ballsDown = []
for i in [0...240]
	ball = ballsUp[i] = new Layer
		name: "ball#{i}"
		x: 15 + i * 3, y: Align.bottom
		width: 3, height: 6
		backgroundColor: "#FFBD11"
		parent: ballsWrapperUp
	ball = ballsDown[i] = new Layer
		name: "ball#{i}"
		x: 16 + i * 3, y: Align.top
		width: 3, height: 6
		backgroundColor: "#FFBD11"
		parent: ballsWrapperDown

# 음성인식 결과
resultLabel = new Layer
	x: Align.center, y: Align.top(150)
	width: Screen.width - 100
	html: '시작버튼을 눌러주세요.'
	style: fontSize: "50px", lineHeight: 1, textAlign: "center"
	color: 'darkgray'
	backgroundColor: ''
resultLabel.states = 
	interim: color: 'darkgray'
	final: color: 'black'
resultLabel.update = (state, label) ->
	@html = label
	@animateStop()
	@animate state

# 시작 버튼
startBtn = new Layer
	y: Align.bottom
	width: Screen.width/2 + 5, height: 120
	html: '시작'
	style: fontSize: "50px", lineHeight: "100px", textAlign: "center"
	borderRadius: 5
	backgroundColor: new Color("red").lighten(20)

# 종료 버튼
stopBtn = startBtn.copySingle()
stopBtn.props = 
	x: Align.right
	html: '종료'
	backgroundColor: new Color("blue").lighten(20)

startBtn.frame = Utils.frameInset startBtn.frame, 10
stopBtn.frame = Utils.frameInset stopBtn.frame, 10

# 음성인식 & 시각화 모듈
require 'Speech'
speech = new Speech()
# 음성인식이 가능한 경우
if speech
	# 시작
	startBtn.onClick -> speech.start()
	# 종료
	stopBtn.onClick -> speech.stop()
	
	# 이벤트 : 음성인식 시작됨
	speech.onRecognitionStart ->
		console.log 'Listener', 'onRecognitionStart'
		
		resultLabel.update 'interim', ''
		
	# 이벤트 : 음성인식 종료됨
	speech.onRecognitionEnd -> console.log 'Listener', 'onRecognitionEnd'
	# 이벤트 : 음성인식 발화 시작
	speech.onRecognitionSpeechStart -> console.log 'Listener', 'onRecognitionSpeechStart'
	# 이벤트 : 음성인식 발화 종료
	speech.onRecognitionSpeechEnd -> console.log 'Listener', 'onRecognitionSpeechEnd'
	# 이벤트 : 음성인식 결과 중간
	speech.onRecognitionResultInterim (transcript, transcripts) -> 
		console.log 'Listener', 'onRecognitionResultInterim'
		
		resultLabel.update 'interim', transcript
		
	# 이벤트 : 음성인식 결과 쵲종
	speech.onRecognitionResultFinal (transcript, result) -> 
		console.log 'Listener', 'onRecognitionResultFinal'
		
		resultLabel.update 'final', transcript
		
	# 이벤트 : 음성인식 에러
	speech.onRecognitionError -> console.log 'Listener', 'onRecognitionResultError'

	# 이벤트 : 시각화 렌더링
	speech.onAnalyserRender (storageArr)-> 
# 		console.log 'Listener', 'onAnalyserRender'
		
		for i in [0...ballsUp.length]
			ballsUp[i].y = Align.bottom
			ballsUp[i].y = ballsUp[i].y - storageArr[i]
			
			ballsDown[i].y = Align.top
			ballsDown[i].y = ballsDown[i].y + storageArr[i]
			
	# 이벤트 : 시각화 렌더링 종료
	speech.onAnalyserEnd -> 
# 		console.log 'Listener', 'onAnalyserEnd'
		
		for i in [0...ballsUp.length]
			ballsUp[i].animate y: Align.bottom, options: delay: .001 * i
			ballsDown[i].animate y: Align.top, options: delay: .001 * i
			