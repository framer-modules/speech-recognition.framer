require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Speech":[function(require,module,exports){
'음성인식 & 오디오 시각화 \n\n@auther Jungho Song (dev@threeword.com)\n@since 2017.01.16';
var Speech,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Speech = (function(superClass) {
  var analyser, audioStream, context, finalTranscript, ignoreEnd, interimTranscripts, recognizing, renderId, result, source, storageArr;

  extend(Speech, superClass);

  Events.Recognition = {};

  Events.Recognition.Start = 'recognitionStart';

  Events.Recognition.End = 'recognitionEnd';

  Events.Recognition.Speech = {};

  Events.Recognition.Speech.Start = 'recognitionSpeechStart';

  Events.Recognition.Speech.End = 'recognitionSpeechEnd';

  Events.Recognition.Result = {};

  Events.Recognition.Result.Final = 'recognitionResultFinal';

  Events.Recognition.Result.Interim = 'recognitionResultInterim';

  Events.Recognition.Error = 'recognitionError';

  Events.Analyser = {};

  Events.Analyser.Render = 'analyserRender';

  Events.Analyser.End = 'analyserEnd';

  recognizing = false;

  ignoreEnd = "";

  finalTranscript = "";

  interimTranscripts = [];

  audioStream = void 0;

  context = void 0;

  analyser = void 0;

  source = void 0;

  storageArr = void 0;

  result = void 0;

  renderId = void 0;

  function Speech(options) {
    if (options == null) {
      options = {};
    }
    this._onRenderEnd = bind(this._onRenderEnd, this);
    this._onRenderStart = bind(this._onRenderStart, this);
    this._onError = bind(this._onError, this);
    this._onResult = bind(this._onResult, this);
    this._onSpeechEnd = bind(this._onSpeechEnd, this);
    this._onSpeechStart = bind(this._onSpeechStart, this);
    this._onEnd = bind(this._onEnd, this);
    this._onStart = bind(this._onStart, this);
    this._getUserMediaErrorCallback = bind(this._getUserMediaErrorCallback, this);
    this._getUserMediaSuccessCallback = bind(this._getUserMediaSuccessCallback, this);
    Speech.__super__.constructor.apply(this, arguments);
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      if (options.continuous) {
        this.continuous = options.continuous;
      }
      if (options.interimResults) {
        this.interimResults = options.interimResults;
      }
      if (options.lang) {
        this.lang = options.lang;
      }
      if (options.smoothingTimeConstant) {
        this.smoothingTimeConstant = options.smoothingTimeConstant;
      }
      if (options.minDecibels) {
        this.minDecibels = options.minDecibels;
      }
      if (options.maxDecibels) {
        this.maxDecibels = options.maxDecibels;
      }
      if (options.fftSize) {
        this.fftSize = options.fftSize;
      }
      this._init(options);
    } else {
      console.error("Not supported", "Speech recognition are not suported on this browser");
    }
  }

  Speech.define('continuous', {
    "default": false,
    get: function() {
      return this._continuous;
    },
    set: function(value) {
      this._continuous = value;
      if (this.recognizer) {
        return this.recognizer.continuous = this._continuous;
      }
    }
  });

  Speech.define('interimResults', {
    "default": true,
    get: function() {
      return this._interimResults;
    },
    set: function(value) {
      this._interimResults = value;
      if (this.recognizer) {
        return this.recognizer.interimResults = this._interimResults;
      }
    }
  });

  Speech.define('lang', {
    "default": 'ko-KR',
    get: function() {
      return this._lang;
    },
    set: function(value) {
      this._lang = value;
      if (this.recognizer) {
        return this.recognizer.lang = this._lang;
      }
    }
  });

  Speech.define('smoothingTimeConstant', Speech.simpleProperty('smoothingTimeConstant', 0.9));

  Speech.define('minDecibels', Speech.simpleProperty('minDecibels', -90));

  Speech.define('maxDecibels', Speech.simpleProperty('maxDecibels', -10));

  Speech.define('fftSize', Speech.simpleProperty('fftSize', 32768));

  Speech.prototype.start = function() {
    if (!this.recognizer) {
      return;
    }
    console.log('speech', 'start');
    recognizing = false;
    ignoreEnd = "";
    finalTranscript = "";
    interimTranscripts = [];
    audioStream = void 0;
    context = void 0;
    analyser = void 0;
    source = void 0;
    storageArr = void 0;
    result = void 0;
    if (!recognizing) {
      return this.recognizer.start();
    }
  };

  Speech.prototype.stop = function() {
    if (!this.recognizer) {
      return;
    }
    console.log('speech', 'stop');
    if (recognizing) {
      return this.recognizer.stop();
    }
  };

  Speech.prototype._init = function(options) {
    if (options == null) {
      options = {};
    }
    this.recognizer = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.recognizer.continuous = this.continuous;
    this.recognizer.interimResults = this.interimResults;
    this.recognizer.lang = this.lang;
    this.recognizer.onstart = this._onStart;
    this.recognizer.onend = this._onEnd;
    this.recognizer.onspeechstart = this._onSpeechStart;
    this.recognizer.onspeechend = this._onSpeechEnd;
    this.recognizer.onresult = this._onResult;
    return this.recognizer.onerror = this._onError;
  };

  Speech.prototype._getUserMediaSuccessCallback = function(stream) {
    audioStream = stream;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = this.smoothingTimeConstant;
    analyser.minDecibels = this.minDecibels;
    analyser.maxDecibels = this.maxDecibels;
    analyser.fftSize = this.fftSize;
    source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.connect(context.destination);
    return this._onRenderStart();
  };

  Speech.prototype._getUserMediaErrorCallback = function(error) {
    return console.log(error);
  };

  Speech.prototype._onStart = function(e) {
    console.log('speech', '[event] start');
    recognizing = true;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    navigator.getUserMedia({
      audio: true
    }, this._getUserMediaSuccessCallback, this._getUserMediaErrorCallback);
    return this.emit(Events.Recognition.Start, this);
  };

  Speech.prototype._onEnd = function(e) {
    var track;
    console.log('speech', '[event] end');
    recognizing = false;
    this._onRenderEnd();
    if (audioStream) {
      track = audioStream.getTracks()[0];
      if (track) {
        track.stop();
      }
    }
    if (context) {
      context.close();
    }
    return this.emit(Events.Recognition.End, this);
  };

  Speech.prototype._onSpeechStart = function(e) {
    console.log('speech', '[event] speech start');
    return this.emit(Events.Recognition.Speech.Start, this);
  };

  Speech.prototype._onSpeechEnd = function(e) {
    console.log('speech', '[event] speech end');
    return this.emit(Events.Recognition.Speech.End, this);
  };

  Speech.prototype._onResult = function(e) {
    var i, interimTranscript, j, ref, ref1, results;
    interimTranscript = '';
    results = [];
    for (i = j = ref = e.resultIndex, ref1 = e.results.length; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript;
        result = e.results[i][0];
        console.log('speech', '[event] result : final : ' + finalTranscript);
        results.push(this.emit(Events.Recognition.Result.Final, finalTranscript, result, e, this));
      } else {
        interimTranscripts.push(e.results[i][0].transcript);
        interimTranscript += e.results[i][0].transcript;
        console.log('speech', '[event] result : interim : ' + interimTranscript);
        results.push(this.emit(Events.Recognition.Result.Interim, interimTranscript, interimTranscripts, e, this));
      }
    }
    return results;
  };

  Speech.prototype._onError = function(e) {
    console.log('speech', '[event] ' + e);
    ignoreEnd = e.error;
    return this.emit(Events.Recognition.Error, e, this);
  };

  Speech.prototype._onRenderStart = function() {
    if (!analyser) {
      return;
    }
    if (!recognizing) {
      return;
    }
    if (renderId) {
      console.log('speech', 'render : update');
      cancelAnimationFrame(renderId);
    } else {
      console.log('speech', 'render : start');
    }
    renderId = requestAnimationFrame((function(_this) {
      return function() {
        return _this._onRenderStart();
      };
    })(this));
    storageArr = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(storageArr);
    return this.emit(Events.Analyser.Render, storageArr, this);
  };

  Speech.prototype._onRenderEnd = function() {
    console.log('speech', 'render : stop');
    if (!renderId) {
      return;
    }
    cancelAnimationFrame(renderId);
    renderId = void 0;
    return this.emit(Events.Analyser.End, this);
  };

  Speech.prototype.onRecognitionStart = function(cb) {
    return this.on(Events.Recognition.Start, cb);
  };

  Speech.prototype.onRecognitionEnd = function(cb) {
    return this.on(Events.Recognition.End, cb);
  };

  Speech.prototype.onRecognitionSpeechStart = function(cb) {
    return this.on(Events.Recognition.Speech.Start, cb);
  };

  Speech.prototype.onRecognitionSpeechEnd = function(cb) {
    return this.on(Events.Recognition.Speech.End, cb);
  };

  Speech.prototype.onRecognitionResultFinal = function(cb) {
    return this.on(Events.Recognition.Result.Final, cb);
  };

  Speech.prototype.onRecognitionResultInterim = function(cb) {
    return this.on(Events.Recognition.Result.Interim, cb);
  };

  Speech.prototype.onRecognitionError = function(cb) {
    return this.on(Events.Recognition.Error, cb);
  };

  Speech.prototype.onAnalyserRender = function(cb) {
    return this.on(Events.Analyser.Render, cb);
  };

  Speech.prototype.onAnalyserEnd = function(cb) {
    return this.on(Events.Analyser.End, cb);
  };

  return Speech;

})(Framer.BaseClass);

