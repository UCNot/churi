export interface UcvNumericRange {
  readonly type: 'min' | 'greaterThan' | 'max' | 'lessThan';
  readonly bound: number | bigint;
  readonly message: string | undefined;
}
