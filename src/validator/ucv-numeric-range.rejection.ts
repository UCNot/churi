import { UcrxRejection } from '../rx/ucrx-rejection.js';

export function ucvRejectNotGE(
  min: number | bigint,
  message = `At least ${min} expected`,
): UcrxRejection {
  return {
    code: 'tooSmall',
    details: {
      min,
      inclusive: true,
    },
    message,
  };
}

export function ucvRejectNotGT(
  min: number | bigint,
  message = `Greater than ${min} expected`,
): UcrxRejection {
  return {
    code: 'tooSmall',
    details: {
      min,
      inclusive: false,
    },
    message,
  };
}

export function ucvRejectNotLE(
  max: number | bigint,
  message = `At most ${max} expected`,
): UcrxRejection {
  return {
    code: 'tooBig',
    details: {
      max,
      inclusive: true,
    },
    message,
  };
}

export function ucvRejectNotLT(
  max: number | bigint,
  message = `Less than ${max} expected`,
): UcrxRejection {
  return {
    code: 'tooBig',
    details: {
      max,
      inclusive: false,
    },
    message,
  };
}
