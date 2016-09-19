/**
* Copyright 2015 Nick Stanish
*
*/


export const TYPE_VERTEX = 1;
export const TYPE_FRAGMENT= 2;

export const config = [
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
  },
  {
    name: 'gpuParticleShader',
    type: TYPE_VERTEX,
    source: require('raw!gpuParticle.vertex.glsl')
  },
  {
    name: 'gpuParticleShader',
    type: TYPE_FRAGMENT,
    source: require('raw!gpuParticle.fragment.glsl')
  }
];
