/**
* Copyright 2015 Nick Stanish
*
*/

var AudioManager = function () {
  window.audioManager = this;

  this.source = null;
  this.mediaPlayerID = "#media-player";
  this.audioChooserID = "#audio-chooser";
  this.voiceButtonID = "#voice-chooser";
  
  try {
    this.audioContext = new AudioContext();
    this.analyser = null;
    this.lowAnalyser = null;
  } catch (e) {
    console.log(e);
  }

  var canvas = document.getElementById("canvas");

  var $fileChooser = $(this.audioChooserID);
  var $voiceChooser = $(this.voiceButtonID);
  var $playButton = $("#media-controls [data-control='play']");
  var $pauseButton = $("#media-controls [data-control='pause']");
  var $stopButton = $("#media-controls [data-control='stop']");

  $fileChooser.on("change", onFileChosen.bind(this));
  $voiceChooser.on('click', onVoiceChosen.bind(this));
  $playButton.on("click", onPlayClicked.bind(this));
  $pauseButton.on("click", onPauseClicked.bind(this));
  $stopButton.on("click", onStopClicked.bind(this));

  function onVoiceChosen (event) {
    if (!navigator.getUserMedia) {
      return alert("Your browser doesn't support this feature");
    }
    var constrants = {
      audio: true
    };
    var callback = function (stream) {
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.setupAudioNodes(this.source, null);
      this.status = 1;
      this.setControlsToStarted();
      this.setControlsToPlaying();
    };
    var errorCallback = function (error) {
      console.error(error);
    };
    navigator.getUserMedia(constrants, callback.bind(this), errorCallback);

  }

  function onFileChosen (event) {
    if (event.target.files.length !== 0) {
      //only process the first file
      this.file = event.target.files[0];
      this.fileName = this.file.name;
      $("#now-playing").text(this.fileName);
      this.readCurrentFile();
    }
  }

  function onPlayClicked (event) {
    if (this.audioContext && this.audioContext.state === "suspended"){
      this.audioContext.resume().then(this.setControlsToPlaying.bind(this));
    }
  }
  function onPauseClicked (event) {
    if (this.audioContext && this.audioContext.state === "running"){
      this.audioContext.suspend().then(this.setControlsToPaused.bind(this));
    }
  }

  function onStopClicked (event) {
    if (this.audioContext){
      this.stop();
    }
  }

};

AudioManager.prototype.createDefaultAnalyser = function (fftSize, smoothing) {
  var analyser = this.audioContext.createAnalyser();
  analyser.smoothingTimeConstant = smoothing || 0.85;
  analyser.fftSize = fftSize || 256; 
  return analyser;
};

AudioManager.prototype.setupAudioNodes = function (source, destination) {
  var audioContext = this.audioContext;
  var analyser = this.createDefaultAnalyser();
  var lowAnalyser = this.createDefaultAnalyser();

  var filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 440;

  source.connect(analyser);
  if (destination) {
    analyser.connect(destination);
  }

  analyser.connect(filter);
  filter.connect(lowAnalyser);
  
  this.analyser = analyser;
  this.lowAnalyser = lowAnalyser;
  
};

AudioManager.prototype.readCurrentFile = function () {
  
  var self = this;
  var fileReader = new FileReader();

  fileReader.onload = function (e) {
    var fileResult = e.target.result;
    var audioContext = self.audioContext;
    if (audioContext === null) {
      return;
    };
    audioContext.decodeAudioData(fileResult, function (buffer) {
      console.log("successfully loaded file");
      self.setControlsToStarted();
      self.start.call(self, audioContext, buffer);
    }, function (e) {
        console.log(e);
    });
  };
  fileReader.onerror = function(e) {
    console.log(e);
  };
  fileReader.readAsArrayBuffer(this.file);
  
};

AudioManager.prototype.stop = function () {
  this.status = 0;
  $("#now-playing").text(null);
  if (this.source) {
    if (this.source.mediaStream) {
      var mediaStream = this.source.mediaStream;
      mediaStream.active = false;
      if (mediaStream.getAudioTracks()) {
        // this corrects record light still being visible
        for (var i = 0; i < mediaStream.getAudioTracks().length; i++){
          if (mediaStream.getAudioTracks()[i].stop) {
            mediaStream.getAudioTracks()[i].stop();  
          }
        }
      }
      
      this.source.mediaStream = null;
    } else {
      this.source.stop();
    }
  }
  // reset the audio input form so it can be submitted again
  $(this.audioChooserID).wrap('<form>').closest('form').get(0).reset();
  $(this.audioChooserID).unwrap();
  this.source = null;
  this.setControlsToStopped();
};

