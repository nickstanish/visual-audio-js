import React from 'react';

export default class QualityControls extends React.Component {
  render() {
    return (
      <div>
        <label>Quality: </label>
        <button data-quality="LOW" type="button" className="btn btn-sm btn-default media-btn">Low</button>
        <button data-quality="MEDIUM" type="button" className="btn btn-sm btn-default media-btn">Medium</button>
        <button data-quality="HIGH" type="button" className="btn btn-sm btn-default media-btn active">High</button>
      </div>
    );
  }
}
