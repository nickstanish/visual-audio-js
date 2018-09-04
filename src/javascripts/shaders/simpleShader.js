/* eslint-disable import/no-webpack-loader-syntax */
import fragment from '!raw-loader!./simple/fragment.glsl';
import vertex from '!raw-loader!./simple/vertex.glsl';

export default {
  vertex,
  fragment,
  uniforms: {
    projectionMatrix: "projectionMatrix",
    modelViewMatrix: "modelViewMatrix",
    modelMatrix: "modelMatrix"
  },
  attributes: {
    vertices: "position"
  }
};
