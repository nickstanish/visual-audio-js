/**
* Copyright 2015 Nick Stanish
*
*/


attribute vec3 inCoord;

uniform sampler2D texturePositions;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 coord;


void main(void) {
  vec4 tcoord = texture2D(texturePositions, inCoord.xy);
  gl_Position = uPMatrix * uMVMatrix * vec4(tcoord.xyz, 1.0);
  gl_PointSize = 2.0;
  coord = tcoord.xy;
}