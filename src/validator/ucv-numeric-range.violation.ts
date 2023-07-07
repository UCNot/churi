import { UcViolation } from '../schema/uc-error.js';

export function ucvViolateItsMin(
  min: number | bigint,
  message = `At least ${min} expected`,
): UcViolation {
  return {
    code: 'violation',
    details: {
      constraint: 'ItsMin',
      min,
      inclusive: true,
    },
    message,
  };
}

export function ucvViolateItIsGreaterThan(
  min: number | bigint,
  message = `Greater than ${min} expected`,
): UcViolation {
  return {
    code: 'violation',
    details: {
      constraint: 'ItIsGreaterThan',
      min,
      inclusive: false,
    },
    message,
  };
}

export function ucvViolateItsMax(
  max: number | bigint,
  message = `At most ${max} expected`,
): UcViolation {
  return {
    code: 'violation',
    details: {
      constraint: 'ItsMax',
      max,
      inclusive: true,
    },
    message,
  };
}

export function ucvViolateItIsLessThan(
  max: number | bigint,
  message = `Less than ${max} expected`,
): UcViolation {
  return {
    code: 'violation',
    details: {
      constraint: 'ItIsLessThan',
      max,
      inclusive: false,
    },
    message,
  };
}