if (window) {
  window.Speech = Speech;
}


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3RocmVld29yZC90b3kvcHJvdG90eXBlL2ZyYW1lcmpzL21vZHVsZXMvU3BlZWNoLmZyYW1lci9tb2R1bGVzL1NwZWVjaC5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIicnJ1xu7J2M7ISx7J247IudICYg7Jik65SU7JikIOyLnOqwge2ZlCBcblxuQGF1dGhlciBKdW5naG8gU29uZyAoZGV2QHRocmVld29yZC5jb20pXG5Ac2luY2UgMjAxNy4wMS4xNlxuJycnXG5jbGFzcyBTcGVlY2ggZXh0ZW5kcyBGcmFtZXIuQmFzZUNsYXNzXG5cblx0IyBFdmVudHNcblx0RXZlbnRzLlJlY29nbml0aW9uID0ge31cblx0RXZlbnRzLlJlY29nbml0aW9uLlN0YXJ0ID0gJ3JlY29nbml0aW9uU3RhcnQnXG5cdEV2ZW50cy5SZWNvZ25pdGlvbi5FbmQgPSAncmVjb2duaXRpb25FbmQnXG5cdEV2ZW50cy5SZWNvZ25pdGlvbi5TcGVlY2ggPSB7fVxuXHRFdmVudHMuUmVjb2duaXRpb24uU3BlZWNoLlN0YXJ0ID0gJ3JlY29nbml0aW9uU3BlZWNoU3RhcnQnXG5cdEV2ZW50cy5SZWNvZ25pdGlvbi5TcGVlY2guRW5kID0gJ3JlY29nbml0aW9uU3BlZWNoRW5kJ1xuXHRFdmVudHMuUmVjb2duaXRpb24uUmVzdWx0ID0ge31cblx0RXZlbnRzLlJlY29nbml0aW9uLlJlc3VsdC5GaW5hbCA9ICdyZWNvZ25pdGlvblJlc3VsdEZpbmFsJ1xuXHRFdmVudHMuUmVjb2duaXRpb24uUmVzdWx0LkludGVyaW0gPSAncmVjb2duaXRpb25SZXN1bHRJbnRlcmltJ1xuXHRFdmVudHMuUmVjb2duaXRpb24uRXJyb3IgPSAncmVjb2duaXRpb25FcnJvcidcblxuXHRFdmVudHMuQW5hbHlzZXIgPSB7fVxuXHRFdmVudHMuQW5hbHlzZXIuUmVuZGVyID0gJ2FuYWx5c2VyUmVuZGVyJ1xuXHRFdmVudHMuQW5hbHlzZXIuRW5kID0gJ2FuYWx5c2VyRW5kJ1xuXG5cblx0cmVjb2duaXppbmcgPSBmYWxzZVxuXHRpZ25vcmVFbmQgPSBcIlwiXG5cdGZpbmFsVHJhbnNjcmlwdCA9IFwiXCJcblx0aW50ZXJpbVRyYW5zY3JpcHRzID0gW11cblx0YXVkaW9TdHJlYW0gPSB1bmRlZmluZWRcblx0Y29udGV4dCA9IHVuZGVmaW5lZFxuXHRhbmFseXNlciA9IHVuZGVmaW5lZFxuXHRzb3VyY2UgPSB1bmRlZmluZWRcblx0c3RvcmFnZUFyciA9IHVuZGVmaW5lZFxuXHRyZXN1bHQgPSB1bmRlZmluZWRcblxuXHRyZW5kZXJJZCA9IHVuZGVmaW5lZFxuXG5cdCMgQ29uc3R1cmN0b3Jcblx0Y29uc3RydWN0b3I6IChvcHRpb25zID0ge30pIC0+XG5cdFx0c3VwZXJcblx0XHQjIFNwZWVjaCByZWNvZ25pdGlvbiBzdXBwb3J0ZWRcblx0XHRpZiB3aW5kb3cuU3BlZWNoUmVjb2duaXRpb24gb3Igd2luZG93LndlYmtpdFNwZWVjaFJlY29nbml0aW9uXG5cdFx0XHRAY29udGludW91cyA9IG9wdGlvbnMuY29udGludW91cyBpZiBvcHRpb25zLmNvbnRpbnVvdXNcblx0XHRcdEBpbnRlcmltUmVzdWx0cyA9IG9wdGlvbnMuaW50ZXJpbVJlc3VsdHMgaWYgb3B0aW9ucy5pbnRlcmltUmVzdWx0c1xuXHRcdFx0QGxhbmcgPSBvcHRpb25zLmxhbmcgaWYgb3B0aW9ucy5sYW5nXG5cblx0XHRcdEBzbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSBvcHRpb25zLnNtb290aGluZ1RpbWVDb25zdGFudCBpZiBvcHRpb25zLnNtb290aGluZ1RpbWVDb25zdGFudFxuXHRcdFx0QG1pbkRlY2liZWxzID0gb3B0aW9ucy5taW5EZWNpYmVscyBpZiBvcHRpb25zLm1pbkRlY2liZWxzXG5cdFx0XHRAbWF4RGVjaWJlbHMgPSBvcHRpb25zLm1heERlY2liZWxzIGlmIG9wdGlvbnMubWF4RGVjaWJlbHNcblx0XHRcdEBmZnRTaXplID0gb3B0aW9ucy5mZnRTaXplIGlmIG9wdGlvbnMuZmZ0U2l6ZVxuXG5cdFx0XHRAX2luaXQgb3B0aW9uc1xuXHRcdCMgTm90IHN1cHBvcnRlZFxuXHRcdGVsc2UgY29uc29sZS5lcnJvciBcIk5vdCBzdXBwb3J0ZWRcIiwgXCJTcGVlY2ggcmVjb2duaXRpb24gYXJlIG5vdCBzdXBvcnRlZCBvbiB0aGlzIGJyb3dzZXJcIlxuXG5cdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIFByb3BlcnRpZXNcblx0IyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0IyBQcm9wZXJ0aWVzIDogUmVjb2duaXRpaW9uXG5cdEBkZWZpbmUgJ2NvbnRpbnVvdXMnLCBcblx0XHRkZWZhdWx0OiBmYWxzZVxuXHRcdGdldDogLT4gQF9jb250aW51b3VzXG5cdFx0c2V0OiAodmFsdWUpIC0+IFxuXHRcdFx0QF9jb250aW51b3VzID0gdmFsdWVcblx0XHRcdEByZWNvZ25pemVyLmNvbnRpbnVvdXMgPSBAX2NvbnRpbnVvdXMgaWYgQHJlY29nbml6ZXJcblxuXHRAZGVmaW5lICdpbnRlcmltUmVzdWx0cycsIFxuXHRcdGRlZmF1bHQ6IHRydWVcblx0XHRnZXQ6IC0+IEBfaW50ZXJpbVJlc3VsdHNcblx0XHRzZXQ6ICh2YWx1ZSkgLT4gXG5cdFx0XHRAX2ludGVyaW1SZXN1bHRzID0gdmFsdWVcblx0XHRcdEByZWNvZ25pemVyLmludGVyaW1SZXN1bHRzID0gQF9pbnRlcmltUmVzdWx0cyBpZiBAcmVjb2duaXplclxuXG5cdEBkZWZpbmUgJ2xhbmcnLCBcblx0XHRkZWZhdWx0OiAna28tS1InXG5cdFx0Z2V0OiAtPiBAX2xhbmdcblx0XHRzZXQ6ICh2YWx1ZSkgLT4gXG5cdFx0XHRAX2xhbmcgPSB2YWx1ZVxuXHRcdFx0QHJlY29nbml6ZXIubGFuZyA9IEBfbGFuZyBpZiBAcmVjb2duaXplclxuXG5cdCMgUHJvcGVydGllcyA6IEFuYWx5c2VyXG5cdCMgcmFuZ2UgOiAwLjAgfiAxLjAsIGRlZmF1bHQ6IC4zXG5cdEBkZWZpbmUgJ3Ntb290aGluZ1RpbWVDb25zdGFudCcsIEBzaW1wbGVQcm9wZXJ0eSgnc21vb3RoaW5nVGltZUNvbnN0YW50JywgMC45KVxuXHRAZGVmaW5lICdtaW5EZWNpYmVscycsIEBzaW1wbGVQcm9wZXJ0eSgnbWluRGVjaWJlbHMnLCAtOTApXG5cdEBkZWZpbmUgJ21heERlY2liZWxzJywgQHNpbXBsZVByb3BlcnR5KCdtYXhEZWNpYmVscycsIC0xMClcblx0IyByYW5nZSA6IDMyIH4gMzI3Njhcblx0QGRlZmluZSAnZmZ0U2l6ZScsIEBzaW1wbGVQcm9wZXJ0eSgnZmZ0U2l6ZScsIDMyNzY4KVxuXG5cdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIFB1YmxpYyBcblx0IyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0IyBTdGFydFxuXHRzdGFydDogLT5cblx0XHRyZXR1cm4gdW5sZXNzIEByZWNvZ25pemVyXG5cdFx0Y29uc29sZS5sb2cgJ3NwZWVjaCcsICdzdGFydCdcblxuXHRcdCNcblx0XHRyZWNvZ25pemluZyA9IGZhbHNlXG5cdFx0aWdub3JlRW5kID0gXCJcIlxuXHRcdGZpbmFsVHJhbnNjcmlwdCA9IFwiXCJcblx0XHRpbnRlcmltVHJhbnNjcmlwdHMgPSBbXVxuXHRcdGF1ZGlvU3RyZWFtID0gdW5kZWZpbmVkXG5cdFx0Y29udGV4dCA9IHVuZGVmaW5lZFxuXHRcdGFuYWx5c2VyID0gdW5kZWZpbmVkXG5cdFx0c291cmNlID0gdW5kZWZpbmVkXG5cdFx0c3RvcmFnZUFyciA9IHVuZGVmaW5lZFxuXHRcdHJlc3VsdCA9IHVuZGVmaW5lZFxuXG5cdFx0I1xuXHRcdEByZWNvZ25pemVyLnN0YXJ0KCkgdW5sZXNzIHJlY29nbml6aW5nXG5cblx0IyBTdG9wXG5cdHN0b3A6IC0+XG5cdFx0cmV0dXJuIHVubGVzcyBAcmVjb2duaXplclxuXHRcdGNvbnNvbGUubG9nICdzcGVlY2gnLCAnc3RvcCdcblxuXHRcdCNcblx0XHRAcmVjb2duaXplci5zdG9wKCkgaWYgcmVjb2duaXppbmdcblxuXG5cdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIFByaXZhdGVcblx0IyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0X2luaXQ6IChvcHRpb25zID0ge30pIC0+XG5cdFx0QHJlY29nbml6ZXIgPSBuZXcgKHdpbmRvdy5TcGVlY2hSZWNvZ25pdGlvbiBvciB3aW5kb3cud2Via2l0U3BlZWNoUmVjb2duaXRpb24pKClcblxuXHRcdCMgUHJvcGVydGllc1xuXHRcdEByZWNvZ25pemVyLmNvbnRpbnVvdXMgPSBAY29udGludW91c1xuXHRcdEByZWNvZ25pemVyLmludGVyaW1SZXN1bHRzID0gQGludGVyaW1SZXN1bHRzXG5cdFx0QHJlY29nbml6ZXIubGFuZyA9IEBsYW5nXG5cblx0XHQjIEV2ZW50c1xuXHRcdEByZWNvZ25pemVyLm9uc3RhcnQgPSBAX29uU3RhcnRcblx0XHRAcmVjb2duaXplci5vbmVuZCA9IEBfb25FbmRcblx0XHRAcmVjb2duaXplci5vbnNwZWVjaHN0YXJ0ID0gQF9vblNwZWVjaFN0YXJ0XG5cdFx0QHJlY29nbml6ZXIub25zcGVlY2hlbmQgPSBAX29uU3BlZWNoRW5kXG5cdFx0QHJlY29nbml6ZXIub25yZXN1bHQgPSBAX29uUmVzdWx0XG5cdFx0QHJlY29nbml6ZXIub25lcnJvciA9IEBfb25FcnJvclxuXG5cdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIE1lZGlhIENhbGxiYWNrXG5cdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdCMgU3VjY2Vzc1xuXHRfZ2V0VXNlck1lZGlhU3VjY2Vzc0NhbGxiYWNrOiAoc3RyZWFtKSA9PlxuXHRcdGF1ZGlvU3RyZWFtID0gc3RyZWFtXG5cdFx0XHRcdFxuXHRcdHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHRcblx0XHRjb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpXG5cdFx0XG5cdFx0YW5hbHlzZXIgPSBjb250ZXh0LmNyZWF0ZUFuYWx5c2VyKClcblx0XHRhbmFseXNlci5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSBAc21vb3RoaW5nVGltZUNvbnN0YW50O1xuXHRcdGFuYWx5c2VyLm1pbkRlY2liZWxzID0gQG1pbkRlY2liZWxzO1xuXHRcdGFuYWx5c2VyLm1heERlY2liZWxzID0gQG1heERlY2liZWxzO1xuXHRcdGFuYWx5c2VyLmZmdFNpemUgPSBAZmZ0U2l6ZTtcblx0XHRcblx0XHRzb3VyY2UgPSBjb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSlcblx0XHRzb3VyY2UuY29ubmVjdChhbmFseXNlcilcblx0XHRhbmFseXNlci5jb25uZWN0IGNvbnRleHQuZGVzdGluYXRpb25cblx0XHRcblx0XHQjXG5cdFx0QF9vblJlbmRlclN0YXJ0KClcblxuXHQjIEVycm9yXG5cdF9nZXRVc2VyTWVkaWFFcnJvckNhbGxiYWNrOiAoZXJyb3IpID0+IGNvbnNvbGUubG9nIGVycm9yXHRcblxuXG5cdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIEV2ZW50c1xuXHQjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHQjIFN0YXJ0XG5cdF9vblN0YXJ0OiAoZSkgPT5cblx0XHRjb25zb2xlLmxvZyAnc3BlZWNoJywgJ1tldmVudF0gc3RhcnQnXG5cdFx0cmVjb2duaXppbmcgPSB0cnVlXG5cdFx0XG5cblx0XHQjIOyYpOuUlOyYpCjrp4jsnbTtgawpIOyKpO2KuOumvCDrjbDsnbTthLAg6rCA7KC47JmA7IScIOu2hOyEneq4sCDroIzrjZTrp4Fcblx0XHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhXG5cdFx0bmF2aWdhdG9yLmdldFVzZXJNZWRpYSBcblx0XHRcdGF1ZGlvOiB0cnVlLCBAX2dldFVzZXJNZWRpYVN1Y2Nlc3NDYWxsYmFjaywgQF9nZXRVc2VyTWVkaWFFcnJvckNhbGxiYWNrXG5cblx0XHQjIEZpcmVcblx0XHRAZW1pdCBFdmVudHMuUmVjb2duaXRpb24uU3RhcnQsIEBcblxuXHQjIEVuZFxuXHRfb25FbmQ6IChlKSA9PlxuXHRcdGNvbnNvbGUubG9nICdzcGVlY2gnLCAnW2V2ZW50XSBlbmQnXG5cdFx0cmVjb2duaXppbmcgPSBmYWxzZVxuXHRcdFxuXHRcdCMg67aE7ISd6riwIOugjOufrOungSDrqYjstqRcblx0XHRAX29uUmVuZGVyRW5kKClcblx0XHQjIOyYpOuUlOyYpCDsiqTtirjrprwg66mI7LakXG5cdFx0aWYgYXVkaW9TdHJlYW1cblx0XHRcdHRyYWNrID0gYXVkaW9TdHJlYW0uZ2V0VHJhY2tzKClbMF1cblx0XHRcdHRyYWNrLnN0b3AoKSBpZiB0cmFja1xuXHRcdCMg7Jik65SU7JikIOy7qO2FjeyKpO2KuCDri6vquLBcblx0XHRjb250ZXh0LmNsb3NlKCkgaWYgY29udGV4dFxuXG5cdFx0IyBGaXJlXG5cdFx0QGVtaXQgRXZlbnRzLlJlY29nbml0aW9uLkVuZCwgQFxuXG5cdCMgU3BlZWNoIHN0YXJ0XG5cdF9vblNwZWVjaFN0YXJ0OiAoZSkgPT5cblx0XHRjb25zb2xlLmxvZyAnc3BlZWNoJywgJ1tldmVudF0gc3BlZWNoIHN0YXJ0J1xuXHRcdCMgRmlyZVxuXHRcdEBlbWl0IEV2ZW50cy5SZWNvZ25pdGlvbi5TcGVlY2guU3RhcnQsIEBcblxuXHQjIFNwZWVjaCBlbmRcblx0X29uU3BlZWNoRW5kOiAoZSkgPT5cblx0XHRjb25zb2xlLmxvZyAnc3BlZWNoJywgJ1tldmVudF0gc3BlZWNoIGVuZCdcblx0XHQjIEZpcmVcblx0XHRAZW1pdCBFdmVudHMuUmVjb2duaXRpb24uU3BlZWNoLkVuZCwgQFxuXG5cdCMgUmVzdWx0IFxuXHRfb25SZXN1bHQ6IChlKSA9PlxuXHRcdGludGVyaW1UcmFuc2NyaXB0ID0gJydcblx0XHRmb3IgaSBpbiBbZS5yZXN1bHRJbmRleC4uLmUucmVzdWx0cy5sZW5ndGhdXG5cdFx0XHQjIEZpbmFsXG5cdFx0XHRpZiBlLnJlc3VsdHNbaV0uaXNGaW5hbFxuXHRcdFx0XHRmaW5hbFRyYW5zY3JpcHQgKz0gZS5yZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHRcblx0XHRcdFx0cmVzdWx0ID0gZS5yZXN1bHRzW2ldWzBdXG5cblx0XHRcdFx0Y29uc29sZS5sb2cgJ3NwZWVjaCcsICdbZXZlbnRdIHJlc3VsdCA6IGZpbmFsIDogJyArIGZpbmFsVHJhbnNjcmlwdFxuXG5cdFx0XHRcdCMgRmlyZVxuXHRcdFx0XHRAZW1pdCBFdmVudHMuUmVjb2duaXRpb24uUmVzdWx0LkZpbmFsLCBmaW5hbFRyYW5zY3JpcHQsIHJlc3VsdCwgZSwgQFxuXHRcdFx0IyBJbnRlcmltXG5cdFx0XHRlbHNlXG5cdFx0XHRcdGludGVyaW1UcmFuc2NyaXB0cy5wdXNoIGUucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0XG5cdFx0XHRcdGludGVyaW1UcmFuc2NyaXB0ICs9IGUucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0XG5cblx0XHRcdFx0Y29uc29sZS5sb2cgJ3NwZWVjaCcsICdbZXZlbnRdIHJlc3VsdCA6IGludGVyaW0gOiAnICsgaW50ZXJpbVRyYW5zY3JpcHRcblxuXHRcdFx0XHQjIEZpcmVcblx0XHRcdFx0QGVtaXQgRXZlbnRzLlJlY29nbml0aW9uLlJlc3VsdC5JbnRlcmltLCBpbnRlcmltVHJhbnNjcmlwdCwgaW50ZXJpbVRyYW5zY3JpcHRzLCBlLCBAXG5cblx0IyBFcnJvclxuXHRfb25FcnJvcjogKGUpID0+XG5cdFx0Y29uc29sZS5sb2cgJ3NwZWVjaCcsICdbZXZlbnRdICcgKyBlXG5cblx0XHRpZ25vcmVFbmQgPSBlLmVycm9yXG5cblx0XHQjIEZpcmVcblx0XHRAZW1pdCBFdmVudHMuUmVjb2duaXRpb24uRXJyb3IsIGUsIEBcblxuXG5cdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIEFuYWx5c2VyIFJlbmRlclxuXHQjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHQjIFN0YXJ0XG5cdF9vblJlbmRlclN0YXJ0OiA9PlxuXHRcdHJldHVybiB1bmxlc3MgYW5hbHlzZXJcblx0XHRyZXR1cm4gdW5sZXNzIHJlY29nbml6aW5nXG5cblx0XHRpZiByZW5kZXJJZFxuXHRcdFx0Y29uc29sZS5sb2cgJ3NwZWVjaCcsICdyZW5kZXIgOiB1cGRhdGUnXG5cdFx0XHRjYW5jZWxBbmltYXRpb25GcmFtZShyZW5kZXJJZClcblx0XHRlbHNlIGNvbnNvbGUubG9nICdzcGVlY2gnLCAncmVuZGVyIDogc3RhcnQnXG5cdFx0XG5cdFx0cmVuZGVySWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoICgpID0+IEBfb25SZW5kZXJTdGFydCgpIClcblx0XHRzdG9yYWdlQXJyID0gbmV3IFVpbnQ4QXJyYXkoYW5hbHlzZXIuZnJlcXVlbmN5QmluQ291bnQpXG5cdFx0YW5hbHlzZXIuZ2V0Qnl0ZUZyZXF1ZW5jeURhdGEoc3RvcmFnZUFycilcblxuXHRcdCMgRmlyZVxuXHRcdEBlbWl0IEV2ZW50cy5BbmFseXNlci5SZW5kZXIsIHN0b3JhZ2VBcnIsIEBcblxuXHQjIFN0b3Bcblx0X29uUmVuZGVyRW5kOiA9PlxuXHRcdGNvbnNvbGUubG9nICdzcGVlY2gnLCAncmVuZGVyIDogc3RvcCdcblxuXHRcdCNcblx0XHRyZXR1cm4gdW5sZXNzIHJlbmRlcklkXG5cdFx0Y2FuY2VsQW5pbWF0aW9uRnJhbWUocmVuZGVySWQpXG5cdFx0cmVuZGVySWQgPSB1bmRlZmluZWRcblxuXHRcdCMgRmlyZVxuXHRcdEBlbWl0IEV2ZW50cy5BbmFseXNlci5FbmQsIEBcblxuXHQjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBFdmVudCBIZWxwZXJcblx0IyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdG9uUmVjb2duaXRpb25TdGFydDogKGNiKSAtPiBAb24gRXZlbnRzLlJlY29nbml0aW9uLlN0YXJ0LCBjYlxuXHRvblJlY29nbml0aW9uRW5kOiAoY2IpIC0+IEBvbiBFdmVudHMuUmVjb2duaXRpb24uRW5kLCBjYlxuXHRvblJlY29nbml0aW9uU3BlZWNoU3RhcnQ6IChjYikgLT4gQG9uIEV2ZW50cy5SZWNvZ25pdGlvbi5TcGVlY2guU3RhcnQsIGNiXG5cdG9uUmVjb2duaXRpb25TcGVlY2hFbmQ6IChjYikgLT4gQG9uIEV2ZW50cy5SZWNvZ25pdGlvbi5TcGVlY2guRW5kLCBjYlxuXHRvblJlY29nbml0aW9uUmVzdWx0RmluYWw6IChjYikgLT4gQG9uIEV2ZW50cy5SZWNvZ25pdGlvbi5SZXN1bHQuRmluYWwsIGNiXG5cdG9uUmVjb2duaXRpb25SZXN1bHRJbnRlcmltOiAoY2IpIC0+IEBvbiBFdmVudHMuUmVjb2duaXRpb24uUmVzdWx0LkludGVyaW0sIGNiXG5cdG9uUmVjb2duaXRpb25FcnJvcjogKGNiKSAtPiBAb24gRXZlbnRzLlJlY29nbml0aW9uLkVycm9yLCBjYlxuXG5cdG9uQW5hbHlzZXJSZW5kZXI6IChjYikgLT4gQG9uIEV2ZW50cy5BbmFseXNlci5SZW5kZXIsIGNiXG5cdG9uQW5hbHlzZXJFbmQ6IChjYikgLT4gQG9uIEV2ZW50cy5BbmFseXNlci5FbmQsIGNiXG5cbiNcbndpbmRvdy5TcGVlY2ggPSBTcGVlY2ggaWYgd2luZG93IiwiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJb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
