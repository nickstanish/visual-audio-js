/**
* Copyright 2015 Nick Stanish
*
*/
precision mediump float;

uniform float inFrame;
varying vec2 coord;

uniform float intensity;
      
void main(void) {
  float value = 1.0;
  float alpha = 1.0;
  // if (intensity < 0.0) {
  // value = sin((inFrame + coord.x * coord.y) / 50.0 + coord.x / coord.y) / 2.0 + 0.5;
  //  value = 1.0;
  // } 

  if (intensity >= 0.0) {
    alpha = intensity;
  }
  
  gl_FragColor = vec4(value, value, value,alpha);
}