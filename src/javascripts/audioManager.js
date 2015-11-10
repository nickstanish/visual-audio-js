/**
* Copyright 2015 Nick Stanish
*
*/

var _ = require("lodash/lodash.js");

var AudioManager = function () {
  window.audioManager = this;

  this.source = null;
  this.mediaPlayerID = "#media-player";
  this.audioChooserID = "#audio-chooser";
  
  try {
    this.audioContext = new AudioContext();
    this.analyser = null;
  } catch (e) {
    console.log(e);
  }

  var canvas = document.getElementById("canvas");

  var $fileChooser = $(this.audioChooserID);
  var $playButton = $("#media-controls [data-control='play']");
  var $pauseButton = $("#media-controls [data-control='pause']");

  $fileChooser.on("change", onFileChosen.bind(this));
  $playButton.on("click", onPlayClicked.bind(this));
  $pauseButton.on("click", onPauseClicked.bind(this));

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
        // that._visualize(audioContext, buffer);
      console.log("successfully loaded file");
      $(self.mediaPlayerID).removeClass("off").addClass("on");
      $(self.audioChooserID).addClass("no-select");
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

AudioManager.prototype.start = function (audioContext, buffer) {
  var audioBufferSouceNode = audioContext.createBufferSource();
  var analyser = audioContext.createAnalyser();
  // analyser.smoothingTimeConstant = 0.85;
  var that = this;
  //connect the source to the analyser
  audioBufferSouceNode.connect(analyser);
  //connect the analyser to the destination(the speaker), or we won't hear the sound
  analyser.connect(audioContext.destination);
  //then assign the buffer to the buffer source node
  audioBufferSouceNode.buffer = buffer;
  //play the source
  if (!audioBufferSouceNode.start) {
      audioBufferSouceNode.start = audioBufferSouceNode.noteOn //in old browsers use noteOn method
      audioBufferSouceNode.stop = audioBufferSouceNode.noteOff //in old browsers use noteOn method
  };
  //stop the previous sound if any
  // if (this.animationId !== null) {
  // cancelAnimationFrame(this.animationId);
  //}
  if (this.source !== null) {
      // this.source.stop(0);
  }
  audioBufferSouceNode.start(0);
  this.status = 1;
  this.source = audioBufferSouceNode;
  audioBufferSouceNode.onended = function() {
    console.log("song ended");
    // that._audioEnd(that);
  };
  this.setControlsToPlaying();
  // this._updateInfo('Playing ' + this.fileName, false);
  // this.info = 'Playing ' + this.fileName;
  // document.getElementById('fileWrapper').style.opacity = 0.2;
  // this._drawSpectrum(analyser);
  this.analyser = analyser;
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

AudioManager.prototype.getFrequencyData = function () {
  var analyser = this.analyser;

  var bufferLength = analyser.frequencyBinCount;
  var data = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(data);
  return data;
};



module.exports = AudioManager;