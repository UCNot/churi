import { encodeURIPart } from 'httongue';
import { UC_KEY_ESCAPED, isEscapedUcString } from '../impl/uc-string-escapes.js';
import { printUcToken } from '../syntax/print-uc-token.js';
import {
  UC_TOKEN_APOSTROPHE,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COMMA,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_EXCLAMATION_MARK,
  UC_TOKEN_OPENING_PARENTHESIS,
  UcToken,
} from '../syntax/uc-token.js';
import { AllUcrx } from './all.ucrx.js';
import { UctxMode$Default } from './uctx-mode.impl.js';
import { UctxMode } from './uctx-mode.js';
import { uctxValue } from './uctx-value.js';

export class TokenUcrx implements AllUcrx {

  static charge(value: unknown, mode: UctxMode = UctxMode$Default): UcToken[] {
    const tokens: UcToken[] = [];
    const rx = new this(token => tokens.push(token));

    if (mode.asItem) {
      rx.and();
    }
    uctxValue(rx, value, mode);

    return tokens;
  }

  static print(
    value: unknown,
    mode: UctxMode = UctxMode$Default,
    encodeString: (token: string) => string = encodeURIPart,
  ): string | undefined {
    const chunks: string[] = [];
    const rx = new this(token => chunks.push(printUcToken(token, encodeString)));

    if (mode.asItem) {
      rx.and();
    }
    uctxValue(rx, value, mode);

    return chunks.length ? chunks.join('') : undefined;
  }

  readonly #add: (token: UcToken) => void;
  #mode = TokenUcrx$Single;

  constructor(addToken: (token: UcToken) => void) {
    this.#add = addToken;
  }

  get types(): string[] {
    return ['any'];
  }

  bol(value: boolean): 1 {
    this.#addItem();
    this.#add(value ? UC_TOKEN_EXCLAMATION_MARK : '-');

    return 1;
  }

  big(value: bigint): 1 {
    this.#addItem();
    this.#add(value < 0n ? `-0n${-value}` : `0n${value}`);

    return 1;
  }

