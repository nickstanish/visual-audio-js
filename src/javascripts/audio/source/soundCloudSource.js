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
    this.title = url;
    this.error = false;
    this.soundCloudPlayer = initSoundCloudApi(config.apis.soundCloud.clientKey);
    this.soundCloudTrackInfo = null;
  }

  load() {
    if (this._loadingPromise) {
      return this._loadingPromise;
    }
    this._loadingPromise = Promise.race([
      new Promise((resolve, reject) => {
        this.soundCloudPlayer.resolve(this.url, (track) => {
          if (this.error) {
            console.log('error', this.error);
            reject(this.error);
            return;
          }
          this.soundCloudTrackInfo = track;
          console.log(track);

          const audioElement = this.soundCloudPlayer.audio;
          audioElement.crossOrigin = "anonymous";
          this.loaded = true;
          this.audioNode = this.audioContext.createMediaElementSource(audioElement);
          resolve();
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
    return this._loadingPromise;
  }

  onEnded(callback) {
    this.soundCloudPlayer.on('ended', callback);
  }

  play() {

    this.soundCloudPlayer.play();
  }

}

export default SoundCloudSource;
