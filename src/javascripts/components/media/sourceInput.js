import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import UrlInput from './urlInput';

import FileSource from 'audio/source/fileSource';
import MicSource from 'audio/source/micSource';

import { SOURCE_TYPES } from 'audio/source/mediaSource';

const SUPPORTS_MIC = !!navigator.getUserMedia;

class SourceInput extends Component {
  static propTypes = {
    addMediaSource: PropTypes.func,
    stopMediaPlayer: PropTypes.func,
    currentMediaSourceType: PropTypes.string,
    audioContext: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.onRecordClicked = this.onRecordClicked.bind(this);
  }

  onRecordClicked(event) {
    const { addMediaSource, stopMediaPlayer, currentMediaSourceType, audioContext } = this.props;

    if ( currentMediaSourceType === SOURCE_TYPES.MIC) {
      stopMediaPlayer();
    } else {
      addMediaSource(new MicSource(audioContext));
    }
  }

  onFilesChosen(event) {
    const { addMediaSource, audioContext } = this.props;
    if (event.target.files.length > 0) {
      const files = Array.prototype.slice.call(event.target.files);
      files.forEach((file) => {
        const source = new FileSource(audioContext, file);
        addMediaSource(source);
      });
    }
  }

  render() {
    return (
      <div id="audio-chooser">
        <label id="voice-chooser" className={classNames({ active: this.props.currentMediaSourceType === SOURCE_TYPES.MIC })}>
          <button
            className="btn btn-default media-btn"
            onClick={this.onRecordClicked}
            title={SUPPORTS_MIC ? "Use your microphone as input" : "Your browser does not support microphone input"}
            disabled={!SUPPORTS_MIC || (this.props.currentMediaSourceType && this.props.currentMediaSourceType !== SOURCE_TYPES.MIC)}
            >
            <span className="glyphicon glyphicon-record"></span>
          </button>
        </label>
        <label htmlFor="audioFile" id="file-chooser">
          <a onClick={() => {}} className="btn btn-default media-btn" disabled={this.props.currentMediaSourceType === SOURCE_TYPES.MIC}>
            <div className="glyphicon glyphicon-folder-open"></div>
          </a>
          <input
            id="audioFile"
            type="file"
            multiple
            accept="audio/*"
            value=""
            onChange={(event) => this.onFilesChosen(event)}
            disabled={this.props.currentMediaSourceType === SOURCE_TYPES.MIC}
            />
        </label>
        <UrlInput
          audioContext={this.props.audioContext}
          addMediaSource={this.props.addMediaSource}
          disabled={this.props.currentMediaSourceType === SOURCE_TYPES.MIC}
          />

      </div>
    );
  }
}

export default SourceInput;
