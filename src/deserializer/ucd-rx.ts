export interface UcdRx {
  bol?(value: boolean): UcdRx;
  big?(value: bigint): UcdRx;
  nul?(): UcdRx;
  num?(value: number): UcdRx;
  str?(value: string): UcdRx;

  lst?(): UcdRx | undefined;
  for?(key: PropertyKey): UcdRx | undefined;

  end?(): void;
}
