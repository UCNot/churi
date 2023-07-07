import type { UcvNumericRange } from '../../compiler/validation/ucv-support-numeric-range.js';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../uc-constraints.js';
import { UcBigInt } from './uc-bigint.js';
import { UcNumber } from './uc-number.js';

export function ucItsMin(
  min: UcNumber,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema>;
export function ucItsMin(min: UcBigInt, message?: string): UcConstraints<UcBigInt, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucItsMin(
  min: UcNumber | UcBigInt,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return ucValidateNumericRange(['ItsMin', min, message]);
}

export function ucItIsGreaterThan(
  min: UcNumber,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema>;
export function ucItIsGreaterThan(
  min: UcBigInt,
  message?: string,
): UcConstraints<UcBigInt, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucItIsGreaterThan(
  min: UcNumber | UcBigInt,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return ucValidateNumericRange(['ItIsGreaterThan', min, message]);
}

export function ucItsMax(
  max: UcNumber,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema>;
export function ucItsMax(max: UcBigInt, message?: string): UcConstraints<UcBigInt, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucItsMax(
  max: UcNumber | UcBigInt,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return ucValidateNumericRange(['ItsMax', max, message]);
}

export function ucItIsLessThan(
  max: UcNumber,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema>;
export function ucItIsLessThan(
  max: UcBigInt,
  message?: string,
): UcConstraints<UcBigInt, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucItIsLessThan(
  max: UcNumber | UcBigInt,
  message?: string,
): UcConstraints<UcNumber, UcNumber.Schema> & UcConstraints<UcBigInt, UcBigInt.Schema> {
  return ucValidateNumericRange(['ItIsLessThan', max, message]);
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
