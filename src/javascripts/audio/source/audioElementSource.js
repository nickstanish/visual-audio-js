import {MediaSource, SOURCE_TYPES} from './mediaSource';

// TODO: fix the onended
class AudioElementSource extends MediaSource {
  constructor(audioContext, url) {
    super(SOURCE_TYPES.AUDIO_ELEMENT, audioContext, true);
    this.url = url;
    this.label = url;
    this.isLoaded = false;

    this.fileLoaderPromise = new Promise((resolve, reject) => {
      const audioTag = document.getElementById('audio');
      if (audioTag) {
        audioTag.src = url;
        audioTag.play();
        return resolve(audioContext.createMediaElementSource(audioTag));
      }
      return reject('Cannot init audio tag source');
    }).then((audioNode) => {
      this.isLoaded = true;
      this.audioNode = audioNode;
      return Promise.resolve();
    }).catch((error) => {
      return Promise.reject(error);
    });

  }
}

export default AudioElementSource;
