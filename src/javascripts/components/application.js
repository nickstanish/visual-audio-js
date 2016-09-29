import React, { Component } from 'react';

import SourceInput from './media/sourceInput';
import QueueListView from './media/queueListView';
import Player from './media/player';
import { createSourceFromUrl } from './media/urlInput'
import * as BrowserUtils from 'utils/browser';

import MediaPlayer, { MEDIA_PLAYER_EVENTS } from 'audio/mediaPlayer';
import GenericQueue from 'audio/queue';
import Start from './start';

const audioContext = new AudioContext();
const mediaQueue = new GenericQueue();
const mediaPlayer = new MediaPlayer(audioContext);

import { animate } from 'animate';


const params = BrowserUtils.getQueryParams();
const predefinedMediaUrl = params.media;
let preloadedSource = null;

class Application extends Component {

  constructor(props) {
    super(props);

    this.state = {
      predefinedMediaUrl: predefinedMediaUrl
    };

    this.onPreload = this.onPreload.bind(this);
    this.onRemoveQueueItem = this.onRemoveQueueItem.bind(this);
    this.onMediaPlayerEnded = this.onMediaPlayerEnded.bind(this);
    this.onMediaPlayerBeginPlaying = this.onMediaPlayerBeginPlaying.bind(this);
    this.pausePlaying = this.pausePlaying.bind(this);
    this.resumePlaying = this.resumePlaying.bind(this);
    this.playNext = this.playNext.bind(this);
    this.stopPlaying = this.stopPlaying.bind(this);
  }

  componentDidMount() {
    mediaPlayer.on(MEDIA_PLAYER_EVENTS.ENDED, this.onMediaPlayerEnded);
    mediaPlayer.on(MEDIA_PLAYER_EVENTS.PLAYING, this.onMediaPlayerBeginPlaying);
    if (predefinedMediaUrl) {
      preloadedSource = createSourceFromUrl(predefinedMediaUrl, audioContext);
      if (preloadedSource) {
        preloadedSource.load();
      } else {
        this.setState({
          predefinedMediaUrl: null
        });
      }
    }
    animate(mediaPlayer);
  }

  componentWillUnmount() {
    mediaPlayer.off(MEDIA_PLAYER_EVENTS.ENDED, this.onMediaPlayerEnded);
    mediaPlayer.off(MEDIA_PLAYER_EVENTS.PLAYING, this.onMediaPlayerBeginPlaying);
  }

  resumePlaying () {
    mediaPlayer.resume().then(() => this.forceUpdate());
  }
  pausePlaying () {
    mediaPlayer.pause().then(() => this.forceUpdate());
  }

  playNext () {
    const nextSource = mediaQueue.dequeue();
    if (nextSource) {
      mediaPlayer.play(nextSource);
    } else {
      mediaPlayer.stop();
    }
    this.forceUpdate();
  }

  stopPlaying() {
    mediaPlayer.stop();
    this.forceUpdate();
  }
  addMediaSource(mediaSource) {
    if (!mediaPlayer.isActive()) {
      console.log("going to play", mediaSource);
      mediaPlayer.play(mediaSource);
    } else {
      mediaQueue.enqueue(mediaSource);
    }
    mediaSource.load().then(() => {
      this.forceUpdate();
    });
  }

  onMediaPlayerEnded() {
    this.forceUpdate();
  }

  onMediaPlayerBeginPlaying() {
    this.forceUpdate();
  }

  onRemoveQueueItem(index) {
    mediaQueue.popIndex(index);
    this.forceUpdate();
  }

  onPreload() {
    if (this.state.predefinedMediaUrl) {
      mediaPlayer.play(preloadedSource);
      this.setState({
        predefinedMediaUrl: null
      });
    }
  }

  render() {
    const currentMediaSource = mediaPlayer.getCurrentMediaSource();
    return (
      <div>
        <div className="inline-block">
          <SourceInput
            addMediaSource={(mediaSource) => this.addMediaSource(mediaSource)}
            stopMediaPlayer={() => this.stopPlaying()}
            currentMediaSourceType={currentMediaSource && currentMediaSource.getType()}
            audioContext={audioContext}
          />
        </div>
        <div className="inline-block">
          <Player
            stopPlaying={this.stopPlaying}
            pausePlaying={this.pausePlaying}
            playNext={this.playNext}
            resumePlaying={this.resumePlaying}
            isPlaying={mediaPlayer.isPlaying()}
            isPaused={mediaPlayer.isSuspended()}
            currentMediaSource={currentMediaSource}
            />
        </div>
        <QueueListView
          mediaSources={mediaQueue.getItems()}
          removeQueueIndex={this.onRemoveQueueItem}
          />
        {this.state.predefinedMediaUrl && <Start onClick={this.onPreload} predefinedMediaUrl={this.state.predefinedMediaUrl}/>}
      </div>
    );
  }
}

export default Application;
