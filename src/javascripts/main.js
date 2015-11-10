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
  document.addEventListener("resize", onResize);

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
    
    return gl;
  }

  var horizAspect = 480.0/640.0;
  var squareVerticesBuffer, squareVerticesColorBuffer;
  var perspectiveMatrix;
  var vertexPositionAttribute, vertexColorAttribute;
  var linePositionsAttribute, lineVerticesBuffer, lineColorBuffer;
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
  var lineShader;

  var audioManager = null;

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
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
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

    var lineColors = [
      1.0, 1.0, 1.0, 1.0,
      1.0,  1.0,  1.0,  1.0
    ];
    
    squareVerticesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    lineColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.STATIC_DRAW);

  }

  function drawScene() {
    requestAnimationFrame(drawScene);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    
    perspectiveMatrix = makePerspective(45, canvas.offsetWidth/canvas.offsetHeight, 0.1, 100.0);
    
    loadIdentity();
     mvTranslate([-0.0, 0.0, -6.0]);

   // Save the current matrix, then rotate before we draw.

    mvPushMatrix();
    mvRotate(squareRotation, [1, 0, 1]);
    // mvTranslate([squareXOffset, squareYOffset, squareZOffset]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    mvPopMatrix();

    if (audioManager && audioManager.isPlaying()) {
      

      var points = [];

      var data = audioManager.getFrequencyData();

      var sliceWidth = 1.0 / data.length;
      
      var x = 0;
      var y = 0;
      var z = 1;

      for(var i = 0; i < data.length; i++) {
           
        var v = data[i] / 128 - 1; // [-1,1]
        x = (i * sliceWidth - 0.5) * 4;
        y = v * 2;

        points = points.concat([x, y, z]);

      }

      // linePositionsAttribute, lineVerticesBuffer
      gl.useProgram(lineShader);
       var pUniform = gl.getUniformLocation(lineShader, "uPMatrix");
      gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

      var mvUniform = gl.getUniformLocation(lineShader, "uMVMatrix");
      gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

      lineVerticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, lineVerticesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, lineVerticesBuffer);
      gl.vertexAttribPointer(linePositionsAttribute, 3, gl.FLOAT, false, 0, 0);

      // gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
      // gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.LINE_STRIP, 0, points.length / 3);

      
    }

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
  }

  function onLoad () {

    var ShaderManager = require('shaderManager.js');
    var AudioManager = require('audioManager.js');

    var shaderManager = new ShaderManager();
    audioManager = new AudioManager();
    

    var canvas = document.getElementById("canvas");
    gl = initWebGL(canvas);
    shaderManager.compileShaders(gl);
    initBuffers();

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, shaderManager.vertex['simpleShader']);
    gl.attachShader(shaderProgram, shaderManager.fragment['simpleShader']);
    gl.linkProgram(shaderProgram);

    lineShader = gl.createProgram();
    gl.attachShader(lineShader, shaderManager.vertex['lineShader']);
    gl.attachShader(lineShader, shaderManager.fragment['lineShader']);
    gl.linkProgram(lineShader);

    gl.lineWidth(1);

    

    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Unable to initialize the shader program.");
    }
    gl.useProgram(shaderProgram);
  
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");



    console.log(vertexPositionAttribute);
    console.log(vertexColorAttribute);
    
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.enableVertexAttribArray(vertexColorAttribute);

    linePositionsAttribute = gl.getAttribLocation(lineShader, "inCoord");
    gl.enableVertexAttribArray(linePositionsAttribute);

    // Only continue if WebGL is available and working
    gl.viewport(0, 0, canvas.width, canvas.height);
  
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

  function onResize() {
  }


})();

