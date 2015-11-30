/**
* Copyright 2015 Nick Stanish
*
*/


attribute vec3 inCoord;
attribute vec3 inColor;
attribute float inAlive;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;


varying vec2 coord;
varying float alive;
varying vec3 color;


void main(void) {
  alive = inAlive;

  gl_Position = uPMatrix * uMVMatrix * vec4(inCoord, 1.0);
  gl_PointSize = 2.0;
  coord = inCoord.xy;
  color = inColor;
}
