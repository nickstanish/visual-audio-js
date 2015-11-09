var _ = require("lodash/lodash.js");

var AudioManager = function () {
  var self = this;
  this.source = null;
  
  try {
    this.audioContext = new AudioContext();
  } catch (e) {
    console.log(e);
  }

  var canvas = document.getElementById("canvas");
  var fileChooser = document.getElementById("audio-chooser");
  var testButton = document.getElementById("test-song");


  fileChooser.onchange = function (event) {
    //the if statement fixes the file selction cancle, because the onchange will trigger even the file selection been canceled
    if (event.target.files.length !== 0) {
      //only process the first file
      self.file = event.target.files[0];
      self.fileName = self.file.name;
      self.readCurrentFile();
    }

  };
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
  // this._updateInfo('Playing ' + this.fileName, false);
  // this.info = 'Playing ' + this.fileName;
  // document.getElementById('fileWrapper').style.opacity = 0.2;
  // this._drawSpectrum(analyser);


};




module.exports = AudioManager;