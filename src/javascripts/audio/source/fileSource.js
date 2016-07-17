import {MediaSource, SOURCE_TYPES} from './mediaSource';

function loadFile (file) {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();

    fileReader.onload = function (event) {
      const fileBuffer = event.target.result;
      resolve(fileBuffer);
    };
    fileReader.onerror = function (error) {
      console.error(error);
      reject(error);
    };
    fileReader.readAsArrayBuffer(file);
  });
}

function createAudioNode(audioContext, audioBuffer) {
  const audioNode = audioContext.createBufferSource();
  audioNode.buffer = audioBuffer;

  if (!audioNode.start) {
    audioNode.start = audioNode.noteOn //in old browsers use noteOn method
    audioNode.stop = audioNode.noteOff //in old browsers use noteOn method
  }
  return audioNode;
}

function decodeAudioData (audioContext, buffer) {
  return new Promise (function (resolve, reject) {
    audioContext.decodeAudioData(buffer,
      function (audioBuffer) {
        const audioNode = createAudioNode(audioContext, audioBuffer);
        resolve(audioNode);
      },
      function (error) {
          console.error(error);
          reject(error);
      });
  });
}

class FileSource extends MediaSource {
  constructor(audioContext, file) {
    super(SOURCE_TYPES.FILE, audioContext);
    const self = this;
    this.file = file;
    this.fileName = file.name;
    this.isLoaded = false;

    this.fileLoaderPromise = loadFile(file).then((fileBuffer) => {
      return decodeAudioData(audioContext, fileBuffer);
    }).then((audioNode) => {
      self.isLoaded = true;
      self.audioNode = audioNode;
      return Promise.resolve();
    }).catch((error) => {
      return Promise.reject(error);
    });

  }
}

export default FileSource;
