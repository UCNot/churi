export interface Ucrx {
  get types(): readonly string[];

  bol(value: boolean): 0 | 1;
  big(value: bigint): 0 | 1;
  nls(): Ucrx | undefined;
  num(value: number): 0 | 1;
  str(value: string): 0 | 1;

  for(key: PropertyKey): Ucrx | undefined;
  map(): void;

  em(): 0 | 1;
  ls(): void;

  any(value: bigint | boolean | number | string | symbol | object): 0 | 1;
  nul(): 0 | 1;
}
