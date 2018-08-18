/* eslint-disable import/no-webpack-loader-syntax */
import fragment from '!raw-loader!./bar/fragment.glsl';
import vertex from '!raw-loader!./bar/vertex.glsl';

export default {
  vertex,
  fragment,
  uniforms: {
    uPMatrix: 'uPMatrix',
    uMVMatrix: 'uMVMatrix',
    uMMatrix: 'uMMatrix'
  },
  attributes: {
    vertices: "aVertexPosition"
  }
};
