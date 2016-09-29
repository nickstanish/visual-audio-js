class Queue {
  constructor () {
    this._items = [];
  }

  enqueue (item) {
    console.log("Queueing: ", item)
    this._items.push(item);
  }

  dequeue () {
    return this.popIndex(0);
  }

  size () {
    return this._items.length;
  }

  popIndex (index) {
    return this._items.splice(index, 1)[0];
  }

  clear () {
    this._items.splice(0, this._items.length);
  }

  getItems() {
    return this._items;
  }
}

export default Queue;
