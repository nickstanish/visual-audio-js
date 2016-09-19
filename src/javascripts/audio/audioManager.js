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

const DEFAULT_SMOOTHING = 0.5; // 0.85

class AudioManager {
  constructor() {
    this.mediaQueue = new MediaQueue();
    this.audioContext = new AudioContext();
    this.analyser = null;
    this.state = AUDIO_STATE.OFF;
    this.currentMediaSource = null;
    this.stateListeners = [];
    this.queueListeners = [];
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
    } else if (mediaSource.shouldAllowQueueing()) {
      this.mediaQueue.enqueue(mediaSource);
      this.notifyQueueListeners();
    } else {
      console.error("Attempt to enqueue source that doesn't allow queueing");
    }

  }

  notifyQueueListeners() {
    for (let i = 0; i < this.stateListeners.length; i++) {
      this.queueListeners[i]();
    }
  }

  notifyStateListeners (previousState, newState) {
    for (let i = 0; i < this.stateListeners.length; i++) {
      this.stateListeners[i](previousState, newState);
    }
  }

  setState (newState) {
    const previousState = this.state;
    this.state = newState;
    this.notifyStateListeners(previousState, newState);
  }

  registerQueueListener(callback) {
    this.queueListeners.push(callback);
  }

  registerStateListener(callback) {
    this.stateListeners.push(callback);
  }

  getQueueInfo() {
    return this.mediaQueue.getDisplayValues();
  }

  removeQueueIndex(index) {
    this.mediaQueue.popIndex(index);
    this.notifyQueueListeners();
  }

  getCurrentSourceInfo() {
    if (!this.currentMediaSource) {
      return null;
    }
    return {
      label: this.currentMediaSource.getLabel(),
      metadata: this.currentMediaSource.getMetaData(),
      type: this.currentMediaSource.getType()
    };
  }

  connectMediaSource (mediaSource) {
    this.currentMediaSource = mediaSource;
    const audioNode = this.currentMediaSource.getAudioNode();
    audioNode.onended = () => {
      console.log("song ended");
      if (this.mediaQueue.size() > 0) {
        const nextSource = this.mediaQueue.dequeue();
        this.notifyQueueListeners
        this.connectMediaSource(nextSource);
      } else {
        this.currentMediaSource = null;
        this.setState(AUDIO_STATE.OFF);
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
    const { currentMediaSource } = this;
    if (currentMediaSource && currentMediaSource.getAudioNode()) {
      const audioNode = currentMediaSource.getAudioNode();

      if (audioNode.mediaStream) {
        const mediaStream = audioNode.mediaStream;
        if (mediaStream.getAudioTracks()) {
          for (let i = 0; i < mediaStream.getAudioTracks().length; i++){
            if (mediaStream.getAudioTracks()[i].stop) {
              mediaStream.getAudioTracks()[i].stop();
            }
          }
        }
      } else {
        if (audioNode.stop) {
          audioNode.stop();
        }
      }
      audioNode.disconnect();
    }
    this.currentMediaSource = null;
    this.mediaQueue.clear();
    this.setState(AUDIO_STATE.OFF);
  }

  createDefaultAnalyser (fftSize = 256, smoothing = DEFAULT_SMOOTHING) {
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
