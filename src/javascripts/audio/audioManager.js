/**
* Copyright 2015 Nick Stanish
*
*/

/* global Uint8Array */

import MediaQueue from 'audio/mediaQueue';

export const AUDIO_STATE = {
  OFF: "OFF",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED"
};

class AudioManager {
  constructor() {
    this.mediaQueue = new MediaQueue();
    this.audioContext = new AudioContext();
    this.analyser = null;
    this.state = AUDIO_STATE.OFF;
    this.currentMediaSource = null;
    this.listeners = [];
  }

  getAudioContext() {
    return this.audioContext;
  }

  isPlaying() {
    return this.state === AUDIO_STATE.PLAYING;
  }

  addMediaSource (mediaSource) {
    if (this.mediaQueue.size() === 0 && !this.isPlaying()) {
      this.connectMediaSource(mediaSource);
    } else {
      this.mediaQueue.enqueue(mediaSource);
    }
  }

  setState (newState) {
    const previousState = this.state;
    this.state = newState;
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](previousState, newState);
    }
  }

  registerStateListener(callback) {
    this.listeners.push(callback);
  }

  getCurrentSourceInfo() {
    return {
      label: this.currentMediaSource.getLabel(),
      metadata: this.currentMediaSource.getMetaData(),
      type: this.currentMediaSource.getType()
    };
  }

  connectMediaSource (mediaSource) {
    const self = this;
    this.currentMediaSource = mediaSource;
    const audioNode = this.currentMediaSource.getAudioNode();
    audioNode.onended = () => {
      console.log("song ended");
      if (self.mediaQueue.size() > 0) {
        const nextSource = self.mediaQueue.dequeue();
        self.connectMediaSource(nextSource);
      } else {
        self.currentMediaSource = null;
        self.setState(AUDIO_STATE.OFF);
      }
    };

    let destination;
    if (this.currentMediaSource.shouldConnectDestination()) {
      destination = this.audioContext.destination;
    }

    this.setupAudioNodes(audioNode, destination);
    if (audioNode.start) {
      audioNode.start(0);
    }

    this.setState(AUDIO_STATE.PLAYING);
  }

  resume () {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().then(() => this.setState(AUDIO_STATE.PLAYING));
    }
  }

  pause () {
    if (this.audioContext.state === "running") {
      this.audioContext.suspend().then(() => this.setState(AUDIO_STATE.PAUSED));
    }
  }

  stop () {
    if (this.currentMediaSource && this.currentMediaSource.getAudioNode()) {
      if (this.currentMediaSource.getAudioNode().mediaStream) {
        const mediaStream = this.currentMediaSource.getAudioNode().mediaStream;
        if (mediaStream.getAudioTracks()) {
          for (let i = 0; i < mediaStream.getAudioTracks().length; i++){
            if (mediaStream.getAudioTracks()[i].stop) {
              mediaStream.getAudioTracks()[i].stop();
            }
          }
        }
      } else {
        this.currentMediaSource.getAudioNode().stop();
      }
    }
    this.currentMediaSource = null;
    this.setState(AUDIO_STATE.OFF);
  }

  createDefaultAnalyser (fftSize = 256, smoothing = 0.85) {
    const analyser = this.audioContext.createAnalyser();
    analyser.smoothingTimeConstant = smoothing;
    analyser.fftSize = fftSize;
    return analyser;
  }

  setupAudioNodes (source, destination) {
    const analyser = this.createDefaultAnalyser();

    source.connect(analyser);
    if (destination) {
      analyser.connect(destination);
    }

    this.analyser = analyser;
  }

  getFrequencyBinCount() {
    return this.analyser.frequencyBinCount;
  }

  getNormalizedFrequencyData () {
    if (this.isPlaying()) {
      const data = this.getFrequencyData();
      if (data && data.length) {
        const length = data.length;
        const result = {
          average: 0,
          bins: [],
          max: 0,
          min: 255
        };

        const nBins = 8;
        const nPerBin = length / nBins;

        let strength = 0;
        for (let i = 0; i < length; i++){
          const n = Math.floor(i / nPerBin);
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

        for (let i = 0; i < result.bins.length; i++){
          result.bins[i] = result.bins[i] / 255 / nPerBin;
        }
        result.max /= 255;
        result.min /= 255;
        result.average = (strength / 255) / length;
        return result;
      }
    }

    return null;
  }

  getFrequencyData () {
    const analyser = this.analyser;
     if (!analyser) {
      console.warn("no analyser");
      return null;
    }

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData () {
    const analyser = this.analyser;

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(data);
    return data;
  }


}

export default AudioManager;



/*
  function onVoiceChosen (event) {
    if (!navigator.getUserMedia) {
      return alert("Your browser doesn't support this feature");
    }
    var constraints = {
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
    navigator.getUserMedia(constraints, callback.bind(this), errorCallback);

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

  */

/*
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

*/
