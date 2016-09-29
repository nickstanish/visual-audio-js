export const SOURCE_TYPES = {
  FILE: "FILE",
  MIC: "MIC",
  SOUNDCLOUD: "SOUNDCLOUD"
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
  constructor(sourceType, audioContext, useSpeakerDestination = true, allowQueuing = true) {
    if (!(sourceType in SOURCE_TYPES)) {
      throw new MediaSourceError(MESSAGE_INVALID_TYPE);
    }
    this.sourceType = sourceType;
    this.audioContext = audioContext;
    this.useSpeakerDestination = useSpeakerDestination;
    this.allowQueuing = allowQueuing;
    this.label = null;
    this.metaData = null;
    this.loaded = false;
    this.audioNode = null;
  }

  isLoaded() {
    return this.loaded;
  }

  shouldConnectDestination() {
    return this.useSpeakerDestination;
  }

  shouldAllowQueueing() {
    return this.allowQueuing;
  }

  getTitle() {
    return this.title;
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
