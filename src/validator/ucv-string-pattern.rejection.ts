import { UcRejection } from '../schema/uc-error.js';

export function ucvRejectPatternMismatch(
  pattern: RegExp,
  message = `String matching ${pattern} pattern expected`,
): UcRejection {
  return {
    code: 'patternMismatch',
    details: {
      pattern: pattern.source,
      flags: pattern.flags,
    },
    message,
  };
}
