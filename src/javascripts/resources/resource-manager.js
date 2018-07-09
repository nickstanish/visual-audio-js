import ImageResource from './image-resource';

export default class ResourceManager {
  constructor () {
    this.resources = {};
    this.progress = 0;
    this.progressListeners = [];
  }

  addImage(id, url) {
    const imageResource = new ImageResource(id, url);
    this.resources[id] = imageResource;
  }

  getResource(id) {
    return this.resources[id];
  }

  addProgressListener(listener) {
    this.progressListeners.push(listener);
  }

  load() {
    const resourcesToLoad = Object.keys(this.resources).map(resourceId => {
      const promise = this.resources[resourceId].load().then(result => {
        this.progress++;
        return result;
      });

      this.progressListeners.forEach(listener => {
        promise.then(listener);
      });

      return promise;
    });

    return Promise.all(resourcesToLoad);
  }
}
