import { UcInputLexer } from '../syntax/uc-input-lexer.js';
import { UcToken } from '../syntax/uc-token.js';
import { Ucrx } from './ucrx.js';

/**
 * Charge receiver that always accepts all values.
 */
export interface AllUcrx extends Ucrx {
  att(attr: string): AllUcrx | undefined;
  bol(value: boolean): 1;
  big(value: bigint): 1;
  emb(emit: (token: UcToken) => void): UcInputLexer;
  ent(name: string): 1;
  fmt(format: string, data: readonly UcToken[]): 1;
  nls(): AllUcrx;
  nul(): 1;
  num(value: number): 1;
  raw(value: string): 1;
  str(value: string): 1;
  for(key: PropertyKey): AllUcrx;
  map(): 1;
  and(): 1;
  end(): void;
}
