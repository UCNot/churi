import { isIterable } from '@proc7ts/primitives';
import { ChURIPrimitive } from './charge/ch-uri-value.js';
import { createURIChargeParser } from './charge/parse-uri-charge.js';
import { URIChargeParser } from './charge/uri-charge-parser.js';
import { URICharge } from './charge/uri-charge.js';
import { decodeSearchParam, encodeSearchParam } from './impl/search-param-codec.js';

export class ChURIParams<out TValue = ChURIPrimitive, out TCharge = URICharge<TValue>>
  implements Iterable<[string, string]> {

  readonly #chargeParser: URIChargeParser<TValue, TCharge>;
  readonly #list: ChSearchParamValue[] = [];
  readonly #map: Map<string, ChSearchParam<TValue, TCharge>>;
  #charge?: TCharge;

  constructor(
    search:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    ...chargeParser: ChURIPrimitive extends TValue
      ? URICharge<TValue> extends TCharge
        ? [URIChargeParser<TValue, TCharge>?]
        : [URIChargeParser<TValue, TCharge>]
      : [URIChargeParser<TValue, TCharge>]
  );

  constructor(
    search:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    chargeParser: URIChargeParser<TValue, TCharge> = createURIChargeParser() as URIChargeParser<
      TValue,
      TCharge
    >,
  ) {
    this.#chargeParser = chargeParser;
    this.#map =
      typeof search === 'string'
        ? this.#parse(search)
        : this.#provide(isIterable(search) ? search : Object.entries(search));
  }

  get chargeParser(): URIChargeParser<TValue, TCharge> {
    return this.#chargeParser;
  }

  #parse(search: string): Map<string, ChSearchParam<TValue, TCharge>> {
    if (search.startsWith('?')) {
      search = search.slice(1);
    }

    const entries = new Map<string, ChSearchParam$Parsed<TValue, TCharge>>();

    if (!search) {
      return entries;
    }

    for (const part of search.split('&')) {
      const [rawKey, rawValue = ''] = part.split('=', 2);
      const key = decodeSearchParam(rawKey);
      const prev = entries.get(key);

      if (prev) {
        this.#list.push(prev.add(rawValue));
      } else {
        const param = new ChSearchParam$Parsed<TValue, TCharge>(key, rawKey, rawValue);

        entries.set(key, param);
        this.#list.push(new ChSearchParamValue(param, 0));
      }
    }

    return entries;
  }

  #provide(
    search: Iterable<readonly [string, (string | null)?]>,
  ): Map<string, ChSearchParam<TValue, TCharge>> {
    const entries = new Map<string, ChSearchParam$Provided<TValue, TCharge>>();

    for (const [key, val] of search) {
      const value = val ? String(val) : '';
      const prev = entries.get(key);

      if (prev) {
        this.#list.push(prev.add(value));
      } else {
        const param = new ChSearchParam$Provided<TValue, TCharge>(key, value);

        entries.set(key, param);
        this.#list.push(new ChSearchParamValue(param, 0));
      }
    }

    return entries;
  }

  get charge(): TCharge {
    return this.#charge !== undefined ? this.#charge : (this.#charge = this.#parseCharge());
  }

  #parseCharge(): TCharge {
    const { chargeParser } = this;

    return chargeParser.chargeRx.rxMap(rx => {
      for (const entry of this.#map.values()) {
        rx.put(entry.key, entry.getCharge(chargeParser));
      }

      return rx.endMap();
    });
  }

  has(name: string): boolean {
    return this.#map.has(name);
  }

  get(name: string): string | null {
    const entry = this.#map.get(name);

    return entry ? entry.values[0] : null;
  }

  getAll(name: string): string[] {
    const entry = this.#map.get(name);

    return entry ? entry.values.slice() : [];
  }

  chargeOf(name: string): TCharge {
    const entry = this.#map.get(name);

    return entry ? entry.getCharge(this.chargeParser) : this.chargeParser.chargeRx.none;
  }

  *keys(): IterableIterator<string> {
    for (const { key } of this.#list) {
      yield key;
    }
  }

  *entries(): IterableIterator<[string, string]> {
    for (const { key, value } of this.#list) {
      yield [key, value];
    }
  }

  *values(): IterableIterator<string> {
    for (const { value } of this.#list) {
      yield value;
    }
  }

  forEach(
    callback: (value: string, key: string, parent: ChURIParams<TValue, TCharge>) => void,
  ): void {
    this.#list.forEach(({ key, value }) => callback(value, key, this));
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toString(): string {
    return this.#list.join('&');
  }

}

