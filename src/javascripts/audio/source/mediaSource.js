export const SOURCE_TYPES = {
  FILE: "FILE",
  MIC: "MIC"
};

class MediaSourceError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = this.constructor.name;
  }
}

const MESSAGE_INVALID_TYPE = "Invalid source type";

export class MediaSource {
  constructor(sourceType, audioContext, useSpeakerDestination = true) {
    if (!(sourceType in SOURCE_TYPES)) {
      throw new MediaSourceError(MESSAGE_INVALID_TYPE);
    }
    this.sourceType = sourceType;
    this.audioContext = audioContext;
    this.useSpeakerDestination = useSpeakerDestination;
    this.label = null;
    this.metaData = null;
    this.isLoaded = true;
    this.audioNode = null;
    this.fileLoaderPromise = Promise.resolve();
  }

  isLoaded() {
    return this.isLoaded;
  }

  onLoaded(onSuccess, onError) {
    this.fileLoaderPromise.then(onSuccess, onError);
  }

  shouldConnectDestination() {
    return this.useSpeakerDestination;
  }

  getLabel() {
    return this.label;
  }

  getMetaData() {
    return this.metaData;
  }

  getType() {
    return this.sourceType;
  }

  getAudioNode() {
    return this.audioNode;
  }

}
