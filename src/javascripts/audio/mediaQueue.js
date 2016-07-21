class MediaQueue {
  constructor () {
    this.mediaSources = [];
  }

  enqueue (mediaSource) {
    this.mediaSources.push(mediaSource);
  }

  dequeue () {
    return this.popIndex(0);
  }

  size () {
    return this.mediaSources.length;
  }

  popIndex (index) {
    return this.mediaSources.splice(index, 1)[0];
  }

  clear () {
    this.mediaSources.splice(0, this.mediaSources.length);
  }

  getDisplayValues () {
    return this.mediaSources.map(function (mediaSource) {
      return {
        label: mediaSource.getLabel(),
        metadata: mediaSource.getMetaData(),
        type: mediaSource.getType()
        // ready: mediaSource.isReady(),
      }
    });
  }
}

export default MediaQueue;
