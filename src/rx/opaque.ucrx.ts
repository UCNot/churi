import { ucOpaqueLexer } from '../syntax/lexers/uc-opaque.lexer.js';
import { UcInputLexer } from '../syntax/uc-input-lexer.js';
import { UcToken } from '../syntax/uc-token.js';
import { AllUcrx } from './all.ucrx.js';
import { VoidUcrx } from './void.ucrx.js';

export class OpaqueUcrx extends VoidUcrx implements AllUcrx {

  constructor() {
    super(OpaqueUcrx$set);
  }

  override get types(): readonly string[] {
    return ['any'];
  }

  override att(attr: string): AllUcrx | undefined;
  override att(_attr: string): undefined {
    // Ignore metadata.
  }

  override ins(emit: (token: UcToken) => void): UcInputLexer;
  override ins(_emit: (token: UcToken) => void): UcInputLexer {
    return ucOpaqueLexer;
  }

  override nls(): this {
    return this;
  }

  override raw(value: string): 1;
  override raw(_value: string): 1 {
    return 1;
  }

  override for(key: PropertyKey): this;
  override for(_key: PropertyKey): this {
    return this;
  }

  override map(): 1 {
    return 1;
  }

  override and(): 1 {
    return 1;
  }

  override any(value: unknown): 1;
  override any(_value: unknown): 1 {
    return 1;
  }

}

export interface OpaqueUcrx extends AllUcrx {
  bol(value: boolean): 1;
  big(value: bigint): 1;
  ent(name: string): 1;
  fmt(format: string, data: readonly UcToken[]): 1;
  nul(): 1;
  num(value: number): 1;
  str(value: string): 1;
  end(): void;
}

function OpaqueUcrx$set(_value: unknown): void {
  // Ignore assigned value
}
