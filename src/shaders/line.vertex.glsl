/**
* Copyright 2015 Nick Stanish
*
*/


attribute vec3 inCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;


void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(inCoord, 1.0);
}