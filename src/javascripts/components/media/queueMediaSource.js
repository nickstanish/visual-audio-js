import React, { PropTypes } from 'react';


function QueueMediaSource(props) {
  return (
    <li>
      <button type="button" className="close" aria-label="Remove" onClick={props.onRemoveItem}>
        <span aria-hidden="true">×</span>
      </button>
      <span className="title">{props.mediaSource.getTitle()}</span>
    </li>
  );
}


QueueMediaSource.propTypes = {
  mediaSource: PropTypes.object,
  onRemoveItem: PropTypes.func
}

export default QueueMediaSource;
