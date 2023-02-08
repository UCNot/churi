export interface UcdRx {
  _: UcdValueRx;

  lst?(): 1;
  end?(): void;
}

export interface UcdValueRx {
  bol?(value: boolean): 1;
  big?(value: bigint): 1;
  nul?(): 1;
  num?(value: number): 1;
  str?(value: string): 1;

  for?(key: PropertyKey): UcdRx | undefined;
}