class ChSearchParamValue {

  readonly #param: ChSearchParam<unknown, unknown>;
  readonly #index: number;

  constructor(param: ChSearchParam<unknown, unknown>, index: number) {
    this.#param = param;
    this.#index = index;
  }

  get key(): string {
    return this.#param.key;
  }

  get value(): string {
    return this.#param.values[this.#index];
  }

  toString(): string {
    return this.#param.rawKey + '=' + this.#param.rawValues[this.#index];
  }

}

abstract class ChSearchParam<out TValue, out TCharge> {

  #charge?: TCharge;

  abstract readonly key: string;
  abstract readonly rawKey: string;
  abstract readonly values: string[];
  abstract readonly rawValues: string[];

  getCharge(parser: URIChargeParser<TValue, TCharge>): TCharge {
    return this.#charge !== undefined ? this.#charge : (this.#charge = this.parseCharge(parser));
  }

  protected abstract parseCharge(parser: URIChargeParser<TValue, TCharge>): TCharge;

}

class ChSearchParam$Parsed<out TValue, out TCharge> extends ChSearchParam<TValue, TCharge> {

  readonly #key: string;
  readonly #rawKey: string;
  readonly #rawValues: string[];

  #values?: string[];

  constructor(key: string, rawKey: string, rawValue: string) {
    super();
    this.#key = key;
    this.#rawKey = rawKey;
    this.#rawValues = [rawValue];
  }

  get key(): string {
    return this.#key;
  }

  get rawKey(): string {
    return this.#rawKey;
  }

  get values(): string[] {
    return (this.#values ??= this.#rawValues.map(decodeSearchParam));
  }

  get rawValues(): string[] {
    return this.#rawValues;
  }

  add(rawValue: string): ChSearchParamValue {
    const index = this.#rawValues.length;

    this.#rawValues.push(rawValue);

    return new ChSearchParamValue(this, index);
  }

  protected override parseCharge(parser: URIChargeParser<TValue, TCharge>): TCharge {
    const rawValues = this.#rawValues;

    return rawValues.length === 1
      ? parser.parse(rawValues[0]).charge
      : this.#parseList(parser, rawValues);
  }

  #parseList(parser: URIChargeParser<TValue, TCharge>, rawValues: string[]): TCharge {
    const { chargeRx } = parser;

    return chargeRx.rxList(listRx => {
      for (const rawValue of rawValues) {
        listRx.add(chargeRx.rxValue(itemRx => parser.parse(rawValue, itemRx).charge));
      }

      return listRx.endList();
    });
  }

}

class ChSearchParam$Provided<out TValue, out TCharge> extends ChSearchParam<TValue, TCharge> {

  readonly #key: string;
  readonly #values: string[];

  #rawKey?: string;
  #rawValues?: string[];

  constructor(key: string, value: string) {
    super();
    this.#key = key;
    this.#values = [value];
  }

  get key(): string {
    return this.#key;
  }

  get rawKey(): string {
    return (this.#rawKey ??= decodeSearchParam(this.#key));
  }

  get values(): string[] {
    return this.#values;
  }

  get rawValues(): string[] {
    return (this.#rawValues ??= this.#values.map(encodeSearchParam));
  }

  add(value: string): ChSearchParamValue {
    const index = this.#values.length;

    this.#values.push(value);

    return new ChSearchParamValue(this, index);
  }

  protected override parseCharge(parser: URIChargeParser<TValue, TCharge>): TCharge {
    const values = this.#values;

    return values.length === 1
      ? parser.chargeRx.createValue(values[0], 'string')
      : this.#parseList(parser, values);
  }

  #parseList(parser: URIChargeParser<TValue, TCharge>, values: string[]): TCharge {
    const { chargeRx } = parser;

    return chargeRx.rxList(listRx => {
      for (const value of values) {
        listRx.addValue(value, 'string');
      }

      return listRx.endList();
    });
  }

}
