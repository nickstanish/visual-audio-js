/* eslint-disable import/first */
/* global $ */
import { glMatrix,  mat4, vec3, vec4 } from 'gl-matrix/dist/gl-matrix';
glMatrix.setMatrixArrayType(Float32Array);


import * as MathUtils from './utils/math';
import Camera from './camera/camera';

import Clock from './three/clock';
import GPUParticleContainer from './particles/particleContainer';
import KeyInput from './input/keyInput';
import { COLORS } from './data/colors';
import ShaderProgram from './shaders/shaderProgram';
import { BAR_SHADER_CONFIG, SHADER_GPU_PARTICLE_CONFIG, QUAD_SHADER_CONFIG } from './shaders';

import * as InputKeys from './input/inputKeys';
import * as InputActions from './input/inputActions';
import { Quality } from './quality';


let bars;
let barBuffer;
let gl;

let smokeImage, smokeTexture;
let smokeReady = false;

let frameBuffer;
let frameTexture;
let quadBuffer;

export default function animate(store, audioManager, uiController, { stats, options }) {

  const camera = new Camera();
  const keyInput = new KeyInput();
  const inputHandlers = {};

  const clock = new Clock(true);
  const particleContainers = [];
  const MAX_PARTICLE_CONTAINERS = 8;

  let perspectiveMatrix = null;
  let canvas = null;

  const particlesModelMatrix = mat4.create();

  for (let i = 0 ; i < MAX_PARTICLE_CONTAINERS; i++) {
    particleContainers[i] = new GPUParticleContainer();
  }

  let tick = 0;

  const gpuParticleShader = new ShaderProgram(SHADER_GPU_PARTICLE_CONFIG);
  const barShader = new ShaderProgram(BAR_SHADER_CONFIG);
  const quadShader = new ShaderProgram(QUAD_SHADER_CONFIG);

  onLoad();
  // document.addEventListener("DOMContentLoaded", onLoad);
  // document.addEventListener("resize", onResize);

  function initWebGL(canvas) {
    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch (e) {
      console.error(e);
      alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl;
  }

  function initQuadBuffer() {
    quadBuffer = gl.createBuffer();
    const quadVertices = new Float32Array([
      -1.0,  1.0,
      -1.0,  -1.0,
      1.0,  -1.0,
      1.0,  1.0,
      -1.0,  1.0,
      1.0,  -1.0
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
  }

  function initFrameBuffer (width, height) {
    frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    frameBuffer.width = width;
    frameBuffer.height = height;

    frameTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, frameBuffer.width, frameBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameTexture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  }

  function initTextures() {
    smokeTexture = gl.createTexture();
    smokeImage = new Image();
    smokeImage.onload = function() {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, smokeTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, smokeImage);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      smokeReady = true;
    };
    smokeImage.src = `${process.env.PUBLIC_URL}/images/alpha-star.png`;
  }


  function initBuffers() {
    initQuadBuffer();
    initTextures();
    initFrameBuffer(gl.canvas.clientWidth, gl.canvas.clientHeight);
  }

  function drawBars() {
    bars = [];

    // TODO: optimize the bars

    const bufferLength = audioManager.getFrequencyBinCount();
    const widthScale = 8.0;
    const barWidth = widthScale / bufferLength;
    const barPadding = barWidth * 0.2;

    const data = audioManager.getFrequencyData();
    const halfWidthScale = (widthScale / 2);

    if (data && data.length > 0){
      for (let i = 0; i < data.length; i++) {
        const datum = data[i] / 255;

        const height = datum; // [0, 1]
        const bottom = 0;
        const x1 = (i * (barWidth)) - halfWidthScale;
        const x2 = x1 + (barWidth - barPadding);
        const z = 1;
        const bar = [
          x1, height, z,
          x1, bottom, z,
          x2, bottom, z,
          x2, height, z,
          x1, height, z,
          x2, bottom, z
        ];
        bars = bars.concat(bar);

      }
    }

      barBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, barBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bars), gl.STATIC_DRAW);

      gl.useProgram(barShader.getProgram());
      gl.uniformMatrix4fv(barShader.getUniformLocation(BAR_SHADER_CONFIG.uniforms.uPMatrix), false, perspectiveMatrix);
      gl.uniformMatrix4fv(barShader.getUniformLocation(BAR_SHADER_CONFIG.uniforms.uMVMatrix), false, camera.getModelViewMatrix());

      const modelMatrix = mat4.create();

      const vector = vec4.fromValues(0, -4, 0, 0);
      mat4.translate(modelMatrix, modelMatrix, vector);

      gl.uniformMatrix4fv(barShader.getUniformLocation(BAR_SHADER_CONFIG.uniforms.uMMatrix), false, modelMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, barBuffer);
      gl.enableVertexAttribArray(barShader.getAttribLocation(BAR_SHADER_CONFIG.attributes.vertices));
      gl.vertexAttribPointer(barShader.getAttribLocation(BAR_SHADER_CONFIG.attributes.vertices), 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, bars.length / 3.0);

      gl.disableVertexAttribArray(barShader.getAttribLocation(BAR_SHADER_CONFIG.attributes.vertices));
  }

  function drawParticles(particleContainer, audioIntensity = 0.2) {
    // uniform sampler2D tNoise;

    const BASE_SCALE = audioManager.isPlaying() ? 0 : 5;
    const SCALE_MULTIPLIER = 30;

    gl.useProgram(gpuParticleShader.getProgram());
    gl.uniformMatrix4fv(gpuParticleShader.getUniformLocation(SHADER_GPU_PARTICLE_CONFIG.uniforms.modelMatrix), false, particlesModelMatrix);
    gl.uniformMatrix4fv(gpuParticleShader.getUniformLocation(SHADER_GPU_PARTICLE_CONFIG.uniforms.projectionMatrix), false, perspectiveMatrix);
    gl.uniformMatrix4fv(gpuParticleShader.getUniformLocation(SHADER_GPU_PARTICLE_CONFIG.uniforms.modelViewMatrix), false, camera.getModelViewMatrix());
    gl.uniform3fv(gpuParticleShader.getUniformLocation(SHADER_GPU_PARTICLE_CONFIG.uniforms.position), [0, 0, 0]);
    gl.uniform1f(gpuParticleShader.getUniformLocation(SHADER_GPU_PARTICLE_CONFIG.uniforms.uTime), particleContainer.time);
    gl.uniform1f(gpuParticleShader.getUniformLocation(SHADER_GPU_PARTICLE_CONFIG.uniforms.uScale), BASE_SCALE + SCALE_MULTIPLIER * audioIntensity);
    gl.uniform1f(gpuParticleShader.getUniformLocation(SHADER_GPU_PARTICLE_CONFIG.uniforms.pixelDensity), getPixelDensity());


    gl.uniform1i(gpuParticleShader.getUniformLocation(SHADER_GPU_PARTICLE_CONFIG.uniforms.tSprite), 1);

    const particlePositionsStartTimeAttribute = gpuParticleShader.getAttribLocation(SHADER_GPU_PARTICLE_CONFIG.attributes.particlePositionsStartTime);
    const particleVelColSizeLifeAttribute = gpuParticleShader.getAttribLocation(SHADER_GPU_PARTICLE_CONFIG.attributes.particleVelColSizeLife);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleContainer.geometryPosStartBuffer);
    gl.enableVertexAttribArray(particlePositionsStartTimeAttribute);
    gl.vertexAttribPointer(particlePositionsStartTimeAttribute, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleContainer.geometryVelColBuffer);
    gl.enableVertexAttribArray(particleVelColSizeLifeAttribute);
    gl.vertexAttribPointer(particleVelColSizeLifeAttribute, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, particleContainer.PARTICLE_COUNT);

    gl.disableVertexAttribArray(particlePositionsStartTimeAttribute);
    gl.disableVertexAttribArray(particleVelColSizeLifeAttribute);
  }


  function updateParticles(gl, tick, clockDelta, audioBins) {
    const spawnRate = 10;
    const MAX_SPAWN = 100;

    const clampedTick = MathUtils.clamp(tick);

    if (audioManager.isPlaying()) {
      mat4.rotateY(particlesModelMatrix, particlesModelMatrix, 0.01 * clampedTick);
      mat4.rotateZ(particlesModelMatrix, particlesModelMatrix, 0.009 * clampedTick);
    }

    for (let i = 0; i < particleContainers.length; i++) {
      const particleContainer = particleContainers[i];
      // const audioIntensity = audioBins[i] || 0.5;
      const numberOfParticlesToSpawn = spawnRate * clockDelta/* * audioIntensity */;
      const color = COLORS[i].toValue();
      // const scale = 1.5;
      // const x = (i % 4) - 2;
      // const y = Math.floor(i / 4) - 0.5;
      particleContainer.update(tick, gl);
      for (let j = 0; j < numberOfParticlesToSpawn && j < MAX_SPAWN; j++) {
        const radians = 2 * i * Math.PI / particleContainers.length;
        const radius = 1.25;
        const position = vec3.fromValues(radius * Math.cos(radians), radius * Math.sin(radians), 0);
        const velocity = vec3.normalize(vec3.create(), position);

        particleContainer.spawnParticle({
          position,
          velocity: velocity,
          velocityRandomness: 0.5,
          color: color,
          colorRandomness: 0,
          lifetime: 3,
          sizeRandomness: 0.4
        });
      }
    }

  }

  function makePerspectiveMatrix() {
    const perspectiveMatrix = mat4.create();
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const FIELD_OF_VIEW_DEGREES = 50.0;
    const NEAR = 0.1;
    const FAR = getFar();
    mat4.perspective(perspectiveMatrix, MathUtils.degreesToRadians(FIELD_OF_VIEW_DEGREES), aspect, NEAR, FAR);
    return perspectiveMatrix;
  }

  function onDoneLoading() {
    uiController.loadPredefinedUrl(options.predefinedMedia);
  }

  let loading = true;
  function drawScene() {
    if (loading) {
      if (smokeReady) {
        loading = false;
        onDoneLoading();
      }
    }

    handleInput();
    resize();
    stats.begin();


    const clockDelta = clock.getDelta() * 1;
    tick += clockDelta;

    if (tick < 0) {
      tick = 0;
    }

    const audioData = audioManager.getNormalizedFrequencyData() || {};
    let audioBins = [];
    if (audioManager.isPlaying() && audioData.bins) {
      audioBins = audioData.bins;
    }
    if (clockDelta > 0) {
      updateParticles(gl, tick, clockDelta, audioBins);
    }

    if (options.blur) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    if (smokeReady) {
      for (let i = 0; i < particleContainers.length; i++) {
        drawParticles(particleContainers[i], audioBins[i]);
      }
    }

    if (options.blur) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(quadShader.getProgram());

      const quadVerticesLocation = quadShader.getAttribLocation(QUAD_SHADER_CONFIG.attributes.vertices);

      gl.enableVertexAttribArray(quadVerticesLocation);

      let inVolume = 0;
      if (options.blur) {
        inVolume = audioData.average || 0;
      }

      gl.activeTexture(gl.TEXTURE0);

      gl.uniform1i(quadShader.getUniformLocation(QUAD_SHADER_CONFIG.uniforms.texture), 0);
      gl.uniform1f(quadShader.getUniformLocation(QUAD_SHADER_CONFIG.uniforms.width), canvas.clientWidth);
      gl.uniform1f(quadShader.getUniformLocation(QUAD_SHADER_CONFIG.uniforms.height), canvas.clientHeight);
      gl.uniform1f(quadShader.getUniformLocation(QUAD_SHADER_CONFIG.uniforms.volume), inVolume);

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.vertexAttribPointer(quadVerticesLocation, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.disableVertexAttribArray(quadVerticesLocation);
    }

    if (audioManager && audioManager.isPlaying() && options.showBars) {
      drawBars();
    }

    stats.end();
    requestAnimationFrame(drawScene);
  }



  function handleInput() {
    const activeActions = keyInput.getActiveActions();

    if (activeActions.length === 0) {
      return;
    }

    activeActions.forEach(action => {
      if (inputHandlers[action]) {
        inputHandlers[action]();
      }
    })

  }

  function bindKeyHandlers () {
    const $document = $(document);
    $document.on("keydown", (event) => {
      const key = event.keyCode;
      keyInput.setKeyActive(key);
    });
    $document.on("keyup", (event) => {
      const key = event.keyCode;
      keyInput.setKeyInactive(key);
    });

    keyInput.registerKeyAction(InputKeys.VK_W, InputActions.CAMERA_MOVE_POS_Z);
    keyInput.registerKeyAction(InputKeys.VK_S, InputActions.CAMERA_MOVE_NEG_Z);

    keyInput.registerKeyAction(InputKeys.VK_A, InputActions.CAMERA_MOVE_POS_X);
    keyInput.registerKeyAction(InputKeys.VK_D, InputActions.CAMERA_MOVE_NEG_X);

    keyInput.registerKeyAction(InputKeys.VK_ARROW_LEFT, InputActions.CAMERA_MOVE_NEG_YAW);
    keyInput.registerKeyAction(InputKeys.VK_ARROW_RIGHT, InputActions.CAMERA_MOVE_POS_YAW);

    keyInput.registerKeyAction(InputKeys.VK_ARROW_UP, InputActions.CAMERA_MOVE_POS_PITCH);
    keyInput.registerKeyAction(InputKeys.VK_ARROW_DOWN, InputActions.CAMERA_MOVE_NEG_PITCH);

    inputHandlers[InputActions.CAMERA_MOVE_POS_YAW] = () => camera.updateYaw(1);
    inputHandlers[InputActions.CAMERA_MOVE_NEG_YAW] = () => camera.updateYaw(-1);

    inputHandlers[InputActions.CAMERA_MOVE_POS_PITCH] = () => camera.updatePitch(1);
    inputHandlers[InputActions.CAMERA_MOVE_NEG_PITCH] = () => camera.updatePitch(-1);

    inputHandlers[InputActions.CAMERA_MOVE_POS_X] = () => camera.updateX(1);
    inputHandlers[InputActions.CAMERA_MOVE_NEG_X] = () => camera.updateX(-1);

    inputHandlers[InputActions.CAMERA_MOVE_POS_Y] = () => camera.updateY(1);
    inputHandlers[InputActions.CAMERA_MOVE_NEG_Y] = () => camera.updateY(-1);

    inputHandlers[InputActions.CAMERA_MOVE_POS_Z] = () => camera.updateZ(1);
    inputHandlers[InputActions.CAMERA_MOVE_NEG_Z] = () => camera.updateZ(-1);
  }

  function initShaders() {
    gpuParticleShader.compile(gl);
    barShader.compile(gl);
    quadShader.compile(gl);
  }

  function onLoad () {
    canvas = document.getElementById("canvas");
    perspectiveMatrix = makePerspectiveMatrix();
    bindKeyHandlers();

    uiController.registerUI();

    gl = initWebGL(canvas);
    // shaderManager.compileShaders(gl);
    initBuffers();
    initShaders();
    for (let i = 0; i < particleContainers.length; i++) {
      particleContainers[i].init(gl);
    }

    gl.enable (gl.BLEND);
    gl.blendEquation( gl.FUNC_ADD );
    // gl.blendFunc( gl.SRC_ALPHA, gl.DST_ALPHA );
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    // gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA );


    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    requestAnimationFrame(drawScene);
  }

  function getPixelDensity() {
    switch (store.getState().quality) {
      case Quality.HIGH:
        return window.devicePixelRatio || 1;
      case Quality.LOW:
        return 0.5;
      case Quality.MEDIUM:
      default:
        return 1;
    }
  }

  function getFar() {
    switch (store.getState().quality) {
      case Quality.HIGH:
        return 10000;
      case Quality.LOW:
        return 50;
      case Quality.MEDIUM:
      default:
        return 1000;
    }
  }

  function resize() {
    const pixelDensity = getPixelDensity();
    const width  = Math.floor(gl.canvas.clientWidth  * pixelDensity);
    const height = Math.floor(gl.canvas.clientHeight * pixelDensity);

    if (gl.canvas.width != width || gl.canvas.height != height) {

       initFrameBuffer(width, height);
       gl.canvas.width = width;
       gl.canvas.height = height;

       gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    perspectiveMatrix = makePerspectiveMatrix();
  }
}
