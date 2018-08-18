import React from 'react';
require('./StatsDisplay.css');

export default class StatsDisplay extends React.Component {
  componentDidMount() {
    const { stats } = this.props;
    if (stats) {
      this._container.appendChild( stats.domElement );
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  bindRef = (element) => {
    this._container = element;
  }

  render() {
    return (
      <div id="stats-display" ref={this.bindRef} />
    );
  }
}