  ent(value: readonly UcToken[]): 1 {
    this.#addItem();
    value.forEach(this.#add);

    return 1;
  }

  nls(): this {
    this.#mode = this.#mode.nls(this.#add);

    return this;
  }

  nul(): 1 {
    this.#addItem();
    this.#add('--');

    return 1;
  }

  num(value: number): 1 {
    this.#addItem();
    if (Number.isFinite(value)) {
      this.#add(value.toString());
    } else {
      this.#add(UC_TOKEN_EXCLAMATION_MARK);
      if (Number.isNaN(value)) {
        this.#add('NaN');
      } else {
        this.#add(value > 0 ? 'Infinity' : '-Infinity');
      }
    }

    return 1;
  }

  raw(value: string): 1 {
    if (value) {
      this.#addItem();
      this.#add(value);
    } else {
      this.#mode = this.#mode.empty(this.#add);
    }

    return 1;
  }

  str(value: string): 1 {
    if (value) {
      this.#addItem();

      if (isEscapedUcString(value)) {
        this.#add(UC_TOKEN_APOSTROPHE);
      }

      this.#add(value);
    } else {
      this.#mode = this.#mode.empty(this.#add);
    }

    return 1;
  }

  for(key: PropertyKey): AllUcrx {
    this.#mode = this.#mode.entry(this.#add);

    const keyString = key.toString();

    if (!keyString) {
      this.#add(UC_TOKEN_DOLLAR_SIGN);
    } else {
      if (UC_KEY_ESCAPED.prefixes(keyString)) {
        this.#add(UC_TOKEN_DOLLAR_SIGN);
      }
      this.#add(keyString);
    }

    this.#add(UC_TOKEN_OPENING_PARENTHESIS);

    return new (this.constructor as typeof TokenUcrx)(this.#add);
  }

  map(): 1 {
    this.#mode = this.#mode.endMap(this.#add);

    return 1;
  }

  and(): 1 {
    this.#mode = this.#mode.and(this.#add);

    return 1;
  }

  end(): void {
    this.#mode = this.#mode.end(this.#add);
  }

  #addItem(): void {
    this.#mode = this.#mode.add(this.#add);
  }

}

interface TokenUcrx$Mode {
  and(addToken: (token: UcToken) => void): TokenUcrx$Mode;
  add(addToken: (token: UcToken) => void): TokenUcrx$Mode;
  empty(addToken: (token: UcToken) => void): TokenUcrx$Mode;
  nls(addToken: (token: UcToken) => void): TokenUcrx$Mode;
  entry(addToken: (token: UcToken) => void): TokenUcrx$Mode;
  endMap(addToken: (token: UcToken) => void): TokenUcrx$Mode;
  end(addToken: (token: UcToken) => void): TokenUcrx$Mode;
}

const TokenUcrx$Invalid: TokenUcrx$Mode = {
  and: TokenUcrx$error,
  add: TokenUcrx$error,
  empty: TokenUcrx$error,
  nls: TokenUcrx$error,
  entry: TokenUcrx$error,
  endMap: TokenUcrx$error,
  end: TokenUcrx$error,
};

const TokenUcrx$Single: TokenUcrx$Mode = {
  and(_addToken) {
    return TokenUcrx$startList(this, false);
  },
  add(_addToken): TokenUcrx$Mode {
    return TokenUcrx$Invalid;
  },
  empty(addToken): TokenUcrx$Mode {
    addToken('');

    return TokenUcrx$Invalid;
  },
  nls: TokenUcrx$error,
  entry(_addToken) {
    return TokenUcrx$startMap(this);
  },
  endMap(addToken) {
    addToken(UC_TOKEN_DOLLAR_SIGN);

    return TokenUcrx$Invalid;
  },
  end: TokenUcrx$end,
};

function TokenUcrx$startList(prev: TokenUcrx$Mode, nested: boolean): TokenUcrx$Mode {
  let itemCount = 0;
  let lastEmpty = false;
  let lastNls = false;

  const add = (addToken: (token: UcToken) => void, empty: boolean, nls: boolean): void => {
    if (itemCount) {
      if (lastEmpty && itemCount === 1) {
        addToken(UC_TOKEN_COMMA);
      }
      if (!nls || !lastNls) {
        // Add commas between items, unless items are nested lists.
        addToken(UC_TOKEN_COMMA);
      }
    }

    ++itemCount;
    lastEmpty = empty;
    lastNls = nls;
  };

  return {
    and(_addToken) {
      return this;
    },
    add(addToken): TokenUcrx$Mode {
      add(addToken, false, false);

      return this;
    },
    empty(addToken): TokenUcrx$Mode {
      add(addToken, true, false);

      return this;
    },
    nls(addToken) {
      add(addToken, false, true);
      addToken(UC_TOKEN_OPENING_PARENTHESIS);

      return TokenUcrx$startList(this, true);
    },
    entry(addToken) {
      add(addToken, false, false);

      return TokenUcrx$startMap(this);
    },
    endMap(addToken) {
      addToken(UC_TOKEN_DOLLAR_SIGN);

      return this;
    },
    end(addToken) {
      if (lastEmpty) {
        if (nested) {
          addToken(UC_TOKEN_APOSTROPHE);
          addToken(UC_TOKEN_CLOSING_PARENTHESIS);
        } else {
          addToken(UC_TOKEN_COMMA);
          if (itemCount < 2) {
            addToken(UC_TOKEN_COMMA);
          }
        }
      } else if (nested) {
        addToken(UC_TOKEN_CLOSING_PARENTHESIS);
      } else if (itemCount < 2 && !lastNls) {
        // Empty list.
        addToken(UC_TOKEN_COMMA);
      }

      return prev;
    },
  };
}

function TokenUcrx$startMap(prev: TokenUcrx$Mode): TokenUcrx$Mode {
  return {
    and: TokenUcrx$error,
    add: TokenUcrx$error,
    empty: TokenUcrx$error,
    nls: TokenUcrx$error,
    entry(addToken) {
      addToken(UC_TOKEN_CLOSING_PARENTHESIS);

      return this;
    },
    endMap(addToken) {
      addToken(UC_TOKEN_CLOSING_PARENTHESIS);

      return prev;
    },
    end: TokenUcrx$end,
  };
}

function TokenUcrx$error(): never {
  throw new TypeError('Invalid charge');
}

function TokenUcrx$end(_addToken: (token: UcToken) => void): TokenUcrx$Mode {
  return TokenUcrx$Invalid;
}
