import React from 'react';

export default class Canvas extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  bindRef = (element) => {
    this._canvas = element;
  }

  render() {
    return (
      <canvas id="canvas" ref={this.bindRef} />
    );
  }
}
