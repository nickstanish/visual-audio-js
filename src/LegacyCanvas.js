import React, { Component } from 'react';
import init from './javascripts/init';
import GitHubButton from './javascripts/components/GitHubButton';
import Canvas from './javascripts/components/Canvas';
import QualityControls from './javascripts/components/QualityControls';
import StatsDisplay from './javascripts/components/StatsDisplay';

export default class LegacyCanvas extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: new window.Stats()
    }
  }
  componentDidMount() {
    const { stats } = this.state;
    init({ stats });
  }
  render() {
    const { stats } = this.state;

    return (
      <div className="content-wrapper">
        <audio id="audio"></audio>
        <Canvas />
        <div id="overlay">
          <div id="overlay-wrapper" className="user-select">
            <GitHubButton />
            <div id="audio-controls">
              <div id="audio-chooser">
                <label id="voice-chooser">
                  <div className="btn btn-default media-btn" title="Use microphone as source">
                    <div className="glyphicon glyphicon-record"></div>
                  </div>
                </label>
                <label htmlFor="audioFile" id="file-chooser" title="Select a song from your computer">
                  <div className="btn btn-default media-btn">
                    <div className="glyphicon glyphicon-folder-open"></div>
                  </div>
                  <input id="audioFile" type="file" multiple accept="audio/*" />
                </label>
                <form id="urlSourceForm">
                  <input id="urlSource" className="form-input" type="text" placeholder="Url" title="Play song from url (mp3 or soundcloud)" />
                  <button type="submit" title="Play selected song"><i className="fa fa-plus-square pulse"></i></button>
                  <div className="url-icons">
                    <a href="https://soundcloud.com" title="SoundCloud" target="_blank" rel="noopener noreferrer"><i className="fa fa-soundcloud"></i></a>
                  </div>
                </form>

              </div>
              <div id="media-player" className="off paused">
                <div id="media-controls" className="user-select">
                  <div data-control="play" className="btn btn-default media-btn" title="Play">
                    <div className="glyphicon glyphicon-play"></div>
                  </div>
                  <div data-control="pause" className="btn btn-default media-btn" title="Pause">
                    <div className="glyphicon glyphicon-pause"></div>
                  </div>
                  <div data-control="stop" className="btn btn-default media-btn" title="Stop">
                    <div className="glyphicon glyphicon-stop"></div>
                  </div>
                  <div data-control="next" className="btn btn-default media-btn" title="Next">
                    <div className="glyphicon glyphicon-step-forward"></div>
                  </div>
                </div>
                <div id="now-playing" className="user-select"></div>
              </div>
              <div id="media-queue"></div>
            </div>
          </div>
          <div id="settings">
            <QualityControls />
          </div>
        </div>
        <div id="start">
          <div className="start-container">
            <h1 className="start-message">Click to start playing</h1>
            <h2 className="start-subtext">This link has a song attached to it</h2>
          </div>
        </div>
        <StatsDisplay stats={stats} />
      </div>
    );
  }
}
