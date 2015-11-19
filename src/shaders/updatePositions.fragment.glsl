/**
* Copyright 2015 Nick Stanish
*
*/

precision mediump float;

uniform sampler2D textureVelocities;
uniform sampler2D texturePositions;

varying vec2 coord;
      
void main(void) {

  // gl_FragColor = vec4(texture2D(texturePositions, coord.xy).rgb + texture2D(textureVelocities, coord.xy).rgb, 1.0);
  gl_FragColor = vec4(texture2D(texturePositions, coord.xy).rgb, 1.0);
}