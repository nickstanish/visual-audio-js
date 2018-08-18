/* eslint-disable import/no-webpack-loader-syntax */
import fragment from '!raw-loader!./quad/fragment.glsl';
import vertex from '!raw-loader!./quad/vertex.glsl';

export default {
  vertex,
  fragment,
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
