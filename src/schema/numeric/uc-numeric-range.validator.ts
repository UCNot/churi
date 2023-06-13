import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../uc-schema.js';
import { UcBigInt } from './uc-bigint.js';
import { UcNumber } from './uc-number.js';

export type UcvNumericRange = [
  op: '<=' | '<' | '>=' | '>',
  than: number | bigint,
  or?: string | undefined,
];

export function ucMin(
  min: number,
  message?: string,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema>;
export function ucMin(min: bigint, message?: string): UcSchema.Extension<bigint, UcBigInt.Schema>;

export function ucMin(
  min: number | bigint,
  message?: string,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['>=', min, message]);
}

export function ucGreaterThan(
  min: number,
  message?: string,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema>;
export function ucGreaterThan(
  min: bigint,
  message?: string,
): UcSchema.Extension<bigint, UcBigInt.Schema>;

export function ucGreaterThan(
  min: number | bigint,
  message?: string,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['>', min, message]);
}

export function ucMax(
  max: number,
  message?: string,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema>;
export function ucMax(max: bigint, message?: string): UcSchema.Extension<bigint, UcBigInt.Schema>;

export function ucMax(
  max: number | bigint,
  message?: string,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['<=', max, message]);
}

export function ucLessThan(
  max: number,
  message?: string,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema>;
export function ucLessThan(
  max: bigint,
  message?: string,
): UcSchema.Extension<bigint, UcBigInt.Schema>;

export function ucLessThan(
  max: number | bigint,
  message?: string,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema> {
  return ucNumericRangeValidator(['<', max, message]);
}

function ucNumericRangeValidator(
  options: UcvNumericRange,
): UcSchema.Extension<number, UcNumber.Schema> & UcSchema.Extension<bigint, UcBigInt.Schema> {
  return {
    with: {
      validator: {
        use: {
          from: COMPILER_MODULE,
          feature: 'ucvSupportNumericRange',
          options,
        },
      },
    },
  };
}
