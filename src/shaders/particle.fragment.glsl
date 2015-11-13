/**
* Copyright 2015 Nick Stanish
*
*/
precision mediump float;

uniform float inFrame;
varying vec2 coord;

uniform float intensity;

      
void main(void) {
  float value;
  if (intensity < 0.0) {
    value = sin((inFrame + coord.x * coord.y) / 50.0 + coord.x / coord.y) / 2.0 + 0.5;
  } else {
    value = intensity;
  }
  gl_FragColor = vec4(value, value, value,1);
}