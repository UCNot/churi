export type UcvNumericRange = [
  op: '<=' | '<' | '>=' | '>',
  than: number | bigint,
  or?: string | undefined,
];
