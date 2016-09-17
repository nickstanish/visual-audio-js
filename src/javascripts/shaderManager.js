/**
* Copyright 2015 Nick Stanish
*
*/

const ShaderConfig = require('shaderConfig.js');

const ShaderManager = function () {
  this.fragment = {};
  this.vertex = {};
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

ShaderManager.prototype.compileShaders = function (gl) {
  for (let i = 0; i < ShaderConfig.config.length; i++) {
    const { source, type, name } = ShaderConfig.config[i];
    if (type === ShaderConfig.TYPE_VERTEX){
      this.vertex[name] = compileShader(gl, gl.VERTEX_SHADER, source);
    } else {
      this.fragment[name] = compileShader(gl, gl.FRAGMENT_SHADER, source);
    }
  }

};

module.exports = ShaderManager;
