/**
* Copyright 2015 Nick Stanish
*
*/


attribute vec3 inCoord;

varying vec2 coord;


void main(void) {

  gl_Position = vec4(inCoord.xy * 128.0, 1.0, 1.0);
  coord = inCoord.xy;
}