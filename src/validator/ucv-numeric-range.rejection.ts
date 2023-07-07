import { UcRejection } from '../schema/uc-error.js';

export function ucvRejectNotGE(
  min: number | bigint,
  message = `At least ${min} expected`,
): UcRejection {
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
): UcRejection {
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
): UcRejection {
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
): UcRejection {
  return {
    code: 'tooBig',
    details: {
      max,
      inclusive: false,
    },
    message,
  };
}
