import type { UcvNumericRange } from '../../compiler/validation/ucv-support-numeric-range.js';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../uc-constraints.js';
import { UcBigInt } from './uc-bigint.js';
import { UcNumber } from './uc-number.js';

export function ucMin(
  min: UcNumber,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema>;
export function ucMin(min: UcBigInt, message?: string): UcConstraints<UcBigInt, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMin(
  min: UcNumber | UcBigInt,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return ucValidateNumericRange(['>=', min, message]);
}

export function ucGreaterThan(
  min: UcNumber,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema>;
export function ucGreaterThan(
  min: UcBigInt,
  message?: string,
): UcConstraints<UcBigInt, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucGreaterThan(
  min: UcNumber | UcBigInt,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return ucValidateNumericRange(['>', min, message]);
}

export function ucMax(
  max: UcNumber,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema>;
export function ucMax(max: UcBigInt, message?: string): UcConstraints<UcBigInt, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMax(
  max: UcNumber | UcBigInt,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return ucValidateNumericRange(['<=', max, message]);
}

export function ucLessThan(
  max: UcNumber,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema>;
export function ucLessThan(
  max: UcBigInt,
  message?: string,
): UcConstraints<UcBigInt, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucLessThan(
  max: UcNumber | UcBigInt,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return ucValidateNumericRange(['<', max, message]);
}

function ucValidateNumericRange(
  options: UcvNumericRange,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return {
    validator: {
      use: 'ucvSupportNumericRange',
      from: COMPILER_MODULE,
      with: options,
    },
  };
}
