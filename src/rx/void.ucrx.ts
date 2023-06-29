import {
  ucrxDecodeNumeric,
  ucrxDecodePositive,
  ucrxDecodeRaw,
  ucrxDecodeString,
} from '../impl/ucrx-decode-raw.js';
import { UcEntity } from '../schema/entity/uc-entity.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcrxContext } from './ucrx-context.js';
import { ucrxRejectEntity, ucrxRejectNull, ucrxRejectType } from './ucrx-rejection.js';
import { Ucrx } from './ucrx.js';

export class VoidUcrx implements Ucrx {

  readonly #set: (value: unknown) => void;

  constructor(set: (value: unknown) => void) {
    this.#set = set;
  }

  get types(): readonly string[] {
    return ['void'];
  }

  bol(value: boolean, cx: UcrxContext): 0 | 1 {
    return this.any(value) || cx.reject(ucrxRejectType('boolean', this));
  }

  big(value: bigint, cx: UcrxContext): 0 | 1 {
    return this.any(value) || cx.reject(ucrxRejectType('bigint', this));
  }

  ent(value: readonly UcToken[], cx: UcrxContext): 0 | 1 {
    return this.any(new UcEntity(value)) || cx.reject(ucrxRejectEntity(value));
  }

  att(attr: string, cx: UcrxContext): Ucrx | undefined;
  att(_attr: string, _cx: UcrxContext): undefined {
    // Ignore metadata.
  }

  nls(cx: UcrxContext): Ucrx | undefined {
    cx.reject(ucrxRejectType('nested list', this));

    return;
  }

  num(value: number, cx: UcrxContext): 0 | 1 {
    return this.any(value) || cx.reject(ucrxRejectType('number', this));
  }

  raw(value: string, cx: UcrxContext): 0 | 1 {
    return ucrxDecodeRaw(cx, this, value, ucrxDecodeString, ucrxDecodePositive, ucrxDecodeNumeric);
  }

  str(value: string, cx: UcrxContext): 0 | 1 {
    return this.any(value) || cx.reject(ucrxRejectType('string', this));
  }

  for(_key: PropertyKey, cx: UcrxContext): Ucrx | 0 | undefined {
    return cx.reject(ucrxRejectType('map', this));
  }

  map(cx: UcrxContext): 0 | 1 {
    return cx.reject(ucrxRejectType('map', this));
  }

  and(cx: UcrxContext): 0 | 1 {
    return cx.reject(ucrxRejectType('list', this));
  }

  end(cx: UcrxContext): void;
  end(_cx: UcrxContext): void {
    // Not a list.
  }

  nul(cx: UcrxContext): 0 | 1 {
    return this.any(null) || cx.reject(ucrxRejectNull(this));
  }

  protected any(_value: unknown): 0 | 1 {
    return 0;
  }

  protected set(value: unknown): 1 {
    this.#set(value);

    return 1;
  }

}
