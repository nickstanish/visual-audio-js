/**
* Copyright 2015 Nick Stanish
*
*/


(function () {
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Animating_objects_with_WebGL
  var polyfill = require("polyfills");
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

  var barBuffer;
  var squareVerticesBuffer, squareVerticesColorBuffer;
  var perspectiveMatrix;
  var vertexPositionAttribute, vertexColorAttribute;
  var gl;
  var squareRotation = 0.0;
  var lastSquareUpdateTime;
  var squareXOffset = 0.0;
  var squareYOffset = 0.0;
  var squareZOffset = 0.0;
  var xIncValue = 0.2;
  var yIncValue = -0.4;
  var zIncValue = 0.3;
  var mvMatrixStack = [];
  var shaderProgram;

  var particleSystem = {
    positions: null,
    velocities: null,
    colors: null,
    alive: null,
    ages: null,
    lifespans: null
  };


  var emitters = [{
    rate: 10, // number to emit per time slice
    lastEmit: null, // used with rate to determine how many to emit
    lifespan: 1000, // lifespan of particle
    max: null,
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

  var particleBuffer, aliveBuffer, particleColorBuffer;
  var particleShader;
  var particleAliveAttribute, particleColorAttribute;

  var barShader;
  var barVerticesLocation;

  var audioManager = null;

  function getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

  function moveParticles () {

    var emitter = emitters[0];
    var emitted = 0;

    var particlesLength = particleSystem.alive.length;

    for (var i = 0; i < particlesLength; i++) {
      var j = i * 3;

      if (particleSystem.alive[i] === PARTICLE_DEAD) {
        // spawn particle
        if (emitted < emitter.rate) {
          var position = emitter.position;
          var velocity = {
            x: getRandom(emitter.minDirection.x, emitter.maxDirection.x),
            y: getRandom(emitter.minDirection.y, emitter.maxDirection.y),
            z: getRandom(emitter.minDirection.z, emitter.maxDirection.z)
          };

          

          particleSystem.positions[j] = position.x;
          particleSystem.positions[j+1] = position.y;
          particleSystem.positions[j+2] = position.z;

          particleSystem.velocities[j] = velocity.x;
          particleSystem.velocities[j+1] = velocity.y;
          particleSystem.velocities[j+2] = velocity.z;

          particleSystem.alive[i] = PARTICLE_ALIVE;
          particleSystem.ages[i] = 0;
          particleSystem.lifespans[i] = emitter.lifespan;
          emitted++;

        }
        
      } else {
        // update particle
        particleSystem.positions[j] += particleSystem.velocities[j];
        particleSystem.positions[j+1] += particleSystem.velocities[j+1];
        particleSystem.positions[j+2] += particleSystem.velocities[j+2];

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
  }

  function initParticles(){ 
    var max = 30000;
    particleSystem.positions = new Float32Array(max * 3);
    particleSystem.velocities = new Float32Array(max * 3);
    particleSystem.colors = new Float32Array(max * 3);
    particleSystem.alive = new Float32Array(max);
    particleSystem.ages = new Float32Array(max);
    particleSystem.lifespans = new Float32Array(max);
    
    for (var i = 0, j = 0; i < max; i++, j +=3) {
      /*
      var position = {
        x: getRandom(-5,5),
        y: getRandom(-5,5),
        z: getRandom(-5,5)
      };
      */
      /*
      var velocity = {
        x: getRandom(-0.005,0.005),
        y: getRandom(-0.005,0.005),
        z: getRandom(-0.005,0.005)
      };
      */

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

      var color = {
        r: getRandom(0,1),
        g: getRandom(0,1),
        b: getRandom(0,1)
      };

      var alive = PARTICLE_DEAD; 

      particleSystem.positions[j] = position.x;
      particleSystem.positions[j+1] = position.y;
      particleSystem.positions[j+2] = position.z;

      particleSystem.velocities[j] = velocity.x;
      particleSystem.velocities[j+1] = velocity.y;
      particleSystem.velocities[j+2] = velocity.z;

      particleSystem.colors[j] = color.r;
      particleSystem.colors[j+1] = color.g;
      particleSystem.colors[j+2] = color.b;

      particleSystem.alive[j] = alive;

    }

    particleBuffer = gl.createBuffer();
    aliveBuffer = gl.createBuffer();
    particleColorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, aliveBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.alive, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSystem.colors, gl.STATIC_DRAW);
  }

  function mvPushMatrix(m) {
    if (m) {
      mvMatrixStack.push(m.dup());
      mvMatrix = m.dup();
    } else {
      mvMatrixStack.push(mvMatrix.dup());
    }
  }

  function mvPopMatrix() {
    if (!mvMatrixStack.length) {
      throw("Can't pop from an empty matrix stack.");
    }
    
    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
  }

  function mvRotate(angle, v) {
    var inRadians = angle * Math.PI / 180.0;
    
    var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
  }


  function loadIdentity() {
    mvMatrix = Matrix.I(4);
  }

  function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
  }

  function mvTranslate(v) {
    multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
  }

  function setMatrixUniforms() {
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(camera.getModelViewMatrix().flatten()));
  
    var mUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
    var modelMatrix = Matrix.I(4);
    var inRadians = squareRotation * Math.PI / 180.0;
    var v = [1, 0, 1];
    
    var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
    modelMatrix = modelMatrix.x(m);
    gl.uniformMatrix4fv(mUniform, false, new Float32Array(modelMatrix.flatten()));
  
  }

  function initBuffers() {
    squareVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
    
    var vertices = [
      1.0,  1.0,  0.0,
      -1.0, 1.0,  0.0,
      1.0,  -1.0, 0.0,
      -1.0, -1.0, 0.0
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var colors = [
      1.0,  1.0,  1.0,  1.0,    // white
      1.0,  0.0,  0.0,  1.0,    // red
      0.0,  1.0,  0.0,  1.0,    // green
      0.0,  0.0,  1.0,  1.0     // blue
    ];


    
    squareVerticesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    initParticles();

  }

  window.frameCount = 0;
  function drawPoints(max) {
    moveParticles();

    gl.useProgram(particleShader);
    var pUniform = gl.getUniformLocation(particleShader, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(particleShader, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(camera.getModelViewMatrix().flatten()));

    var frameUniform = gl.getUniformLocation(particleShader, "inFrame");
    gl.uniform1f(frameUniform, window.frameCount);


    var intensity = gl.getUniformLocation(particleShader, "intensity");
    gl.uniform1f(intensity, max);


    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.enableVertexAttribArray(particlePositionAttribute);
    gl.vertexAttribPointer(particlePositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, aliveBuffer);
    gl.enableVertexAttribArray(particleAliveAttribute);
    gl.vertexAttribPointer(particleAliveAttribute, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleColorBuffer);
    gl.enableVertexAttribArray(particleColorAttribute);
    gl.vertexAttribPointer(particleColorAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, particleSystem.positions.length / 3);


    gl.disableVertexAttribArray(particleColorAttribute);
    gl.disableVertexAttribArray(particleAliveAttribute);
    gl.disableVertexAttribArray(particlePositionAttribute);
  }

  function drawScene() {
    resize();
    stats.begin();
    
    
    setTimeout(function() {
      window.frameCount += 1;;
    }, 0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    // 16:9
    // 4:3
    var aspect = canvas.clientWidth / canvas.clientHeight;
    perspectiveMatrix = makePerspective(50, aspect, 0.1, 100.0);
    
    // loadIdentity();
     // mvRotate(squareRotation, [1, 0, 1]);
     // mvTranslate([window.cx || -6, window.cy || -7, window.cz || -18.0]);

   // Save the current matrix, then rotate before we draw.

    // mvPushMatrix();
   
    // mvTranslate([squareXOffset, squareYOffset, squareZOffset]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    gl.enableVertexAttribArray(vertexColorAttribute);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disableVertexAttribArray(vertexColorAttribute);
    gl.disableVertexAttribArray(vertexPositionAttribute);

    // mvPopMatrix();
    var bars = [];
    var max = -1;

    if (audioManager && audioManager.isPlaying()) {

      var bufferLength = audioManager.analyser.frequencyBinCount;
      var widthScale = 8.0;
      var barWidth = widthScale / bufferLength;
      var barPadding = barWidth * 0.2;

      var data = audioManager.getFrequencyData();
      var halfWidthScale = (widthScale / 2);

      for(var i = 0; i < data.length; i++) {

        var height = data[i] / 256; // [0, 1]
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


      max = (data[0] + data[1] + data[2]) / 3.0 / 255.0;


      barBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, barBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bars), gl.STATIC_DRAW);

      (function () {
        gl.useProgram(barShader);
        var pUniform = gl.getUniformLocation(barShader, "uPMatrix");
        gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

        var mvUniform = gl.getUniformLocation(barShader, "uMVMatrix");
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(camera.getModelViewMatrix().flatten()));
      
        var mUniform = gl.getUniformLocation(barShader, "uMMatrix");
        var modelMatrix = Matrix.I(4);
        // var inRadians = squareRotation * Math.PI / 180.0;
        var v = [0, 1, 0];
        
        var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
        // var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
        modelMatrix = modelMatrix.x(m);
        gl.uniformMatrix4fv(mUniform, false, new Float32Array(modelMatrix.flatten()));

        gl.bindBuffer(gl.ARRAY_BUFFER, barBuffer);
        gl.enableVertexAttribArray(barVerticesLocation);
        gl.vertexAttribPointer(barVerticesLocation, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, bars.length / 3.0);

        gl.disableVertexAttribArray(barVerticesLocation);
      })()

      
    }
    drawPoints(max);

    var currentTime = (new Date).getTime();
    if (lastSquareUpdateTime) {
      var delta = currentTime - lastSquareUpdateTime;

      squareRotation += (60 * delta) / 1000.0;
      //squareXOffset += xIncValue * ((30 * delta) / 1000.0);
      //squareYOffset += yIncValue * ((30 * delta) / 1000.0);
      //squareZOffset += zIncValue * ((30 * delta) / 1000.0);

      if (Math.abs(squareYOffset) > 2.5) {
        xIncValue = -xIncValue;
        yIncValue = -yIncValue;
        zIncValue = -zIncValue;
      }
    }

    lastSquareUpdateTime = currentTime;


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
    var movement_delta = 0.1;

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
        camera.position[2] += movement_delta;
      break;
      case "move_backward":
        camera.position[2] -= movement_delta;
      break;
      case "move_left":
        camera.position[0] += movement_delta;
      break;
      case "move_right":
        camera.position[0] -= movement_delta;
      break;

    }

    console.log(camera.position);
    console.log(camera.pitch);
    console.log(camera.yaw);
    
  }

  function Camera () {
    // this.position = [0,0,-2];
    // this.position = [0,0,-72];
    this.position = [0, 0, -9];
    this.pitch = 0;
    // this.pitch = 22;

    this.yaw = 0;
    // this.yaw = 20;
    
  }

  Camera.prototype.getModelViewMatrix = function () {
    // [0, 0, -39.50000000000029]
    // main.js:338 21.400000000000034
    // main.js:339 -16.19999999999996


    loadIdentity();

    mvRotate(-this.pitch, [1, 0, 0]);
    mvRotate(this.yaw, [0, 1, 0]);
    mvTranslate(this.position);
    

    return mvMatrix;
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

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, shaderManager.vertex['simpleShader']);
    gl.attachShader(shaderProgram, shaderManager.fragment['simpleShader']);
    gl.linkProgram(shaderProgram);

    particleShader = gl.createProgram();
    gl.attachShader(particleShader, shaderManager.vertex['particleShader']);
    gl.attachShader(particleShader, shaderManager.fragment['particleShader']);
    gl.linkProgram(particleShader);

    barShader = gl.createProgram();
    gl.attachShader(barShader, shaderManager.vertex['barShader']);
    gl.attachShader(barShader, shaderManager.fragment['barShader']);
    gl.linkProgram(barShader);

    gl.enable (gl.BLEND);
    gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Unable to initialize the shader program.");
    }
    gl.useProgram(shaderProgram);
  
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");

    gl.useProgram(particleShader);
    particlePositionAttribute = gl.getAttribLocation(particleShader, "inCoord");
    particleAliveAttribute = gl.getAttribLocation(particleShader, "inAlive");
    particleColorAttribute = gl.getAttribLocation(particleShader, "inColor");

    gl.useProgram(barShader);
    barVerticesLocation = gl.getAttribLocation(barShader, "aVertexPosition");

    // Only continue if WebGL is available and working
    // gl.viewport(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    if (gl) {
      // Set clear color to black, fully opaque
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      // Enable depth testing
      gl.enable(gl.DEPTH_TEST);
      // Near things obscure far things
      gl.depthFunc(gl.LEQUAL);
      // Clear the color as well as the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      requestAnimationFrame(drawScene);
    }
  }

  function resize() {
    var width = gl.canvas.clientWidth;
    var height = gl.canvas.clientHeight;
    if (gl.canvas.width != width ||
        gl.canvas.height != height) {
       gl.canvas.width = width;
       gl.canvas.height = height;
       gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
  }



})();

