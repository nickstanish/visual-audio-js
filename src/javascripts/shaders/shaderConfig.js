export const SHADER_GPU_PARTICLE_CONFIG = {
  vertex: 'gpuParticleShader',
  fragment: 'gpuParticleShader',
  uniforms: {
    projectionMatrix: "projectionMatrix",
    modelViewMatrix: "modelViewMatrix",
    modelMatrix: "modelMatrix",
    position: "position",
    uTime: "uTime",
    uScale: "uScale",
    tSprite: "tSprite",
    pixelDensity: "pixelDensity"
  },
  attributes: {
    particlePositionsStartTime: 'particlePositionsStartTime',
    particleVelColSizeLife: 'particleVelColSizeLife'
  }
};

export const QUAD_SHADER_CONFIG = {
  vertex: 'quadShader',
  fragment: 'quadShader',
  uniforms: {
    width: "inWidth",
    height: "inHeight",
    volume: "inVolume",
    texture: "inTexture"
  },
  attributes: {
    vertices: "inCoord"
  }
};

export const BAR_SHADER_CONFIG = {
  vertex: 'barShader',
  fragment: 'barShader',
  uniforms: {
    uPMatrix: 'uPMatrix',
    uMVMatrix: 'uMVMatrix',
    uMMatrix: 'uMMatrix'
  },
  attributes: {
    vertices: "aVertexPosition"
  }
};
