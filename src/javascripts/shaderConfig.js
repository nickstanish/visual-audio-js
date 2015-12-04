/**
* Copyright 2015 Nick Stanish
*
*/


var TYPE_VERTEX = 1;
var TYPE_FRAGMENT= 2;

var config = [
  {
    name: 'simpleShader',
    type: TYPE_VERTEX,
    source: require('raw!simpleShader.vertex.glsl')
  },
  {
    name: 'simpleShader',
    type: TYPE_FRAGMENT,
    source: require('raw!simpleShader.fragment.glsl')
  },
  {
    name: 'lineShader',
    type: TYPE_VERTEX,
    source: require('raw!line.vertex.glsl')
  },
  {
    name: 'lineShader',
    type: TYPE_FRAGMENT,
    source: require('raw!line.fragment.glsl')
  },
  {
    name: 'particleShader',
    type: TYPE_VERTEX,
    source: require('raw!particle.vertex.glsl')
  },
  {
    name: 'particleShader',
    type: TYPE_FRAGMENT,
    source: require('raw!particle.fragment.glsl')
  }, 
  {
    name: 'barShader',
    type: TYPE_VERTEX,
    source: require('raw!bar.vertex.glsl')
  },
  {
    name: 'barShader',
    type: TYPE_FRAGMENT,
    source: require('raw!bar.fragment.glsl')
  },
  {
    name: 'quadShader',
    type: TYPE_VERTEX,
    source: require('raw!quad.vertex.glsl')
  },
  {
    name: 'quadShader',
    type: TYPE_FRAGMENT,
    source: require('raw!quad.fragment.glsl')
  }
];

var ShaderConfig = {}

ShaderConfig.TYPE_VERTEX = TYPE_VERTEX;
ShaderConfig.TYPE_FRAGMENT = TYPE_FRAGMENT;
ShaderConfig.config = config;

module.exports = ShaderConfig;