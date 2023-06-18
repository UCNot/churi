import { asis } from '@proc7ts/primitives';
import { negate } from '../impl/numeric.js';
import { UcEntity } from '../schema/entity/uc-entity.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcrxReject, ucrxRejectEntity, ucrxRejectNull, ucrxRejectType } from './ucrx-rejection.js';
import { Ucrx } from './ucrx.js';

export class VoidUcrx implements Ucrx {

  readonly #set: (value: unknown) => void;

  constructor(set: (value: unknown) => void) {
    this.#set = set;
  }

  get types(): readonly string[] {
    return ['void'];
  }

  bol(value: boolean, reject: UcrxReject): 0 | 1 {
    return this.any(value) || reject(ucrxRejectType('boolean', this));
  }

  big(value: bigint, reject: UcrxReject): 0 | 1 {
    return this.any(value) || reject(ucrxRejectType('bigint', this));
  }

  ent(value: readonly UcToken[], reject: UcrxReject): 0 | 1 {
    return this.any(new UcEntity(value)) || reject(ucrxRejectEntity(value));
  }

  nls(reject: UcrxReject): Ucrx | undefined {
    reject(ucrxRejectType('nested list', this));

    return;
  }

  num(value: number, reject: UcrxReject): 0 | 1 {
    return this.any(value) || reject(ucrxRejectType('number', this));
  }

  raw(value: string, reject: UcrxReject): 0 | 1 {
    if (!value) {
      return this.str('', reject);
    }

    const decoder = UCD_VALUE_DECODERS[value[0]];

    return decoder ? decoder(this, value, reject) : this.str(value, reject);
  }

  str(value: string, reject: UcrxReject): 0 | 1 {
    return this.any(value) || reject(ucrxRejectType('string', this));
  }

  for(_key: PropertyKey, reject: UcrxReject): Ucrx | 0 | undefined {
    return reject(ucrxRejectType('map', this));
  }

  map(reject: UcrxReject): 0 | 1 {
    return reject(ucrxRejectType('map', this));
  }

  and(reject: UcrxReject): 0 | 1 {
    return reject(ucrxRejectType('list', this));
  }

  end(reject: UcrxReject): void;
  end(_reject: UcrxReject): void {
    // Not a list.
  }

  nul(reject: UcrxReject): 0 | 1 {
    return this.any(null) || reject(ucrxRejectNull(this));
  }

  protected any(_value: unknown): 0 | 1 {
    return 0;
  }

  protected set(value: unknown): 1 {
    this.#set(value);

    return 1;
  }

}

type UcrxRawValueDecoder = (rx: Ucrx, input: string, reject: UcrxReject) => 0 | 1;

const UCD_VALUE_DECODERS: {
  readonly [prefix: string]: UcrxRawValueDecoder;
} = {
  '-': ucrxDecodeMinusSigned,
  0: ucrxDecodeUnsigned,
  1: ucrxDecodeNumber,
  2: ucrxDecodeNumber,
  3: ucrxDecodeNumber,
  4: ucrxDecodeNumber,
  5: ucrxDecodeNumber,
  6: ucrxDecodeNumber,
  7: ucrxDecodeNumber,
  8: ucrxDecodeNumber,
  9: ucrxDecodeNumber,
};

function ucrxDecodeMinusSigned(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  if (input.length < 3) {
    if (input.length < 2) {
      return rx.bol(false, reject);
    }
    if (input === '--') {
      return rx.nul(reject);
    }
  }

  const secondChar = input[1];

  if (secondChar >= '0' && secondChar <= '9') {
    return ucrxDecodeNumeric(rx, input, reject, 1, negate);
  }

  return rx.str(input, reject);
}

function ucrxDecodeNumber(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  return rx.num(Number(input), reject);
}

function ucrxDecodeUnsigned(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  return ucrxDecodeNumeric(rx, input, reject, 0, asis);
}

function ucrxDecodeNumeric(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  if (input[offset + 1] === 'n') {
    let value: bigint;

    try {
      value = input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2));
    } catch (cause) {
      return reject({
        code: 'invalidSyntax',
        details: { type: 'bigint' },
        message: (cause as Error).message,
        cause,
      });
    }

    return rx.big(sign(value), reject);
  }

  const value = input.length < offset + 3 ? 0 : Number(input.slice(offset));

  if (Number.isFinite(value)) {
    return rx.num(sign(value), reject);
  }

  return reject({
    code: 'invalidSyntax',
    details: { type: 'number' },
    message: 'Not a number',
  });
}
