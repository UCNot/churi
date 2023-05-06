import { UcToken } from '../syntax/uc-token.js';
import { Ucrx } from './ucrx.js';

/**
 * Charge receiver that always accepts all values.
 */
export interface AllUcrx extends Ucrx {
  bol(value: boolean): 1;
  big(value: bigint): 1;
  ent(value: readonly UcToken[]): 1;
  nls(): AllUcrx;
  nul(): 1;
  num(value: number): 1;
  str(value: string): 1;
  for(key: PropertyKey): AllUcrx;
  map(): 1;
  and(): 1;
  end(): void;
}
