import { UcViolation } from '../schema/uc-error.js';

export function ucvViolateItMatches(
  pattern: RegExp,
  message = `String matching ${pattern} pattern expected`,
): UcViolation {
  return {
    code: 'violation',
    details: {
      constraint: 'ItMatches',
      pattern: pattern.source,
      flags: pattern.flags,
    },
    message,
  };
}
