/**
* Copyright 2015 Nick Stanish
*
*/


attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;


uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uMMatrix;

varying lowp vec4 vColor;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
}