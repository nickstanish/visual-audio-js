/**
* Copyright 2016 Nick Stanish
*
*/

const EventEmitter = require('eventemitter3');

export const MEDIA_PLAYER_EVENTS = {
  PLAYING: 'PLAYING',
  ENDED: 'ENDED'
}

const STATE = {
  OFF: "OFF",
  PLAYING: "PLAYING"
}

const DEFAULT_SMOOTHING = 0.85;

class MediaPlayer {
  constructor(audioContext, analyticsProvider) {
    this.audioContext = audioContext;
    this.emitter = new EventEmitter();
    this.currentMediaSource = null;
    this.analyser = null;
    this._state = STATE.OFF; // duplicating state because audioContext will say running from the start
    this._mediaLoading = false;
  }

  getCurrentMediaSource() {
    return this.currentMediaSource;
  }

  getAnalyser() {
    return this.analyser;
  }

  isActive () {
    return this.isPlaying() || !!this.currentMediaSource;
  }

  isLoading () {
    return this._mediaLoading;
  }

  isPlaying () {
    return this.audioContext.state === "running" && this._state === STATE.PLAYING && !this.isLoading();
  }

  isSuspended () {
    return this.audioContext.state === "suspended";
  }

  on (event, callback) {
    this.emitter.on(event, callback);
  }

  off (event, callback) {
    this.emitter.removeListener(event, callback);
  }

  play (mediaSource) {
    if (this.isActive()) {
      this.stop();
    }

    this.currentMediaSource = mediaSource;
    if (!mediaSource.isLoaded()) {
      this._mediaLoading = true;
      mediaSource.load().then(() => {
        this._connectMediaSource(mediaSource);
        this._mediaLoading = false;
      }).catch((error) => {
        console.error(error);
        this.currentMediaSource = null;
        this._mediaLoading = false;
      });
      return;
    }

    this._connectMediaSource(mediaSource);
  }

  _createDefaultAnalyser (fftSize = 256, smoothing = DEFAULT_SMOOTHING) {
    const analyser = this.audioContext.createAnalyser();
    analyser.smoothingTimeConstant = smoothing;
    analyser.fftSize = fftSize;
    return analyser;
  }

  _onMediaEnded() {
    this.stop();
    this.emitter.emit(MEDIA_PLAYER_EVENTS.ENDED);
  }

  _connectMediaSource (mediaSource) {
    const audioNode = mediaSource.getAudioNode();

    if (mediaSource.onEnded) {
      mediaSource.onEnded(() => this._onMediaEnded());
    } else {
      audioNode.onended = () => this._onMediaEnded();
    }

    let destination;
    if (mediaSource.shouldConnectDestination()) {
      destination = this.audioContext.destination;
    }

    this.setupAudioNodes(audioNode, destination);
    if (audioNode.start) {
      audioNode.start(0);
    } else if (mediaSource.play) {
      mediaSource.play();
    }
    this._state = STATE.PLAYING;
    this.emitter.emit(MEDIA_PLAYER_EVENTS.PLAYING);
  }

  setupAudioNodes (source, destination) {
    const analyser = this._createDefaultAnalyser();

    source.connect(analyser);
    if (destination) {
      analyser.connect(destination);
    }

    this.analyser = analyser;
  }

  resume () {
    if (this.isSuspended()) {
      return this.audioContext.resume();
    }
    return Promise.resolve();
  }

  pause () {
    if (this.isPlaying()) {
      return this.audioContext.suspend();
    }
    return Promise.resolve();
  }

  stop () {
    if (!this.isActive()) {
      return;
    }
    const audioNode = this.currentMediaSource.getAudioNode();
    this.currentMediaSource = null;
    this._state = STATE.OFF;
    if (!audioNode) {
      return;
    }
    if (audioNode.mediaStream && audioNode.mediaStream.getAudioTracks()) {
      const mediaStream = audioNode.mediaStream;
      for (let i = 0; i < mediaStream.getAudioTracks().length; i++){
        if (mediaStream.getAudioTracks()[i].stop) {
          mediaStream.getAudioTracks()[i].stop();
        }
      }
    } else if (audioNode.stop) {
      audioNode.stop();
    }
    audioNode.disconnect();
  }
}

export default MediaPlayer;
