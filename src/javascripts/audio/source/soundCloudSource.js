import { MediaSource, SOURCE_TYPES } from './mediaSource';
import SoundCloudAudio from 'soundcloud-audio';
import config from 'config';

const LOAD_TIMEOUT_MS = 5000;

function initSoundCloudApi(clientId) {
  return new SoundCloudAudio(clientId);
}


// https://soundcloud.com/slushiimusic/closerremix
class SoundCloudSource extends MediaSource {
  constructor(audioContext, url) {
    super(SOURCE_TYPES.SOUNDCLOUD, audioContext, true);
    this.url = url;
    this.label = url;
    this.isLoaded = false;
    this.error = false;
    this.soundCloudPlayer = initSoundCloudApi(config.apis.soundCloud.clientKey);
    this.soundCloudTrackInfo = null;
    this.onEndedCallbacks = []

    this.fileLoaderPromise = Promise.race([
      new Promise((resolve, reject) => {
        this.soundCloudPlayer.resolve(url, (track) => {
          if (this.error) {
            console.log('error', this.error);
            reject(this.error);
            return;
          }
          this.soundCloudTrackInfo = track;
          console.log(track);

          const audioElement = this.soundCloudPlayer.audio;
          audioElement.crossOrigin = "anonymous";
          this.isLoaded = true;
          this.audioNode = audioContext.createMediaElementSource(audioElement);

          resolve();
          // soundCloudPlayer.play();
        });
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const message = 'SoundCloud request timed out';
          this.error = message;
          reject(message)
        }, LOAD_TIMEOUT_MS);
      })
    ]);

  }

  onEnded(callback) {
    this.onEndedCallbacks.push(callback);
  }

  _onEnd() {
    for (let i = 0; i < this.onEndedCallbacks.length; i++) {
      this.onEndedCallbacks[i]();
    }
    this.onEndedCallbacks.splice(0);
  }

  play() {
    this.soundCloudPlayer.on('ended', () => this._onEnd());
    this.soundCloudPlayer.play();
  }

}

export default SoundCloudSource;
