export default class Rectangle {
  #rectangle;
  constructor(rectangle) {
    this.#rectangle = rectangle;
  }

  get properties() {
    return this.#rectangle;
  }
}
