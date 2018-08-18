/* eslint-disable import/first */
require('../styles/styles.css');
window.VISUAL_AUDIO = {
  VERSION: window.VERSION
};
import polyfill from './polyfills';
polyfill();
import animate from './animate';
import createStore from './store';
import { getInitialQuality } from './quality';
import UIController from './ui/uiController';
import AudioManager from './audio/audioManager';
import { getQueryParams } from './utils/browser';


function getAnimationOptions() {
  const options = {
    maxParticles: 5000,
    emissionRate: 2,
    blur: false,
    showBars: true
  };

  function isParamTrue (param) {
    return (typeof param === 'boolean' && param) || (param.toLowerCase() === "true") || (param === "1");
  }

  const params = getQueryParams();
  options.predefinedMedia = params.media;
  try {
    if (params.max && parseInt(params.max, 10) && parseInt(params.max, 10) > 0){
      options.maxParticles = parseInt(params.max, 10);
    }
    if (params.rate && parseInt(params.rate, 10) && parseInt(params.rate, 10) > 0){
      options.emissionRate = parseInt(params.rate, 10);
    }
    if (params.bars){
      options.showBars = isParamTrue(params.bars);
    }
    if (params.blur){
      options.blur = isParamTrue(params.blur);
    }

  } catch (e) {
    if (console.error) {
      console.error(e);
    }
  }
  return options;
}


export default function init({ stats }) {
  const initialState = {
    quality: getInitialQuality()
  }
  const store = createStore(initialState);
  const animationOptions = getAnimationOptions();


  const audioManager = new AudioManager();
  const uiController = new UIController(audioManager, store);
  animate(store, audioManager, uiController, { stats, options: animationOptions });
}
