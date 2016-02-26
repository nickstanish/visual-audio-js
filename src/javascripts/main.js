/**
* Copyright 2015 Nick Stanish
*
*/

(function () {
  var polyfill = require("polyfills");
  var utils = require("utils");
  var glMatrix = require('gl-matrix');
  glMatrix.glMatrix.setMatrixArrayType(Float32Array);
  var mat4 = glMatrix.mat4;
  var vec4 = glMatrix.vec4;

  var options = {
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

  var params = utils.getQueryParams();
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
    var gl;
    
    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}
    
    // If we don't have a GL context, give up now
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      gl = null;
    }
    window.gl = gl;
    return gl;
  }

  var stats;

  var colors = [
    {
     name: "red",
     r: 244,
     g: 67,
     b: 54 
    },
    {
     name: "purple",
     r: 156,
     g: 39,
     b: 176 
    },
    {
     name: "blue",
     r: 33,
     g: 150,
     b: 243 
    },
    {
     name: "green",
     r: 76,
     g: 175,
     b: 80 
    },
    {
     name: "yellow",
     r: 255,
     g: 235,
     b: 59 
    },
    {
     name: "orange",
     r: 255,
     g: 152,
     b: 0 
    },
    {
     name: "cyan",
     r: 0,
     g: 172,
     b: 193 
    },
    {
     name: "pink",
     r: 233,
     g: 30,
     b: 99 
    }

  ]

  var barBuffer;
  var perspectiveMatrix;
  var gl;
  var animationUpdateTime;
  var shaderProgram;

  var particleSystem = {
    positions: null,
    velocities: null,
    alive: null,
    ages: null,
    lifespans: null,
    nextType: 0
  };


  var emitters = [{
    rate: options.emissionRate, // number to emit per time slice
    lastEmit: null, // used with rate to determine how many to emit
    lifespan: options.particleLifespan, // lifespan of particle
    minDirection: {
      x: -0.01,
      y: -0.01,
      z: -0.01
    },
    maxDirection: {
      x: 0.01,
      y: 0.01,
      z: 0.01
    },
    position: {
      x: 0,
      y: 0,
      z: 0
    }
  }];

  var PARTICLE_ALIVE = 1;
  var PARTICLE_DEAD = 0;
  var animationFrameDelay = 1000 / 60; 

  var particleBuffer, aliveBuffer, particleAgeBuffer, particleTypeBuffer;
  var particleShader;
  var particleAliveAttribute, particleColorAttribute, particleAgeAttribute, particleTypeAttribute;

  var smokeImage, smokeTexture;
  var smokeReady = false;

  var barShader;
  var barVerticesLocation;

  var audioManager = null;

  var frameBuffer;
  var frameTexture;
  var quadBuffer;
  var quadVerticesLocation;
  var quadShader;

  var colorsBuffer;

  /**
  * Inclusive [min, max]
  */
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

  function initFrameBuffer () {
    var width = gl.canvas.clientWidth;
    var height = gl.canvas.clientHeight;

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
    var quadVertices = new Float32Array([
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
  function moveParticles () {

    var emitter = emitters[0];
    var emitted = 0;
    var rate = emitter.rate;
    var velocityMultiplier = options.velocityMultiplier;

    var particlesLength = particleSystem.alive.length;

    var acceleration = {
      x: 0,
      y: -0.000015,
      z: 0
    };

    for (var i = 0; i < particlesLength; i++) {
      var j = i * 3;

      if (particleSystem.alive[i] === PARTICLE_DEAD) {
        // spawn particle
        if (emitted < rate) {
          var position = emitter.position;
          var velocity = {
            x: getRandom(emitter.minDirection.x, emitter.maxDirection.x),
            y: getRandom(emitter.minDirection.y, emitter.maxDirection.y),
            z: getRandom(emitter.minDirection.z, emitter.maxDirection.z)
          };

          if (velocityMultiplier !== 1) {
            velocity.x *= velocityMultiplier;
            velocity.y *= velocityMultiplier;
            velocity.z *= velocityMultiplier;
          }

          particleSystem.positions[j] = position.x;
          particleSystem.positions[j+1] = position.y;
          particleSystem.positions[j+2] = position.z;

          particleSystem.velocities[j] = velocity.x;
          particleSystem.velocities[j+1] = velocity.y;
          particleSystem.velocities[j+2] = velocity.z;

          particleSystem.alive[i] = PARTICLE_ALIVE;
          particleSystem.ages[i] = 0;
          particleSystem.lifespans[i] = emitter.lifespan;
          particleSystem.type[i] = particleSystem.nextType;

          particleSystem.nextType = (particleSystem.nextType + 1) % 8;
          emitted++;

        }
        
      } else {
        // update particle
        if (options.useAcceleration) {
          particleSystem.positions[j] += particleSystem.velocities[j] + acceleration.x * particleSystem.ages[i];
          particleSystem.positions[j+1] += particleSystem.velocities[j+1] + acceleration.y * particleSystem.ages[i];
          particleSystem.positions[j+2] += particleSystem.velocities[j+2];
        } else {
          particleSystem.positions[j] += particleSystem.velocities[j];
          particleSystem.positions[j+1] += particleSystem.velocities[j+1];
          particleSystem.positions[j+2] += particleSystem.velocities[j+2];
        }
        

        if (particleSystem.ages[i] > particleSystem.lifespans[i]) {
          particleSystem.alive[i] = PARTICLE_DEAD;
        }
        particleSystem.ages[i]++;
      }
      
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.positions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, aliveBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.alive, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleAgeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.ages, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleTypeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.type, gl.STATIC_DRAW);
  }

  function initParticles(){ 
    var max = options.maxParticles;
    particleSystem.positions = new Float32Array(max * 3);
    particleSystem.velocities = new Float32Array(max * 3);
    particleSystem.type = new Float32Array(max);
    particleSystem.alive = new Float32Array(max);
    particleSystem.ages = new Float32Array(max);
    particleSystem.lifespans = new Float32Array(max);

    colorsBuffer = new Float32Array(colors.length * 3);
    for (var i = 0; i < colors.length; i++){
      colorsBuffer[i * 3] = (colors[i].r / 255);
      colorsBuffer[i * 3 + 1] = (colors[i].g / 255);
      colorsBuffer[i * 3 + 2] =(colors[i].b / 255);
    }
    
    
    for (var i = 0, j = 0; i < max; i++, j +=3) {
      var position = {
        x: 0, 
        y: 0,
        z: 0
      };
      var velocity = {
        x: 0, 
        y: 0,
        z: 0
      };


      var alive = PARTICLE_DEAD; 

      particleSystem.positions[j] = position.x;
      particleSystem.positions[j+1] = position.y;
      particleSystem.positions[j+2] = position.z;

      particleSystem.velocities[j] = velocity.x;
      particleSystem.velocities[j+1] = velocity.y;
      particleSystem.velocities[j+2] = velocity.z;

      particleSystem.type[j] = 0;
      particleSystem.alive[j] = alive;

    }

    particleBuffer = gl.createBuffer();
    aliveBuffer = gl.createBuffer();
    particleAgeBuffer = gl.createBuffer();
    particleTypeBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, particleTypeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.type, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, aliveBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.alive, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleAgeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.ages, gl.STATIC_DRAW);
  }


  function initBuffers() {
    initTextures();
    initParticles();
    initFrameBuffer();
  }

  window.frameCount = 0;
  window.animationCount = 0;
  function drawPoints(data) {
    gl.useProgram(particleShader);
    var pUniform = gl.getUniformLocation(particleShader, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, perspectiveMatrix);

    var mvUniform = gl.getUniformLocation(particleShader, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, camera.getModelViewMatrix());

    var frameUniform = gl.getUniformLocation(particleShader, "inFrame");
    gl.uniform1f(frameUniform, window.frameCount);

    var intensity = gl.getUniformLocation(particleShader, "intensity");
    if (data && data.bins){
      gl.uniform1f(intensity, data.max);
      gl.uniform1fv(gl.getUniformLocation(particleShader, "inFreqs"), data.bins);
    } else {
      gl.uniform1f(intensity, -1);
      gl.uniform1fv(gl.getUniformLocation(particleShader, "inFreqs"), [0,0,0,0,0,0,0,0]);
    }
    

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, smokeTexture);
    gl.uniform1i(gl.getUniformLocation(particleShader, "inTexture"), 0);

    gl.uniform3fv(gl.getUniformLocation(particleShader, "inColors"), colorsBuffer);
    gl.uniform1f(gl.getUniformLocation(particleShader, "isPlaying"), audioManager.isPlaying() ? 1.0 : 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.enableVertexAttribArray(particlePositionAttribute);
    gl.vertexAttribPointer(particlePositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, aliveBuffer);
    gl.enableVertexAttribArray(particleAliveAttribute);
    gl.vertexAttribPointer(particleAliveAttribute, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleAgeBuffer);
    gl.enableVertexAttribArray(particleAgeAttribute);
    gl.vertexAttribPointer(particleAgeAttribute, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleTypeBuffer);
    gl.enableVertexAttribArray(particleTypeAttribute);
    gl.vertexAttribPointer(particleTypeAttribute, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, particleSystem.positions.length / 3);

    gl.disableVertexAttribArray(particleTypeAttribute);
    gl.disableVertexAttribArray(particleAgeAttribute);
    gl.disableVertexAttribArray(particleAliveAttribute);
    gl.disableVertexAttribArray(particlePositionAttribute);
  }

  function animate() {
    moveParticles();
  }

  function drawBars() {
    bars = [];

    var bufferLength = audioManager.analyser.frequencyBinCount;
    var widthScale = 8.0;
    var barWidth = widthScale / bufferLength;
    var barPadding = barWidth * 0.2;

    var data = audioManager.getFrequencyData();
    var halfWidthScale = (widthScale / 2);

    if (data && data.length > 0){
      for(var i = 0; i < data.length; i++) {
        var datum = data[i] / 255;

        var height = datum; // [0, 1]
        var bottom = 0;
        var x1 = (i * (barWidth)) - halfWidthScale;
        var x2 = x1 + (barWidth - barPadding);
        var z = 1;
        var bar = [
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

    (function () {
        gl.useProgram(barShader);
        var pUniform = gl.getUniformLocation(barShader, "uPMatrix");
        gl.uniformMatrix4fv(pUniform, false, perspectiveMatrix);

        var mvUniform = gl.getUniformLocation(barShader, "uMVMatrix");
        gl.uniformMatrix4fv(mvUniform, false, camera.getModelViewMatrix());
      
        var mUniform = gl.getUniformLocation(barShader, "uMMatrix");
        var modelMatrix = mat4.create();

        var vector = vec4.fromValues(0, -4, 0, 0);
        mat4.translate(modelMatrix, modelMatrix, vector);
        
        
        // var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
        // modelMatrix = modelMatrix.x(m);
        gl.uniformMatrix4fv(mUniform, false, modelMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, barBuffer);
        gl.enableVertexAttribArray(barVerticesLocation);
        gl.vertexAttribPointer(barVerticesLocation, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, bars.length / 3.0);

        gl.disableVertexAttribArray(barVerticesLocation);
      })()
  }

  function drawScene() {
    resize();
    stats.begin();
    
    
    setTimeout(function() {
      window.frameCount += 1;;
    }, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var aspect = canvas.clientWidth / canvas.clientHeight;
    perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, utils.Math.degreesToRadians(50.0), aspect, 0.1, 100.0);

    var audioData = audioManager.getNormalizedFrequencyData() || {};
    
    if (smokeReady) {
      drawPoints(audioData);
    

      var currentTime = (new Date).getTime();
      if (animationUpdateTime) {
        var delta = currentTime - animationUpdateTime;
        if (delta > animationFrameDelay) {
          animationUpdateTime = currentTime;
          window.animationCount++;
          animate();
        } 
      } else {
        animationUpdateTime = currentTime;
      }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(quadShader);
    gl.enableVertexAttribArray(quadVerticesLocation);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    var textureLocation = gl.getUniformLocation(quadShader, "inTexture");
    gl.uniform1i(textureLocation, 0);

    var inVolume = 0;
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
  function keyHandler (event) {
    var key = event.keyCode;
    var keyMap = {
      '37': {
        id: "left_arrow",
        action: "minus_yaw"
      },
      '38': {
        id: "up_arrow",
        action: "plus_pitch"
      },
      '39': {
        id: "right_arrow",
        action: "plus_yaw"
      },
      '40': {
        id: "down_arrow",
        action: "minus_pitch"
      },
      '87': {
        id: "W",
        action: "move_forward"
      },
      '65': {
        id: "A",
        action: "move_left"
      },
      '83': {
        id: "S",
        action: "move_backward"
      },
      '68': {
        id: "D",
        action: "move_right"
      }
    };

    var pitch_delta = 0.1;
    var yaw_delta = 0.1;
    var movement_delta = [0.2, 0.5, 0.5];

    if (!keyMap[key]) {
      return;
    }

    switch (keyMap[key].action) {
      case "minus_pitch":
        camera.pitch -= pitch_delta;
      break;
      case "plus_pitch":
        camera.pitch += pitch_delta;
      break;
      case "plus_yaw":
        camera.yaw += yaw_delta;
      break;
      case "minus_yaw":
        camera.yaw -= yaw_delta;
      break;
      case "move_forward":
        camera.position[2] += movement_delta[2];
      break;
      case "move_backward":
        camera.position[2] -= movement_delta[2];
      break;
      case "move_left":
        camera.position[0] += movement_delta[0];
      break;
      case "move_right":
        camera.position[0] -= movement_delta[0];
      break;

    }
    
  }

  function Camera () {
    this.position = [0, 0, -10];
    this.pitch = 0;
    this.yaw = 0;
    
  }


  Camera.prototype.getModelViewMatrix = function () {
    var result = mat4.create();
    mat4.rotateX(result, result, -this.pitch);
    mat4.rotateY(result, result, this.yaw);
    mat4.translate(result, result, this.position);
    return result;
  }

  var camera;


  function onLoad () {

    $(document).on("keydown", keyHandler);
    stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms, 2: mb

    // align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.right = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild( stats.domElement );

    var ShaderManager = require('shaderManager.js');
    var AudioManager = require('audioManager.js');

    var shaderManager = new ShaderManager();
    audioManager = new AudioManager();

    camera = window.camera = new Camera();
    

    var canvas = document.getElementById("canvas");
    gl = initWebGL(canvas);
    shaderManager.compileShaders(gl);
    initBuffers();

    particleShader = gl.createProgram();
    gl.attachShader(particleShader, shaderManager.vertex['particleShader']);
    gl.attachShader(particleShader, shaderManager.fragment['particleShader']);
    gl.linkProgram(particleShader);

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

    gl.useProgram(particleShader);
    particlePositionAttribute = gl.getAttribLocation(particleShader, "inCoord");
    particleAliveAttribute = gl.getAttribLocation(particleShader, "inAlive");
    particleAgeAttribute = gl.getAttribLocation(particleShader, "inAge");
    particleTypeAttribute = gl.getAttribLocation(particleShader, "inType");

    gl.useProgram(barShader);
    barVerticesLocation = gl.getAttribLocation(barShader, "aVertexPosition");

    gl.useProgram(quadShader);
    quadVerticesLocation = gl.getAttribLocation(quadShader, "inCoord");
    

    // Only continue if WebGL is available and working
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    if (gl) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.disable(gl.DEPTH_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      requestAnimationFrame(drawScene);
    }
  }

  function resize() {
    var width = gl.canvas.clientWidth;
    var height = gl.canvas.clientHeight;
    if (gl.canvas.width != width ||
        gl.canvas.height != height) {

       initFrameBuffer();
       gl.canvas.width = width;
       gl.canvas.height = height;
       gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
  }



})();

