/**
* Copyright 2015 Nick Stanish
*
*/
precision mediump float;

uniform float inFrame;
varying vec2 coord;
varying vec3 color;

varying float alive;
uniform float intensity;

      
void main(void) {
  if (alive != 1.0) {
    discard;
  }

  float alpha = 1.0;
  if (intensity >= 0.0) {
    alpha = intensity;
  }
  
  gl_FragColor = vec4(color, alpha);
}