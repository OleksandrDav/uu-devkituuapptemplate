export default class State {
  static get CREATED() {
    return "created";
  }

  static get BEING_INITIALIZED() {
    return "beingInitialized";
  }

  static get ACTIVE() {
    return "active";
  }

  static get WARNING() {
    return "warning";
  }

  static get PROBLEM() {
    return "problem";
  }

  static get PRE_CLOSED() {
    return "preClosed";
  }

  static get CLOSED() {
    return "closed";
  }

  static #stateMap = new Map([
    [State.CREATED, { order: 1, active: false, icon: "uubml-state-s00-initial" }],
    [State.BEING_INITIALIZED, { order: 2, active: false, icon: "uubml-state-s00-system" }],
    [State.ACTIVE, { order: 3, active: true, icon: "uubml-state-s00-active" }],
    [State.WARNING, { order: 4, active: false, icon: "uubml-state-s00-alternative-active" }],
    [State.PROBLEM, { order: 5, active: false, icon: "uubml-state-s00-problem" }],
    [State.PRE_CLOSED, { order: 6, active: false, icon: "uubml-state-s00-final" }],
    [State.CLOSED, { order: 7, active: false, icon: "uubml-state-s00-final" }],
  ]);

  static #stateList;

  static list() {
    if (!this.#stateList) {
      this.#stateList = Array.from(this.#stateMap.keys());
    }

    return this.#stateList;
  }

  static compare(a, b) {
    return this.#stateMap.get(a)?.order - this.#stateMap.get(b)?.order;
  }

  static getIcon(state) {
    return this.#stateMap.get(state)?.icon;
  }
}
