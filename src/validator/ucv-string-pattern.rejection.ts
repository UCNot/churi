import { UcrxRejection } from '../rx/ucrx-rejection.js';

export function ucvRejectPatternMismatch(
  pattern: RegExp,
  message = `String matching ${pattern} pattern expected`,
): UcrxRejection {
  return {
    code: 'patternMismatch',
    details: {
      pattern: pattern.source,
      flags: pattern.flags,
    },
    message,
  };
}
