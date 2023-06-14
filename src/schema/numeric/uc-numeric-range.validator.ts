import type { UcvNumericRange } from '../../compiler/validation/ucv-support-numeric-range.js';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcInstructions } from '../uc-instructions.js';
import { UcBigInt } from './uc-bigint.js';
import { UcNumber } from './uc-number.js';

export function ucMin(
  min: number,
  message?: string,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema>;
export function ucMin(min: bigint, message?: string): UcInstructions<bigint, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMin(
  min: number | bigint,
  message?: string,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['>=', min, message]);
}

export function ucGreaterThan(
  min: number,
  message?: string,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema>;
export function ucGreaterThan(
  min: bigint,
  message?: string,
): UcInstructions<bigint, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucGreaterThan(
  min: number | bigint,
  message?: string,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['>', min, message]);
}

export function ucMax(
  max: number,
  message?: string,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema>;
export function ucMax(max: bigint, message?: string): UcInstructions<bigint, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMax(
  max: number | bigint,
  message?: string,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['<=', max, message]);
}

export function ucLessThan(
  max: number,
  message?: string,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema>;
export function ucLessThan(max: bigint, message?: string): UcInstructions<bigint, UcBigInt.Schema>;

/*#__NO_SIDE_EFFECTS__*/
export function ucLessThan(
  max: number | bigint,
  message?: string,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['<', max, message]);
}

function ucNumericRangeValidator(
  options: UcvNumericRange,
): UcInstructions<number, UcNumber.Schema> & UcInstructions<bigint, UcBigInt.Schema> {
  return {
    validator: {
      use: {
        from: COMPILER_MODULE,
        feature: 'ucvSupportNumericRange',
        options,
      },
    },
  };
}
