import { UcRejection } from '../schema/uc-error.js';

export function ucvRejectTooShort(
  minLength: number,
  message = `At least ${minLength} characters expected`,
): UcRejection {
  return {
    code: 'tooShort',
    details: {
      minLength,
    },
    message,
  };
}

export function ucvRejectTooLong(
  maxLength: number,
  message = `At most ${maxLength} characters expected`,
): UcRejection {
  return {
    code: 'tooLong',
    details: {
      maxLength,
    },
    message,
  };
}
