/* globals $ */
import FileSource from '../audio/source/fileSource';
import MicSource from '../audio/source/micSource';
import SoundCloudSource from '../audio/source/soundCloudSource';
import AudioElementSource from '../audio/source/audioElementSource';

import { AUDIO_STATE } from '../audio/audioManager';
import { SOURCE_TYPES } from '../audio/source/mediaSource';

const mediaPlayerID = "#media-player";
const audioChooserID = "#audio-chooser";
const fileChooserID = "#file-chooser";
const voiceButtonID = "#voice-chooser";
const mediaButtonID = ".media-btn";
const urlInputId = "#urlSource";
const urlFormId = "#urlSourceForm";

const SOUNDCLOUD = /soundcloud\.com/;

class UIController {
  constructor(audioManager, store) {
    this.audioManager = audioManager;
    this.store = store;
  }

  registerUI () {
    this.audioManager.registerStateListener(this.onAudioStateChange.bind(this));
    this.audioManager.registerQueueListener(this.onQueueChanged.bind(this));

    const $fileChooser = $(fileChooserID);
    const $voiceChooser = $(voiceButtonID);
    const $playButton = $("#media-controls [data-control='play']");
    const $pauseButton = $("#media-controls [data-control='pause']");
    const $stopButton = $("#media-controls [data-control='stop']");
    const $nextButton = $("#media-controls [data-control='next']");
    const $urlInput = $(urlInputId);
    const $urlForm = $(urlFormId);

    $fileChooser.on("change", (event) => { this.onFileChosen(event) });
    $voiceChooser.on('click', (event) => { this.onVoiceChosen(event) });
    $playButton.on("click", (event) => { this.onPlayClicked(event) });
    $pauseButton.on("click", (event) => { this.onPauseClicked(event) });
    $stopButton.on("click", (event) => { this.onStopClicked(event) });
    $nextButton.on("click", (event) => { this.onNextClicked(event) });
    $urlInput.on("keyup, keydown", (event) => {
      event.stopPropagation();
    });
    $urlInput.on("input", (event) => {
      event.stopPropagation();
      this.matchUrlSources($urlInput.val());
      this.updateUrlHasText();
    });
    $urlInput.on("blur", (event) => {
      this.updateUrlHasText();
    });

    $urlForm.on("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onUrlInputUpdated($urlInput.val());
      $urlInput.blur();
    });

    $("body").on("click", "#settings [data-quality]", (event) => this.setQuality(event))
    $("body").on("click", "#media-queue [data-queue-index].close", (event) => this.onRemoveQueueItem(event))
    this.init();
  }

  setQuality(event) {
    const quality = $(event.target).attr("data-quality");
    this.store.updateState({
      quality
    });
  }

  init() {
    const defaultSample = `${process.env.PUBLIC_URL}/samples/Broke_For_Free_-_01_-_Night_Owl.mp3`;
    $(urlInputId).val(defaultSample);
    this.updateUrlHasText();
    this.unsubscribe = this.store.subscribe(this.onStateUpdated)
  }

  onStateUpdated(newState) {
    const $activeQuality = $("#settings [data-quality].active");
    if ($activeQuality.attr('data-quality') !== newState.quality) {
      $activeQuality.removeClass('active');
      if (['LOW', 'MEDIUM', 'HIGH'].includes(newState.quality)) {
        $(`#settings [data-quality="${newState.quality}"]`).addClass('active');
      }
    }
  }

  loadPredefinedUrl (url) {
    if (url && url.trim()) {
      $('body').addClass('has-predefined-media');
      $('#start').one('click', () => {
        this.onUrlInputUpdated(url);
        $('body').removeClass('has-predefined-media');
      });
    }
  }

  updateUrlHasText() {
    const $urlInput = $(urlInputId);
    const value = $urlInput.val();
    if (value && value.trim()) {
      $urlInput.addClass('__hasText');
    } else {
      $urlInput.removeClass('__hasText');
    }
  }

  matchUrlSources(value) {
    const activeClass = 'active';
    $('.url-icons i.fa-soundcloud').toggleClass(activeClass, SOUNDCLOUD.test(value));
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
    const sourceInfo = this.audioManager.getCurrentSourceInfo() || {};
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
    }, (error) => {
      console.error("ERROR", error);
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

  onNextClicked (event) {
    this.audioManager.playNext();
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
    const $urlInput = $(urlInputId);
    $urlInput.attr("disabled", "disabled");
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
    const $urlInput = $(urlInputId);
    $urlInput.removeAttr("disabled");
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

  onUrlInputUpdated(url) {
    const $urlInput = $(urlInputId);
    $urlInput.val('');
    if (!url || !url.trim()) {
      return;
    }
    const urlToTry = url.trim();
    let source = null;
    const audioContext = this.audioManager.getAudioContext();
    if (SOUNDCLOUD.test(urlToTry)) {
      source = new SoundCloudSource(audioContext, urlToTry);
    } else {
      source= new AudioElementSource(audioContext, urlToTry);
    }
    if (source) {
      this.addSource(source);
    }
  }
}

export default UIController;
