import React, { PropTypes } from 'react';

function Start(props) {
  return (
    <div id="start" onClick={props.onClick}>
      <div className="start-container">
        <h1 className="start-message">Click to start playing</h1>
        <h2 className="start-subtext">Will play media from {props.predefinedMediaUrl}</h2>
      </div>
    </div>
  );
}

Start.propTypes= {
  onClick: PropTypes.func,
  predefinedMediaUrl: PropTypes.string
};

export default Start;
