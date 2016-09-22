/**
* Copyright 2015-2016 Nick Stanish
*
*/

require('less/styles.less');
window.VISUAL_AUDIO = {
  VERSION: window.VERSION
};

import polyfill from 'polyfills';
import glMatrix from 'gl-matrix';

glMatrix.glMatrix.setMatrixArrayType(Float32Array);
const {mat4, vec4} = glMatrix;
import * as MathUtils from 'utils/math';
import * as BrowserUtils from 'utils/browser';
import Camera from 'camera/camera';
import UIController from 'ui/uiController';
import AudioManager from 'audio/audioManager';
import ShaderManager from 'shaderManager.js';
import Clock from 'three/clock';
import GPUParticleContainer from 'particles/ParticleContainer';
import KeyInput from 'input/keyInput';
import { COLORS } from 'data/colors';

import * as InputKeys from 'input/inputKeys';
import * as InputActions from 'input/inputActions';


(function () {

  const camera = new Camera();
  const keyInput = new KeyInput();
  const inputHandlers = {};

  const clock = new Clock(true);
  const particleContainers = [];
  const MAX_PARTICLE_CONTAINERS = 8;

  let perspectiveMatrix = null;
  let canvas = null;

  for (let i = 0 ; i < MAX_PARTICLE_CONTAINERS; i++) {
    particleContainers[i] = new GPUParticleContainer();
  }

  let tick = 0;

  let gpuParticleShader;
  let particlePositionsStartTimeAttribute;
  let particleVelColSizeLifeAttribute;

  const options = {
    maxParticles: 5000,
    useAcceleration: true,
    emissionRate: 2,
    particleLifespan: 1000,
    velocityMultiplier: 2,
    blur: false,
    showBars: true
  };

  function isParamTrue (param) {
    return (typeof param === 'boolean' && param) || (param.toLowerCase() === "true") || (param === "1");
  }

  const params = BrowserUtils.getQueryParams();
  const predefinedMedia = params.media;
  try {
    if (params.max && parseInt(params.max) && parseInt(params.max) > 0){
      options.maxParticles = parseInt(params.max);
    }
    if (params.rate && parseInt(params.rate) && parseInt(params.rate) > 0){
      options.emissionRate = parseInt(params.rate);
    }
    if (params.life && parseInt(params.life) && parseInt(params.life) > 0){
      options.particleLifespan = parseInt(params.life);
    }
    if (params.speed && parseInt(params.speed) && parseInt(params.speed) > 0){
      options.velocityMultiplier = parseInt(params.speed);
    }
    if (params.accel){
      options.useAcceleration = isParamTrue(params.accel);
    }
    if (params.bars){
      options.showBars = isParamTrue(params.bars);
    }
    if (params.blur){
      options.blur = isParamTrue(params.blur);
    }

  } catch (e) {
    if (console.error) {
      console.error(e);
    }
  }

  polyfill();

  document.addEventListener("DOMContentLoaded", onLoad);
  // document.addEventListener("resize", onResize);

  function initWebGL(canvas) {
    let gl = null;

    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch (e) {
      console.error(e);
      alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    window.gl = gl;
    return gl;
  }

  let stats;

  let bars;
  let barBuffer;
  let gl;

  let smokeImage, smokeTexture;
  let smokeReady = false;

  let barShader;
  let barVerticesLocation;

  const audioManager = new AudioManager();
  const uiController = new UIController(audioManager);

  let frameBuffer;
  let frameTexture;
  let quadBuffer;
  let quadVerticesLocation;
  let quadShader;

  function initFrameBuffer () {
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;

    frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    frameBuffer.width = width;
    frameBuffer.height = height;

    frameTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, frameBuffer.width, frameBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameTexture, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    quadBuffer = gl.createBuffer();
    const quadVertices = new Float32Array([
      -1.0,  1.0,
      -1.0,  -1.0,
      1.0,  -1.0,
      1.0,  1.0,
      -1.0,  1.0,
      1.0,  -1.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
  }

  function initTextures() {
    smokeTexture = gl.createTexture();
    smokeImage = new Image();
    smokeImage.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, smokeTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, smokeImage);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      smokeReady = true;
    };
    smokeImage.src = "public/images/star.png";
  }


  function initBuffers() {
    initTextures();
    initFrameBuffer();
  }

  function drawBars() {
    bars = [];

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

      gl.useProgram(barShader);
      const pUniform = gl.getUniformLocation(barShader, "uPMatrix");
      gl.uniformMatrix4fv(pUniform, false, perspectiveMatrix);

      const mvUniform = gl.getUniformLocation(barShader, "uMVMatrix");
      gl.uniformMatrix4fv(mvUniform, false, camera.getModelViewMatrix());

      const mUniform = gl.getUniformLocation(barShader, "uMMatrix");
      const modelMatrix = mat4.create();

      const vector = vec4.fromValues(0, -4, 0, 0);
      mat4.translate(modelMatrix, modelMatrix, vector);

      // var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
      // modelMatrix = modelMatrix.x(m);
      gl.uniformMatrix4fv(mUniform, false, modelMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, barBuffer);
      gl.enableVertexAttribArray(barVerticesLocation);
      gl.vertexAttribPointer(barVerticesLocation, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, bars.length / 3.0);

      gl.disableVertexAttribArray(barVerticesLocation);
  }

  function drawParticles(particleContainer, audioIntensity = 0.5) {
    // uniform sampler2D tNoise;

    const BASE_SCALE = 5;
    const SCALE_MULTIPLIER = 20;

    gl.useProgram(gpuParticleShader);
    const projectionMatricUniform = gl.getUniformLocation(gpuParticleShader, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatricUniform, false, perspectiveMatrix);

    const modelViewMatrixUniform = gl.getUniformLocation(gpuParticleShader, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixUniform, false, camera.getModelViewMatrix());

    const positionUniform = gl.getUniformLocation(gpuParticleShader, "position");
    gl.uniform3fv(positionUniform, [0, 0, 0]);

    const uTimeUniform = gl.getUniformLocation(gpuParticleShader, "uTime");
    gl.uniform1f(uTimeUniform, particleContainer.time);

    const uScaleUniform = gl.getUniformLocation(gpuParticleShader, "uScale");
    gl.uniform1f(uScaleUniform, BASE_SCALE + SCALE_MULTIPLIER * audioIntensity);


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, smokeTexture);
    gl.uniform1i(gl.getUniformLocation(gpuParticleShader, "tSprite"), 0);

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


  function updateParticles(gl, tick, clockDelta) {
    const spawnRate = 30;
    const MAX_SPAWN = 200;
    for (let i = 0; i < particleContainers.length; i++) {
      const particleContainer = particleContainers[i];
      particleContainer.update(tick, gl);
      for (let j = 0; j < spawnRate * clockDelta && j < MAX_SPAWN; j++) {
        particleContainer.spawnParticle({
          velocityRandomness: 0.4,
          color: COLORS[i].toValue(),
          colorRandomness: 0,
          lifetime: 6,
          sizeRandomness: 0.5
        });
      }
    }

  }

  function makePerspectiveMatrix() {
    const perspectiveMatrix = mat4.create();
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const FIELD_OF_VIEW_DEGREES = 50.0;
    const NEAR = 0.1;
    const FAR = 1000.0;
    mat4.perspective(perspectiveMatrix, MathUtils.degreesToRadians(FIELD_OF_VIEW_DEGREES), aspect, NEAR, FAR);
    return perspectiveMatrix;
  }

  function onDoneLoading() {
    uiController.loadPredefinedUrl(predefinedMedia);
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
		if (clockDelta > 0) {
      updateParticles(gl, tick, clockDelta);
		}



    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const audioData = audioManager.getNormalizedFrequencyData() || {};


    if (smokeReady) {
      if (audioManager.isPlaying() && audioData.bins) {
        for (let i = 0; i < particleContainers.length; i++) {
          drawParticles(particleContainers[i], audioData.bins[i]);
        }
      } else {
        for (let i = 0; i < particleContainers.length; i++) {
          drawParticles(particleContainers[i]);
        }
      }


    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(quadShader);
    gl.enableVertexAttribArray(quadVerticesLocation);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    const textureLocation = gl.getUniformLocation(quadShader, "inTexture");
    gl.uniform1i(textureLocation, 0);

    let inVolume = 0;
    if (options.blur) {
      inVolume = audioData.average || 0;
    }

    gl.uniform1f(gl.getUniformLocation(quadShader, "inWidth"), canvas.clientWidth);
    gl.uniform1f(gl.getUniformLocation(quadShader, "inHeight"), canvas.clientHeight);
    gl.uniform1f(gl.getUniformLocation(quadShader, "inVolume"), inVolume);

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.vertexAttribPointer(quadVerticesLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);


    gl.disableVertexAttribArray(quadVerticesLocation);

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

  function setupStats() {
    stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms, 2: mb
    // align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.right = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild( stats.domElement );
  }

  function onLoad () {
    canvas = document.getElementById("canvas");
    perspectiveMatrix = makePerspectiveMatrix();
    setupStats();
    bindKeyHandlers();

    const shaderManager = new ShaderManager();
    uiController.bind();

    gl = initWebGL(canvas);
    shaderManager.compileShaders(gl);
    initBuffers();
    for (let i = 0; i < particleContainers.length; i++) {
      particleContainers[i].init(gl);
    }

    gpuParticleShader = gl.createProgram();
    gl.attachShader(gpuParticleShader, shaderManager.vertex['gpuParticleShader']);
    gl.attachShader(gpuParticleShader, shaderManager.fragment['gpuParticleShader']);
    gl.linkProgram(gpuParticleShader);

    barShader = gl.createProgram();
    gl.attachShader(barShader, shaderManager.vertex['barShader']);
    gl.attachShader(barShader, shaderManager.fragment['barShader']);
    gl.linkProgram(barShader);

    quadShader = gl.createProgram();
    gl.attachShader(quadShader, shaderManager.vertex['quadShader']);
    gl.attachShader(quadShader, shaderManager.fragment['quadShader']);
    gl.linkProgram(quadShader);

    gl.enable (gl.BLEND);
    gl.blendEquation( gl.FUNC_ADD );
    // gl.blendFunc( gl.SRC_ALPHA, gl.DST_ALPHA );
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    // gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA );

    gl.useProgram(gpuParticleShader);
    particlePositionsStartTimeAttribute = gl.getAttribLocation(gpuParticleShader, "particlePositionsStartTime");
    particleVelColSizeLifeAttribute = gl.getAttribLocation(gpuParticleShader, "particleVelColSizeLife");

    gl.useProgram(barShader);
    barVerticesLocation = gl.getAttribLocation(barShader, "aVertexPosition");

    gl.useProgram(quadShader);
    quadVerticesLocation = gl.getAttribLocation(quadShader, "inCoord");


    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    requestAnimationFrame(drawScene);
  }

  function resize() {
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    if (gl.canvas.width != width ||
        gl.canvas.height != height) {

       initFrameBuffer();
       gl.canvas.width = width;
       gl.canvas.height = height;
       gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    perspectiveMatrix = makePerspectiveMatrix();
  }



})();
