import { UcViolation } from '../schema/uc-error.js';

export function ucvViolateItHasMinChars(
  minChars: number,
  message = `At least ${minChars} characters expected`,
): UcViolation {
  return {
    code: 'violation',
    details: {
      constraint: 'ItHasMinChars',
      minChars,
    },
    message,
  };
}

export function ucvViolateItHasMaxChars(
  maxChars: number,
  message = `At most ${maxChars} characters expected`,
): UcViolation {
  return {
    code: 'violation',
    details: {
      constraint: 'ItHasMaxChars',
      maxChars,
    },
    message,
  };
}
