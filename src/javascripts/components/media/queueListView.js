import React, { Component, PropTypes } from 'react';

import QueueMediaSource from './queueMediaSource';

class QueueListView extends Component {
  static propTypes = {
    removeQueueIndex: PropTypes.func,
    mediaSources: PropTypes.array
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="media-queue">
        <ul>
          {this.props.mediaSources.map((mediaSource, index) => {
            return <QueueMediaSource key={index} onRemoveItem={() => this.props.removeQueueIndex(index)} mediaSource={mediaSource} />
          })}
        </ul>
      </div>
    );
  }
}

export default QueueListView;
