/**
* Copyright 2015 Nick Stanish
*
*/


attribute vec3 inCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 coord;


void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(inCoord, 1.0);
  gl_PointSize = 1.0;
  coord = inCoord.xy;
}