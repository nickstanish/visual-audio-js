/* WIP */
import ResourceManager from './resources/resource-manager';
const resourceManager = new ResourceManager()

export default class Renderer {
  constructor() {
    this.loaded = false
  }

  init(gl) {
    this.gl = gl;
    this.loadResources();
    this.initQuadBuffer();
    this.initFrameBuffer(gl.canvas.clientWidth, gl.canvas.clientHeight);
  }

  loadResources() {
    resourceManager.addImage('star', 'public/images/alpha-star.png');
    resourceManager.load().then(() => {
      this.initTextures();
      this.loaded = true;
      this.onLoaded();
    });
  }
  initQuadBuffer() {
    const { gl } = this;
    this.quadBuffer = gl.createBuffer();
    const quadVertices = new Float32Array([
      -1.0,  1.0,
      -1.0,  -1.0,
      1.0,  -1.0,
      1.0,  1.0,
      -1.0,  1.0,
      1.0,  -1.0
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
  }

  initFrameBuffer (width, height) {
    const { gl } = this;
    this.frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    this.frameBuffer.width = width;
    this.frameBuffer.height = height;

    this.frameTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.frameBuffer.width, this.frameBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTexture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }


  onLoaded() {

  }

  update() {

  }

  draw() {

  }
}
