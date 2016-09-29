import {MediaSource, SOURCE_TYPES} from './mediaSource';

const MIC_NAGIGATOR_CONTRAINTS = {
  audio: true
};

function createMicAudioNode (audioContext) {
  return new Promise (function (resolve, reject) {
    navigator.getUserMedia(MIC_NAGIGATOR_CONTRAINTS,
      function (audioStream) {
        const audioNode = audioContext.createMediaStreamSource(audioStream);
        resolve(audioNode);
      },
      function (error) {
        console.error(error);
        reject(error);
      }
    );
  });
}

class MicSource extends MediaSource {
  constructor(audioContext, file) {
    super(SOURCE_TYPES.MIC, audioContext, false, false);
    this.file = file;
  }

  load() {
    if (this._loadingPromise) {
      return this._loadingPromise;
    }
    this._loadingPromise = createMicAudioNode(this.audioContext).then((audioNode) => {
      this.loaded = true;
      this.audioNode = audioNode;
      return Promise.resolve();
    }).catch((error) => {
      return Promise.reject(error);
    });
    return this._loadingPromise;
  }
}

export default MicSource;
