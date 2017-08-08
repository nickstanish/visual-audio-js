/**
* Copyright 2015-2017 Nick Stanish
*
*/

require('less/styles.less');
window.VISUAL_AUDIO = {
  VERSION: window.VERSION
};
import polyfill from 'polyfills';
polyfill();
import animate from './animate';
import createStore from './store';
import { getInitialQuality } from './quality';
import UIController from 'ui/uiController';
import AudioManager from 'audio/audioManager';

const initialState = {
  quality: getInitialQuality()
}
const store = createStore(initialState);


const audioManager = new AudioManager();
const uiController = new UIController(audioManager, store);
animate(store, audioManager, uiController);
