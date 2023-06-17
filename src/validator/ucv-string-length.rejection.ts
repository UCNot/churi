import { UcrxRejection } from '../rx/ucrx-rejection.js';

export function ucvRejectTooShort(
  minLength: number,
  message = `At least ${minLength} characters expected`,
): UcrxRejection {
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
): UcrxRejection {
  return {
    code: 'tooLong',
    details: {
      maxLength,
    },
    message,
  };
}
