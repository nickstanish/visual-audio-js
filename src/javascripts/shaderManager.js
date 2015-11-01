var _ = require("lodash/lodash.js");
var ShaderConfig = require('shaderConfig.js');

var ShaderManager = function () {
  this.fragment = {};
  this.vertex = {};
}

function compileShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
    
  // Compile the shader program
  gl.compileShader(shader);  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
    console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));  
    return null;  
  }
  return shader;
};

ShaderManager.prototype.compileShaders = function (gl) {
  _.each(ShaderConfig.config, function (shaderConfig){
    var map;
    var type;
    if (shaderConfig.type === ShaderConfig.TYPE_VERTEX){
      map = this.vertex;
      type = gl.VERTEX_SHADER;
    } else {
      map = this.fragment;
      type = gl.FRAGMENT_SHADER;
    }
    map[shaderConfig.name] = compileShader(gl, type, shaderConfig.source);

  }, this)

};

module.exports = ShaderManager;