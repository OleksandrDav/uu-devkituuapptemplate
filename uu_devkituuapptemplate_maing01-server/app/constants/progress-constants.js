"use strict";

//@@viewOn:constants
const ProgressConstants = {
  PROGRESS_DELETE_DOES_NOT_EXIST: "uu-console-main/progress/delete/progressDoesNotExist",
  PROGRESS_DOES_NOT_EXIST: "uu-console-main/progress/get/progressDoesNotExist",
  PROGRESS_GET_FAILED: "uu-console-main/progressClient/progressGetFailed",
  PROGRESS_END_NOT_IN_PROPER_STATE: "uu-console-main/progress/end/progressIsNotInProperState",
  PROGRESS_RELEASE_DOES_NOT_EXIST: "uu-console-main/progress/releaseLock/progressDoesNotExist",
  PROGRESS_RELEASE_IS_NOT_LOCKED: "uu-console-main/progress/releaseLock/progressIsNotLocked",
  PROGRESS_HAS_SAME_AUTH_STRATEGY: "uu-console-main/progress/setAuthorizationStrategy/progressHasSameAuthorizationStrategy",

  StateMap: {
    RUNNING: "running",
    RUNNING_WITH_ERROR: "runningWithError",
    CANCELLED: "cancelled",
    COMPLETED_WITH_ERROR: "completedWithError",
    COMPLETED: "completed",
  },
};
//@@viewOff:constants

//@@viewOn:exports
module.exports = ProgressConstants;
//@@viewOff:exports