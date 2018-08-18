/* eslint-disable import/no-webpack-loader-syntax */
import fragment from '!raw-loader!./gpuParticle/fragment.glsl';
import vertex from '!raw-loader!./gpuParticle/vertex.glsl';

export default {
  vertex,
  fragment,
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
