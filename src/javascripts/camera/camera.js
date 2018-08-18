const glMatrix = require('gl-matrix/dist/gl-matrix');
const { mat4 } = glMatrix;


const pitch_delta = 0.05;
const yaw_delta = 0.05;
const movement_delta = [0.5, 0.5, 0.5];


class Camera {
  constructor (x = 0, y = 0, z = -10) {
    this.position = [x, y, z];
    this.pitch = 0;
    this.yaw = 0;
  }

  moveTo (x, y, z) {
    this.position = [x, y, z];
  }

  getModelViewMatrix () {
    const result = mat4.create();
    mat4.rotateX(result, result, -this.pitch);
    mat4.rotateY(result, result, this.yaw);
    mat4.translate(result, result, this.position);
    return result;
  }

  updatePitch(multiplier = 1) {
    this.pitch += pitch_delta * multiplier;
  }

  updateYaw(multiplier = 1) {
    this.yaw += yaw_delta * multiplier;
  }

  updateX(multiplier = 1) {
    this.position[0] = this.position[0] + movement_delta[0] * multiplier;
  }

  updateY(multiplier = 1) {
    this.position[1] = this.position[1] + movement_delta[1] * multiplier;
  }

  updateZ(multiplier = 1) {
    this.position[2] = this.position[2] + movement_delta[2] * multiplier;
  }

}


export default Camera;
