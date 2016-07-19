/* globals $ */
import FileSource from 'audio/source/fileSource';
import MicSource from 'audio/source/micSource';

import { AUDIO_STATE } from 'audio/audioManager';

const mediaPlayerID = "#media-player";
const audioChooserID = "#audio-chooser";
const voiceButtonID = "#voice-chooser";

class UIController {
  constructor(audioManager) {
    this.audioManager = audioManager;
  }

  bind () {
    this.audioManager.registerStateListener(this.onAudioStateChange.bind(this));
    this.audioManager.registerQueueListener(this.onQueueChanged.bind(this));

    const $fileChooser = $(audioChooserID);
    const $voiceChooser = $(voiceButtonID);
    const $playButton = $("#media-controls [data-control='play']");
    const $pauseButton = $("#media-controls [data-control='pause']");
    const $stopButton = $("#media-controls [data-control='stop']");

    $fileChooser.on("change", (event) => { this.onFileChosen(event) });
    $voiceChooser.on('click', (event) => { this.onVoiceChosen(event) });
    $playButton.on("click", (event) => { this.onPlayClicked(event) });
    $pauseButton.on("click", (event) => { this.onPauseClicked(event) });
    $stopButton.on("click", (event) => { this.onStopClicked(event) });

  }

  onAudioStateChange(previousState, newState) {
    console.log("on state change %s %s", previousState, newState);
    if (previousState === AUDIO_STATE.OFF && newState === AUDIO_STATE.PLAYING) {
      this.setControlsToStarted();
    }
    switch (newState) {
      case AUDIO_STATE.OFF: {
        this.setControlsToStopped();
        this.setNowPlaying(null);
        break;
      }
      case AUDIO_STATE.PLAYING: {
        this.setControlsToPlaying();
        this.displayCurrentSong();
        break;
      }
      case AUDIO_STATE.PAUSED: {
        this.setControlsToPaused();
        break;
      }
      default: break;
    }
    this.renderMediaQueue();
  }

  displayCurrentSong() {
    const sourceInfo = this.audioManager.getCurrentSourceInfo();
    this.setNowPlaying(sourceInfo.label);
  }

  onQueueChanged() {
    this.displayCurrentSong();
    this.renderMediaQueue();
  }

  addSource (source) {
    source.onLoaded(() => {
      console.log("SUCCESS");
      this.audioManager.addMediaSource(source);
    }, () => {
      console.log("ERROR");
    });
  }

  onFileChosen (event) {
    if (event.target.files.length !== 0) {
      //only process the first file
      const audioContext = this.audioManager.getAudioContext();
      const file = event.target.files[0];
      const source = new FileSource(audioContext, file);
      this.addSource(source);
    }
  }

  onVoiceChosen () {
    const audioContext = this.audioManager.getAudioContext();
    const source = new MicSource(audioContext);
    this.addSource(source);
  }

  onPlayClicked () {
    this.audioManager.resume();
  }
  onPauseClicked () {
    this.audioManager.pause();
  }

  onStopClicked (event) {
    this.audioManager.stop();
  }

  setNowPlaying(text) {
    $("#now-playing").text(text);
  }

  setControlsToStarted () {
    $(mediaPlayerID).removeClass("off").addClass("on");
    // $(audioChooserID).addClass("no-select");
  }

  setControlsToStopped () {
    $(mediaPlayerID).addClass("off").removeClass("on");
    $(audioChooserID).removeClass("no-select");
  }

  setControlsToPaused () {
    const $mediaPlayer = $(mediaPlayerID);
    $mediaPlayer.removeClass("playing");
    $mediaPlayer.addClass("paused");
  }

  setControlsToPlaying () {
    const $mediaPlayer = $(mediaPlayerID);
    $mediaPlayer.removeClass("paused");
    $mediaPlayer.addClass("playing");
  }

  renderMediaSource(source, index) {
    const closeButton = '<button type="button" class="close" aria-label="Remove"><span aria-hidden="true">×</span></button>';
    return `<li><span class="title" data-index="${index}">${source.label}</span>${closeButton}</li>`;
  }

  renderMediaQueue () {
    const $mediaQueue = $("#media-queue");

    const children = this.audioManager.getQueueInfo().map((source, index) => {
      return this.renderMediaSource(source, index);
    });
    const list = $('<ul></ul>').append(children);
    $mediaQueue.empty().append(list);

  }
}

export default UIController;
