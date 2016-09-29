
import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import { SOURCE_TYPES } from 'audio/source/mediaSource';

class Player extends Component {
  static propTypes = {
    pausePlaying: PropTypes.func,
    resumePlaying: PropTypes.func,
    playNext: PropTypes.func,
    stopPlaying: PropTypes.func,
    isPlaying: PropTypes.bool,
    isPaused: PropTypes.bool,
    currentMediaSource: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.onStopClicked = this.onStopClicked.bind(this);
    this.onPlayPauseClicked = this.onPlayPauseClicked.bind(this);
    this.onNextClicked = this.onNextClicked.bind(this);
  }

  onStopClicked() {
    this.props.stopPlaying();
  }

  onPlayPauseClicked() {
    const { isPlaying, pausePlaying, resumePlaying } = this.props;
    if (isPlaying) {
      pausePlaying();
    } else {
      resumePlaying();
    }
  }

  onNextClicked() {
    this.props.playNext();
  }

  render() {
    const { isPlaying, isPaused, currentMediaSource } = this.props;
    const showPlayer = (isPlaying || isPaused) && currentMediaSource && currentMediaSource.getType() !== SOURCE_TYPES.MIC;
    return (
      <div id="media-player" className={showPlayer ? "on" : "off"}>
        <div id="media-controls" className="user-select">
          <button className="btn btn-default media-btn" onClick={this.onPlayPauseClicked} >
            <span className={classNames("glyphicon", isPlaying ? "glyphicon-pause" : "glyphicon-play")} />
          </button>
          <button className="btn btn-default media-btn" onClick={this.onStopClicked}>
            <span className="glyphicon glyphicon-stop" />
          </button>
          <button className="btn btn-default media-btn" onClick={this.onNextClicked}>
            <span className="glyphicon glyphicon-step-forward" />
          </button>
        </div>
        <div id="now-playing" className="user-select">
          {currentMediaSource && currentMediaSource.getTitle()}
        </div>
      </div>
    );
  }
}

export default Player;
