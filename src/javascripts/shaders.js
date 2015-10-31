var _ = require("lodash/lodash.js");

var fragmentShaders = ['simpleShader'];
var vertexShaders = []; 

var fragmentExtension = ".fragment.glsl";
var vertexExtension = ".vertex.glsl";


var Shaders = function () {
  this.fragment = {};
  this.vertex = {};
}

Shaders.prototype.loadShaders = function () {

  _.each(fragmentShaders, function (name) {
    this.fragment[name] = require('raw!' + name + fragmentExtension);

  }, this);

  _.each(vertexShaders, function (name) {
    this.vertex[name] = require('raw!' + name + vertexExtension);
    
  }, this);
}

module.exports = Shaders;