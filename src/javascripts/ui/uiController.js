/* globals $ */
import FileSource from 'audio/source/fileSource';
import MicSource from 'audio/source/micSource';

import { AUDIO_STATE } from 'audio/audioManager';
import { SOURCE_TYPES } from 'audio/source/mediaSource';

const mediaPlayerID = "#media-player";
const audioChooserID = "#audio-chooser";
const fileChooserID = "#file-chooser";
const voiceButtonID = "#voice-chooser";
const mediaButtonID = ".media-btn";

class UIController {
  constructor(audioManager) {
    this.audioManager = audioManager;
  }

  bind () {
    this.audioManager.registerStateListener(this.onAudioStateChange.bind(this));
    this.audioManager.registerQueueListener(this.onQueueChanged.bind(this));

    const $fileChooser = $(fileChooserID);
    const $voiceChooser = $(voiceButtonID);
    const $playButton = $("#media-controls [data-control='play']");
    const $pauseButton = $("#media-controls [data-control='pause']");
    const $stopButton = $("#media-controls [data-control='stop']");

    $fileChooser.on("change", (event) => { this.onFileChosen(event) });
    $voiceChooser.on('click', (event) => { this.onVoiceChosen(event) });
    $playButton.on("click", (event) => { this.onPlayClicked(event) });
    $pauseButton.on("click", (event) => { this.onPauseClicked(event) });
    $stopButton.on("click", (event) => { this.onStopClicked(event) });

    $("body").on("click", "#media-queue [data-queue-index].close", (event) => this.onRemoveQueueItem(event))

  }

  onAudioStateChange(previousState, newState) {
    console.log("on state change %s %s", previousState, newState);
    const sourceInfo = this.audioManager.getCurrentSourceInfo();
    if (sourceInfo && sourceInfo.type === SOURCE_TYPES.MIC) {
      this.setMicControls();
      return;
    }

    if (previousState === AUDIO_STATE.OFF && newState === AUDIO_STATE.PLAYING) {
      this.setControlsToStarted();
      this.setQueueControls();
    }
    switch (newState) {
      case AUDIO_STATE.OFF: {
        this.setControlsToStopped();
        this.setNowPlaying(null);
        this.resetQueueControls();
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
      const files = Array.prototype.slice.call(event.target.files);
      files.forEach((file) => {
        const source = new FileSource(audioContext, file);
        this.addSource(source);
      });
      this.resetFileChooser();
    }
  }

  onVoiceChosen () {
    const sourceInfo = this.audioManager.getCurrentSourceInfo();
    if (sourceInfo && sourceInfo.type === SOURCE_TYPES.MIC) {
      // already active
      this.resetMicControls();
      this.audioManager.stop();
    } else {
      const audioContext = this.audioManager.getAudioContext();
      const source = new MicSource(audioContext);
      this.addSource(source);
    }
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

  resetFileChooser() {
    // reset the audio input form so it can be submitted again
    const $audioChooser = $(audioChooserID);
    $audioChooser.wrap('<form>').closest('form').get(0).reset();
    $audioChooser.unwrap();
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

  setMicControls () {
    const $voiceButton = $(voiceButtonID);
    const $fileChooser = $(fileChooserID);
    $fileChooser.find("input, .media-btn").attr("disabled", "disabled");
    $voiceButton.addClass("active");
  }

  setQueueControls () {
    const $voiceButton = $(voiceButtonID);
    $voiceButton.find(`${mediaButtonID}`).attr("disabled", "disabled");
  }

  resetQueueControls() {
    const $voiceButton = $(voiceButtonID);
    $voiceButton.find(`${mediaButtonID}`).removeAttr("disabled");
  }

  resetMicControls () {
    const $voiceButton = $(voiceButtonID);
    const $fileChooser = $(fileChooserID);
    $fileChooser.find(`input, ${mediaButtonID}`).removeAttr("disabled");
    $voiceButton.removeClass("active");
  }

  renderMediaSource(source, index) {
    const closeButton = `<button type="button" class="close" data-queue-index=${index} aria-label="Remove"><span aria-hidden="true">×</span></button>`;
    return `<li>${closeButton}<span class="title" data-index="${index}">${source.label}</span></li>`;
  }

  onRemoveQueueItem (event) {
    const index = $(event.target).attr("data-queue-index");
    this.audioManager.removeQueueIndex(index);
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
