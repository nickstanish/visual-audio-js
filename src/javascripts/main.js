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

    if (!gl.getExtension('OES_texture_float')) {
      alert("Some necessary features are not supported by your hardware.");
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

  var particles = [];
  var particleBuffer;
  var particleShader;

  var barShader;
  var barVerticesLocation;

  var audioManager = null;

  var size = 128.0;
  var textures = {
    positionFrameBuffers: [],
    positions: [],
    velocities: [],
    targetPosition: null,
    targetVelocity: null
  };
  var pointLookupBuffer;
  var lookupPoints;
  var updatePositionShader, updatePositionVertices;

  function getRandom(min, max) {
    return Math.random() * (max - min) + min;
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


  }

  window.frameCount = 0;
  function drawPoints(max) {

    // var frameBuffer = textures.positionFrameBuffers[textures.targetPosition];
    var sourcePosition = textures.positions[0];


    gl.useProgram(particleShader);
    var pUniform = gl.getUniformLocation(particleShader, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(particleShader, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(camera.getModelViewMatrix().flatten()));

    var frameUniform = gl.getUniformLocation(particleShader, "inFrame");
    gl.uniform1f(frameUniform, window.frameCount);

    var intensity = gl.getUniformLocation(particleShader, "intensity");
    gl.uniform1f(intensity, max);
  
    var texturePositions = gl.getUniformLocation(particleShader, "texturePositions");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourcePosition);
    gl.uniform1i(texturePositions, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, pointLookupBuffer);
    // gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.vertexAttribPointer(particlePositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, lookupPoints.length / 3);

 /*
    // update positions
    gl.disable(gl.DEPTH_TEST);
    gl.disable (gl.BLEND);
    gl.useProgram(updatePositionShader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, size, size);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourcePosition);
    gl.uniform1i(gl.getUniformLocation(updatePositionShader, "texturePositions"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.velocities[1]);
    gl.uniform1i(gl.getUniformLocation(updatePositionShader, "textureVelocities"), 1);


    gl.bindBuffer(gl.ARRAY_BUFFER, pointLookupBuffer);
    // gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.vertexAttribPointer(updatePositionVertices, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, lookupPoints.length / 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    

*/    

    // swap!
    textures.targetPosition = Math.abs(textures.targetPosition - 1);

  }

  function drawScene() {
    resize();
    stats.begin();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    
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
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // mvPopMatrix();
    var bars = [];
    var max = -1;

    if (audioManager && audioManager.isPlaying()) {

      var bufferLength = audioManager.analyser.frequencyBinCount;
      var widthScale = 8.0;
      var barWidth = widthScale / bufferLength;
      var barPadding = barWidth * 0.2;
      
      var data = audioManager.getFrequencyData();

      var sliceWidth = 1.0 / data.length;
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

      max = (data[0] + data[1] + data[2] + data[3]) / 4.0 / 255.0;
      window.max = max;


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
        gl.vertexAttribPointer(barVerticesLocation, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, bars.length / 3.0);
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

    console.log(keyMap[key]);

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

  function createAndSetupTexture() {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set up texture so we can render any size image and so we are
    // working with pixels.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  function initParticleTextures() {
    var numberOfPoints = size * size;
    lookupPoints = new Float32Array(numberOfPoints * 3); // stored as vertices
    var positionData = new Float32Array(numberOfPoints * 3); // stored as colors
    var particleVelocities = new Float32Array(numberOfPoints * 3);
    for (var i = 0, j = 0; i < numberOfPoints; i++, j += 3){
      var position = {
        x: (i % size) / size,
        y: Math.floor(i / size) / size,
        z: 0 // unused
      };
      lookupPoints[j] = position.x;
      lookupPoints[j+1] = position.y;
      lookupPoints[j+2] = position.z;

      var particle = {
        r: getRandom(-5,5),
        g: getRandom(-5,5),
        b: getRandom(-5,5),
        a: 1 // unused
      };
      positionData[i*3 + 0] = particle.r;
      positionData[i*3 + 1] = particle.g;
      positionData[i*3 + 2] = particle.b;

      positionData1[i*3 + 0] = particle.r;
      positionData1[i*3 + 1] = particle.g;
      positionData1[i*3 + 2] = particle.b;

      var velocity = {
        x: getRandom(-0.005,0.005),
        y: getRandom(-0.005,0.005),
        z: getRandom(-0.005,0.005)
      };

      particleVelocities[i*3 + 0] = velocity.x;
      particleVelocities[i*3 + 1] = velocity.y;
      particleVelocities[i*3 + 2] = velocity.z;

    }
    //   var textures = {
    //   positions: [],
    //   velocities: [],
    //   targetPosition: null,
    //   targetVelocity: null
    // };
    for (var i = 0; i < 2; i++) {
      var texture = createAndSetupTexture();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, size, size, 0, gl.RGB, gl.FLOAT, positionData);
      textures.positions.push(texture);

       // Create a framebuffer
      var frameBuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

      // Attach a texture to it.
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      textures.positionFrameBuffers.push(frameBuffer);
    }
    for (var i = 0; i < 2; i++) {
      textures.velocities.push(createAndSetupTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, size, size, 0, gl.RGB, gl.FLOAT, particleVelocities);
    }

    textures.targetPosition = 1;
    

    pointLookupBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointLookupBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lookupPoints, gl.STATIC_DRAW);

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
    loadIdentity();

    mvRotate(-this.pitch, [1, 0, 0]);
    mvRotate(this.yaw, [0, 1, 0]);
    mvTranslate(this.position);
    

    return mvMatrix;
  }

  var camera;

  function createShader(vertexProgram, fragmentProgram) {
    var shader = gl.createProgram();
    gl.attachShader(shader, vertexProgram);
    gl.attachShader(shader, fragmentProgram);
    gl.linkProgram(shader);
    return shader;
  }


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

    shaderProgram = createShader(shaderManager.vertex['simpleShader'], shaderManager.fragment['simpleShader']);
    particleShader = createShader(shaderManager.vertex['particleShader'], shaderManager.fragment['particleShader']);
    barShader = createShader(shaderManager.vertex['barShader'], shaderManager.fragment['barShader']);
    updatePositionShader = createShader(shaderManager.vertex['updatePositions'], shaderManager.fragment['updatePositions']);



    initParticleTextures();


    // gl.lineWidth(1);
    gl.enable (gl.BLEND);
    gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    

    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Unable to initialize the shader program.");
    }
    gl.useProgram(shaderProgram);
  
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.enableVertexAttribArray(vertexColorAttribute);


    particlePositionAttribute = gl.getAttribLocation(particleShader, "inCoord");
    gl.enableVertexAttribArray(particlePositionAttribute);

    gl.useProgram(barShader);
    barVerticesLocation = gl.getAttribLocation(barShader, "aVertexPosition");
    gl.enableVertexAttribArray(barVerticesLocation);

    gl.useProgram(updatePositionShader);
    updatePositionVertices = gl.getAttribLocation(updatePositionShader, "inCoord");
    gl.enableVertexAttribArray(updatePositionVertices);

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
       
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }



})();

