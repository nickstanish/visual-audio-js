
class KeyInput {
  constructor() {
    this.keyStatus = {};
    this.keysToActions = {};
  }

  setKeyActive(keyCode) {
    this.keyStatus[keyCode] = true;
  }
  setKeyInactive(keyCode) {
    this.keyStatus[keyCode] = false;
  }

  isKeyActive(keyCode) {
    return !!this.keyStatus[keyCode];
  }

  registerKeyAction(keyCode, action) {
    this.keysToActions[keyCode] = action;
  }

  getActiveActions() {
    const activeKeys = Object.keys(this.keyStatus).filter(key => this.isKeyActive(key));
    const activeActions = new Set();
    activeKeys.forEach(key => {
      if (this.keysToActions[key]) {
        activeActions.add(this.keysToActions[key]);
      }
    });
    return [...activeActions];
  }

}

export default KeyInput;
