/**
* Copyright 2015-2016 Nick Stanish
*
*/

require('less/styles.less');
window.VISUAL_AUDIO = {
  VERSION: window.VERSION
};

import React from 'react';
import ReactDOM from 'react-dom';
import Application from 'components/application';

ReactDOM.render(<Application />, document.getElementById('bind-node'));
