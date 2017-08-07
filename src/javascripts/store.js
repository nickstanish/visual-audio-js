import isEqual from 'lodash.isequal';

function puid() {
  let id = 0;
  return function getPuid() {
    return id++;
  }
}

function notify(subscriptions, newState) {
  Object.keys(subscriptions).forEach(id => {
    const callback = subscriptions[id];
    callback(newState);
  });
}

export default function createStore(initialState = {}) {
  const getSubscriptionId = puid();
  const subscriptions = {};
  let state = initialState;

  return {
    getState: () => state,
    updateState: (mergeState) => {
      const newState = {
        ...state,
        ...mergeState
      };

      if (!isEqual(newState, state)) {
        notify(subscriptions, newState);
        state = newState;
      }
    },
    subscribe: (callback) => {
      const id = getSubscriptionId();
      subscriptions[id] = callback;
      return function unsubscribe() {
        delete subscriptions[id];
      };
    }
  }
}
