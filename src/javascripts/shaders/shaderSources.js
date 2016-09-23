
export const FRAGMENT_SOURCES = {
  simpleShader: require('raw!simpleShader.fragment.glsl'),
  lineShader: require('raw!line.fragment.glsl'),
  barShader: require('raw!bar.fragment.glsl'),
  quadShader: require('raw!quad.fragment.glsl'),
  gpuParticleShader: require('raw!gpuParticle.fragment.glsl')
};

export const VERTEX_SOURCES = {
  simpleShader: require('raw!simpleShader.vertex.glsl'),
  lineShader: require('raw!line.vertex.glsl'),
  barShader: require('raw!bar.vertex.glsl'),
  quadShader: require('raw!quad.vertex.glsl'),
  gpuParticleShader: require('raw!gpuParticle.vertex.glsl')
};
