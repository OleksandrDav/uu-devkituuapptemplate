class State {
  static get PENDING_NO_DATA() {
    return "pendingNoData";
  }
  static get READY_NO_DATA() {
    return "readyNoData";
  }
  static get ERROR_NO_DATA() {
    return "errorNoData";
  }
  static get PENDING() {
    return "pending";
  }
  static get READY() {
    return "ready";
  }
  static get ERROR() {
    return "error";
  }
  static list() {
    return [this.PENDING_NO_DATA, this.READY_NO_DATA, this.ERROR_NO_DATA, this.PENDING, this.READY, this.ERROR];
  }
}

export { State };
export default State;
