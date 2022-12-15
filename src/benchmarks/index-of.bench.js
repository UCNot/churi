import { randomBytes } from 'node:crypto';

const CHARS = ['(', ')', ','];
const PATTERN = new RegExp(`[${CHARS.join('')}]`);

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByRegEx(input) {
  return input.search(PATTERN);
}

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByChar(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    const char = input[i];

    if (char === '(' || char === ')' || char === ',') {
      return i;
    }
  }

  return -1;
}

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCharSwitch(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    switch (input[i]) {
      case '(':
      case ')':
      case ',':
        return i;
    }
  }

  return -1;
}

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCode(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    const code = input.charCodeAt(i);

    if (code === 0x28 || code === 0x29 || code === 0x2c) {
      return i;
    }
  }

  return -1;
}

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCodeSwitch(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    switch (input.charCodeAt(i)) {
      case 0x28:
      case 0x29:
      case 0x2c:
        return i;
    }
  }

  return -1;
}

const CHAR_MAP = Object.fromEntries(CHARS.map(char => [char, 1]));

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCharMap(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    if (CHAR_MAP[input[i]]) {
      return i;
    }
  }

  return -1;
}

const CODE_MAP = Object.fromEntries(CHARS.map(char => [char.charCodeAt(0), 1]));

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCodeMap(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    if (CODE_MAP[input.charCodeAt(i)]) {
      return i;
    }
  }

  return -1;
}

const CHAR_SET = new Set(CHARS);

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCharSet(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    if (CHAR_SET.has(input[i])) {
      return i;
    }
  }

  return -1;
}

const CODE_SET = new Set(CHARS.map(char => char.charCodeAt(0)));

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCodeSet(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    if (CODE_SET.has(input.charCodeAt(i))) {
      return i;
    }
  }

  return -1;
}

const CODE_ARRAY = (() => {
  const array = new Array(5);

  array.fill(false);

  CHARS.forEach(char => {
    array[char.charCodeAt(0) - 0x28] = true;
  });

  return array;
})();

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCodeArray(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    const code = input.charCodeAt(i);

    if (code > 0x27 && code < 0x2d && CODE_ARRAY[code - 0x28]) {
      return i;
    }
  }

  return -1;
}

const CODE_MASK = CHARS.reduce((prev, char) => prev | (1 << (char.charCodeAt(0) - 0x28)), 0);

/**
 * @param {string} input
 *
 * @returns {number}
 */
function indexOfByCodeMask(input) {
  for (let i = 0, len = input.length; i < len; ++i) {
    const code = input.charCodeAt(i);

    if (code > 0x27 && code < 0x2d && CODE_MASK & (1 << (code - 0x28))) {
      return i;
    }
  }

  return -1;
}

const STRING_LEN = 22;
const NUM_STRINGS = 4096;

/**
 * @returns {string[]}
 */
function generateStrings() {
  /**
   * @type {string[]}
   */
  const result = new Array(NUM_STRINGS);

  for (let i = 0; i < NUM_STRINGS; ++i) {
    const buffer = randomBytes(STRING_LEN);

    for (let i = 0; i < buffer.length; ++i) {
      buffer.set([(buffer[i] & 0x3f) + 0x30], i);
    }

    const str = buffer.toString('latin1');
    const idx = Math.floor(Math.random() * str.length);
    const searched = CHARS[Math.floor(Math.random() * CHARS.length)];

    result[i] = str.slice(0, idx) + searched + str.slice(idx + 1);
  }

  return result;
}

const NUM_REPEATS = 10000;

/**
 * @param {(input: string) => number} fn
 */
function runBenchmark(fn) {
  /**
   * @type {number[]}
   */
  const durations = new Array(NUM_REPEATS);

  for (let i = 0; i < NUM_REPEATS; ++i) {
    const start = performance.now();

    for (const str of STRINGS) {
      if (fn(str) < 0) {
        throw new Error(`Not found by ${fn.name} in ${str}`);
      }
    }

    durations[1] = performance.now() - start;
  }

  const totalDuration = durations.reduce((prev, duration) => prev + duration, 0);
  const averageDuration = totalDuration / NUM_REPEATS;

  console.debug(fn.name.padEnd(24, ' '), 'avg:', averageDuration);
}

const STRINGS = generateStrings();

runBenchmark(indexOfByRegEx);
runBenchmark(indexOfByChar);
runBenchmark(indexOfByCharSwitch);
runBenchmark(indexOfByCode);
runBenchmark(indexOfByCodeSwitch);
runBenchmark(indexOfByCharMap);
runBenchmark(indexOfByCharSet);
runBenchmark(indexOfByCodeMap);
runBenchmark(indexOfByCodeSet);
runBenchmark(indexOfByCodeArray);
runBenchmark(indexOfByCodeMask);
