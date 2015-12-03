/**
* Copyright 2015 Nick Stanish
*
*/
precision mediump float;

uniform float inFrame;
varying vec2 coord;
varying vec3 color;

varying float alive;

varying float age;

uniform sampler2D inTexture;

      
void main(void) {
  if (alive != 1.0) {
    discard;
  }

  float alpha = 1.0;
  
  // if (intensity >= 0.0) {
  //  alpha = intensity;
  // }
  

  alpha = (1.0 - age) * alpha;

  // gl_FragColor = vec4(color, texAlpha);
  gl_FragColor = vec4((texture2D(inTexture, gl_PointCoord.st).rgb * color), alpha);
}