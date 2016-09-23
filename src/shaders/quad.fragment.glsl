/**
* Copyright 2015 Nick Stanish
*
*/

precision mediump float;

uniform sampler2D inTexture;
uniform float inWidth;
uniform float inHeight;
uniform float inVolume;

varying vec2 coord;


void main(void) {
  // gl_FragColor = texture2D(inTexture, coord);
  vec2 center = vec2(0.5, 0.5);
  vec2 offsetRatio = vec2(1.0 / inWidth, 1.0 / inHeight);
  float intensity = 20.0 * inVolume;
  if (inVolume <= 0.0) {
    intensity = 1.0;
  }

  vec2 blurVec = (coord - center) * intensity;
  vec4 pixel = vec4(0.0);
  for (float i = 0.0; i < 4.0 ; i++){
    vec2 offset =  blurVec * (i - 4.0) * offsetRatio;
    float weight = (4.0 - i) / 8.0;
    pixel += weight * texture2D(inTexture, coord + offset);
  }
  gl_FragColor = vec4(pixel.rgb, 1.0);
}
