const fs = require("node:fs");
const path = require("node:path");
const stdout = require("node:process").stdout;

function _pad2(n) {
  return String(n).padStart(2, "0");
}

function _formatTimestampForFileName(d = new Date()) {
  // YYYYMMDD_HHMMSS (local time)
  return (
    `${d.getFullYear()}${_pad2(d.getMonth() + 1)}${_pad2(d.getDate())}` +
    `_${_pad2(d.getHours())}${_pad2(d.getMinutes())}${_pad2(d.getSeconds())}`
  );
}

function _formatTimestampForLine(d = new Date()) {
  return d.toISOString();
}

function _ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Creates a logger that prints to console AND appends the same line into a file under /logs.
 * It also supports step numbering: 1, 1.1, 1.2, 2, 2.1, ...
 *
 * @param {object} opts
 * @param {string} opts.name - used in log filename
 * @returns {{ step: Function, subStep: Function, info: Function, warn: Function, error: Function, flush: Function, logFilePath: string }}
 */
function createStepLogger({ name }) {
  // Store logs under utils-stub/logs (requested).
  const logsDir = path.resolve(__dirname, "logs");
  _ensureDirSync(logsDir);

  const logFilePath = path.join(logsDir, `${name}_${_formatTimestampForFileName()}.log`);

  let stepNo = 0;
  let subNo = 0;

  // Keep file writes ordered without blocking console output.
  let fileWriteQueue = Promise.resolve();

  function _enqueueFileWrite(line) {
    fileWriteQueue = fileWriteQueue
      .then(() => fs.promises.appendFile(logFilePath, `${line}\n`, { encoding: "utf8" }))
      .catch((e) => {
        // Last resort: at least show that file logging failed.
        try {
          console.error(`[LOGGER] Failed to append to log file ${logFilePath}: ${e?.message || e}`);
        } catch (_) {
          // ignore
        }
      });
  }

  function _write(level, stepLabel, message, { toConsole = true, toFile = true } = {}) {
    const line = `${_formatTimestampForLine()} [${level}] ${stepLabel} ${message}`;

    if (toConsole) {
      if (level === "ERROR") console.error(line);
      else if (level === "WARN") console.warn(line);
      else console.log(line);
    }

    // File write happens async "in parallel" to console printing.
    if (toFile) _enqueueFileWrite(line);
  }

  function _currentStepLabel() {
    if (stepNo === 0) return "0.0";
    if (subNo === 0) return `${stepNo}.`;
    return `${stepNo}.${subNo}`;
  }

  function step(message) {
    stepNo += 1;
    subNo = 0;
    _write("INFO", `${stepNo}.`, message);
  }

  function subStep(message) {
    if (stepNo === 0) {
      // Ensure numbering always exists even if someone calls subStep first.
      stepNo = 1;
      subNo = 0;
    }
    subNo += 1;
    _write("INFO", `${stepNo}.${subNo}`, message);
  }

  function subStepFileOnly(message) {
    if (stepNo === 0) {
      // Ensure numbering always exists even if someone calls subStepFileOnly first.
      stepNo = 1;
      subNo = 0;
    }
    subNo += 1;
    _write("INFO", `${stepNo}.${subNo}`, message, { toConsole: false });
  }

  /**
   * Writes a single-line progress indicator to the terminal (no file logging).
   * If the output is a TTY, the line is updated in-place (no newline).
   */
  function progress(message) {
    const line = `${_currentStepLabel()} ${message}`;
    if (process.stdout && process.stdout.isTTY) {
      process.stdout.write(`\r${line}`);
    } else {
      // Non-TTY (piped output) - fall back to regular console output.
      _write("INFO", _currentStepLabel(), message, { toConsole: true, toFile: false });
    }
  }

  /**
   * Ends the progress indicator (prints newline in TTY). Optionally prints a final message.
   */
  function progressEnd(message) {
    if (!message) {
      if (process.stdout && process.stdout.isTTY) process.stdout.write("\n");
      return;
    }
    const line = `${_currentStepLabel()} ${message}`;
    if (process.stdout && process.stdout.isTTY) {
      process.stdout.write(`\r${line}\n`);
    } else {
      _write("INFO", _currentStepLabel(), message, { toConsole: true, toFile: false });
    }
  }

  function info(message) {
    subStep(message);
  }

  function warn(message) {
    if (stepNo === 0) stepNo = 1;
    subNo += 1;
    _write("WARN", `${stepNo}.${subNo}`, message);
  }

  function error(message, err) {
    if (stepNo === 0) stepNo = 1;
    subNo += 1;
    const errText =
      err && (err.stack || err.message) ? ` | ${err.stack || err.message}` : err ? ` | ${String(err)}` : "";
    _write("ERROR", `${stepNo}.${subNo}`, `${message}${errText}`);
  }

  function flush() {
    return fileWriteQueue;
  }

  function spinnerStart() {
    const characters = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const cursorEsc = {
      hide: "\u001B[?25l",
      show: "\u001B[?25h",
    };
    stdout.write(cursorEsc.hide);

    let i = 0;
    const timer = setInterval(() => {
      console.log(i);
      stdout.write("\r" + characters[i++]);
      i = i >= characters.length ? 0 : i;
    }, 150);

    return () => {
      clearInterval(timer);
      stdout.write("\r");
      stdout.write(cursorEsc.show);
    };
  }

  /**
   * Starts a spinner in terminal (TTY only). Returns a handle which must be stopped.
   * The spinner is terminal-only (no file logging).
   */
  //   function spinnerStart(message, { intervalMs = 150 } = {}) {
  //     if (!process.stdout || !process.stdout.isTTY) {
  //       // Non-interactive output: just print once.
  //       _write("INFO", _currentStepLabel(), message, { toConsole: true, toFile: false });
  //       return {
  //         isTTY: false,
  //         update: () => {},
  //         stop: (finalMessage) => {
  //           if (finalMessage) _write("INFO", _currentStepLabel(), finalMessage, { toConsole: true, toFile: false });
  //         },
  //       };
  //     }

  //     const characters = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  //     const cursorEsc = {
  //       hide: "\u001B[?25l",
  //       show: "\u001B[?25h",
  //     };

  //     process.stdout.write(cursorEsc.hide);

  //     let idx = 0;
  //     let currentMessage = message || "";
  //     let stopped = false;

  //     const writeFrame = () => {
  //       if (stopped) return;
  //       const stepLabel = _currentStepLabel();
  //       const frame = characters[idx];
  //       idx = (idx + 1) % characters.length;
  //       process.stdout.write(`\r${stepLabel} ${frame} ${currentMessage}`);
  //     };

  //     // Render first frame immediately and then keep going.
  //     writeFrame();
  //     const timer = setInterval(writeFrame, intervalMs);
  //     if (typeof timer.unref === "function") timer.unref();

  //     return {
  //       isTTY: true,
  //       update: (nextMessage) => {
  //         currentMessage = nextMessage ?? currentMessage;
  //       },
  //       stop: (finalMessage) => {
  //         stopped = true;
  //         clearInterval(timer);
  //         const stepLabel = _currentStepLabel();
  //         const msg = finalMessage || currentMessage;
  //         process.stdout.write(`\r${stepLabel} ✓ ${msg}\n`);
  //         process.stdout.write(cursorEsc.show);
  //       },
  //     };
  //   }

  return {
    step,
    subStep,
    subStepFileOnly,
    progress,
    progressEnd,
    spinnerStart,
    info,
    warn,
    error,
    flush,
    logFilePath,
  };
}

module.exports = { createStepLogger };
