function MediaQueue () {
  this.mediaSources = [];
}

MediaQueue.prototype.enqueue = function (mediaSource) {
  this.mediaSources.push(mediaSource);
};

MediaQueue.prototype.dequeue = function () {
  return this.popIndex(0);
};

MediaQueue.prototype.length = function () {
  return this.mediaSources.length;
};

MediaQueue.prototype.popIndex = function (index) {
  return this.mediaSources.splice(index, 1)[0];
};

MediaQueue.prototype.getDisplayValues = function () {
  return this.mediaSources.map(function (mediaSource) {
    return {
      label: mediaSource.getLabel(),
      metadata: mediaSource.getMetaData(),
      type: mediaSource.getType()
      // ready: mediaSource.isReady(),
    }
  });
};
