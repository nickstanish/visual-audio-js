uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
attribute vec3 position;

void main(void) {
  gl_Position = projectionMatrix * modelViewMatrix * modelMatrix * vec4( position, 1.0 );
}
