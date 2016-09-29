import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import SoundCloudSource from 'audio/source/soundCloudSource';


const SOUNDCLOUD = /soundcloud.com/;

function isSoundCloudUrl(url) {
  return SOUNDCLOUD.test(url);
}

export function createSourceFromUrl(value, audioContext) {
  let source = null;
  if (isSoundCloudUrl(value)) {
    source = new SoundCloudSource(audioContext, value);
  }
  return source;
}

class UrlInput extends Component {
  static propTypes = {
    addMediaSource: PropTypes.func,
    audioContext: PropTypes.object,
    disabled: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.bindInput = this.bindInput.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.state = {
      value: ""
    };
  }

  componentWillUnmount() {
    this.unbindInput(this._input);
  }

  onChange (event) {
    event.stopPropagation();
    event.preventDefault();
    this.setState({
      value: event.target.value
    });
  }

  onSubmit (event) {
    event.preventDefault();
    const value = this.state.value.trim();
    const { audioContext, addMediaSource } = this.props;

    if (!value) {
      return;
    }
    const source = createSourceFromUrl(value, audioContext);
    if (source) {
      addMediaSource(source);
    }
    this.setState({
      value: ''
    });
  }

  bindInput (input) {
    this.unbindInput(this._input);
    this._input = input;
    const addEvent = input.addEventListener || input.attachEvent;
    // unfortunately react already let these bubble, so use the native event to stop propagation
    addEvent('keyup', this.stopPropagation, true);
    addEvent('keydown', this.stopPropagation, true);
  }

  unbindInput(input) {
    if (input) {
      const removeEvent = input.removeEventListener || input.detachEvent;
      removeEvent('keyup', this.stopPropagation);
      removeEvent('keydown', this.stopPropagation);
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  render() {
    const url = this.state.value.trim();
    return (
      <form id="urlSourceForm" onSubmit={this.onSubmit}>
        <input
          id="urlSource"
          ref={this.bindInput}
          className={classNames("form-input", { __hasText: this.state.value.trim() })}
          type="text"
          placeholder="Url"
          value={this.state.value}
          onChange={this.onChange}
          disabled={this.props.disabled}
          />
        <button type="submit"><i className="fa fa-plus-square"></i></button>
        <div className="url-icons">
          <a href="https://soundcloud.com" title="SoundCloud" target="_blank">
            <i className={classNames("fa fa-soundcloud", { active: isSoundCloudUrl(url) })}></i>
          </a>
        </div>
      </form>
    );
  }
}

export default UrlInput;