AudioManager.prototype.start = function (audioContext, buffer) {
  var self = this;
  var audioBufferSouceNode = audioContext.createBufferSource();
  audioBufferSouceNode.buffer = buffer;

  this.setupAudioNodes(audioBufferSouceNode, audioContext.destination);

  if (!audioBufferSouceNode.start) {
      audioBufferSouceNode.start = audioBufferSouceNode.noteOn //in old browsers use noteOn method
      audioBufferSouceNode.stop = audioBufferSouceNode.noteOff //in old browsers use noteOn method
  };

  
  this.source = audioBufferSouceNode;
  audioBufferSouceNode.onended = function() {
    console.log("song ended");
    self.status = 0;
    self.source = null;
    self.setControlsToStopped();
  };
  this.setControlsToPlaying();
  audioBufferSouceNode.start(0);
  this.status = 1;
};

AudioManager.prototype.setControlsToStarted = function () {
  $(this.mediaPlayerID).removeClass("off").addClass("on");
  $(this.audioChooserID).addClass("no-select");
};

AudioManager.prototype.setControlsToStopped = function () {
  $(this.mediaPlayerID).addClass("off").removeClass("on");
  $(this.audioChooserID).removeClass("no-select");
};

AudioManager.prototype.setControlsToPaused = function () {
  var $mediaPlayer = $(this.mediaPlayerID);
  $mediaPlayer.removeClass("playing");
  $mediaPlayer.addClass("paused");
};

AudioManager.prototype.setControlsToPlaying = function () {
  var $mediaPlayer = $(this.mediaPlayerID);
  $mediaPlayer.removeClass("paused");
  $mediaPlayer.addClass("playing");
};

AudioManager.prototype.isPlaying = function () {
  return this.status === 1;
};

AudioManager.prototype.getTimeDomainData = function () {
  var analyser = this.analyser;

  var bufferLength = analyser.frequencyBinCount;
  var data = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(data);
  return data;
};
AudioManager.prototype.getFrequencyData = function () {
  var analyser = this.analyser;
   if (!analyser) {
    console.warn("no analyser");
    return null;
  }
  
  var bufferLength = analyser.frequencyBinCount;
  var data = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(data);
  return data;
};

AudioManager.prototype.getLowFrequencyData = function () {

  var analyser = this.lowAnalyser;
  if (!analyser) {
    console.warn("no low analyser");
    return null;
  }
  
  var bufferLength = analyser.frequencyBinCount;
  var data = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(data);
  return data;
};

AudioManager.prototype.getAverageFrequencyStrength = function () {
  if (this.isPlaying()) {
    var data = this.getFrequencyData();
    if (data && data.length) {
      var length = data.length;

      var strength = 0;
      for (var i = 0; i < length; i++){
        strength += data[i];
      }
      return (strength / 255) / length;
    }
  }
 
  return null;
};

AudioManager.prototype.getAverageLowFrequencyStrength = function () {
  if (this.isPlaying()) {
    var data = this.getLowFrequencyData();
    if (data && data.length) {
      var length = data.length;
      if (length > 8) {
        length = 8;
      }

      var strength = 0;
      for (var i = 0; i < length; i++){
        strength += data[i];
      }
      return (strength / 255) / length;
    }
  }
 
  return null;
};

AudioManager.prototype.getNormalizedFrequencyData = function () {
  if (this.isPlaying()) {
    var data = this.getFrequencyData();
    if (data && data.length) {
      var length = data.length;
      var result = {
        average: 0,
        bins: [],
        max: 0,
        min: 255
      };

      var nBins = 8;
      var nPerBin = length / nBins;

      var strength = 0;
      for (var i = 0; i < length; i++){
        var n = Math.floor(i / nPerBin);
        if (!result.bins[n]){
          result.bins[n] = data[i];
        } else {
          result.bins[n] += data[i];
        }
        

        if (data[i] > result.max) {
          result.max = data[i];
        }
        if (data[i] < result.min) {
          result.min = data[i];
        }
        strength += data[i];
      }

      for (var i = 0; i < result.bins.length; i++){
        result.bins[i] = result.bins[i] / 255 / nPerBin;
      }
      result.max /= 255;
      result.min /= 255;
      result.average = (strength / 255) / length;
      return result;
    }
  }
 
  return null;
};


module.exports = AudioManager;