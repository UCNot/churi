import { UcrxRejection } from '../rx/ucrx-rejection.js';

export function ucvRejectMin(
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

export function ucvRejectGreaterThan(
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

export function ucvRejectMax(
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

export function ucvRejectLessThan(
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
