import type { UcvNumericRange } from '../../compiler/validation/ucv-support-numeric-range.js';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../uc-constraints.js';
import { UcBigInt } from './uc-bigint.js';
import { UcNumber } from './uc-number.js';

export function ucMin(
  min: number,
  message?: string,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema>;
export function ucMin(min: bigint, message?: string): UcConstraints<bigint, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMin(
  min: number | bigint,
  message?: string,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['>=', min, message]);
}

export function ucGreaterThan(
  min: number,
  message?: string,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema>;
export function ucGreaterThan(
  min: bigint,
  message?: string,
): UcConstraints<bigint, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucGreaterThan(
  min: number | bigint,
  message?: string,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['>', min, message]);
}

export function ucMax(
  max: number,
  message?: string,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema>;
export function ucMax(max: bigint, message?: string): UcConstraints<bigint, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMax(
  max: number | bigint,
  message?: string,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['<=', max, message]);
}

export function ucLessThan(
  max: number,
  message?: string,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema>;
export function ucLessThan(max: bigint, message?: string): UcConstraints<bigint, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucLessThan(
  max: number | bigint,
  message?: string,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['<', max, message]);
}

function ucNumericRangeValidator(
  options: UcvNumericRange,
): UcConstraints<number, UcNumber.Schema> & UcConstraints<bigint, UcBigInt.Schema> {
  return {
    validator: {
      use: 'ucvSupportNumericRange',
      from: COMPILER_MODULE,
      with: options,
    },
  };
}
