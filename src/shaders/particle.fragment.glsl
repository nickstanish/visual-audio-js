/**
* Copyright 2015 Nick Stanish
*
*/
precision mediump float;

uniform float inFrame;
varying vec2 coord;

      
void main(void) {
  float value = sin((inFrame + coord.x * coord.y) / 50.0 + coord.x / coord.y) / 2.0 + 0.5;
  gl_FragColor = vec4(value, value, value,1);
}