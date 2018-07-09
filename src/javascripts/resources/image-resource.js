export default class ImageResource {
  constructor(id, url) {
    this.id = id;
    this.url = url;
    this.loaded = false;
  }

  load() {
    return new Promise((resolve, reject) => {
      this.image = new Image();
      this.image.onload = () => {
        this.loaded = true;
        resolve(this.image);
      }
      this.image.src = this.url;
    });
  }
}
