/* eslint-disable @typescript-eslint/naming-convention */
import { expect } from '@jest/globals';
import { ExpectationResult, MatcherContext } from 'expect';
import { ChURIDirective, ChURIEntity } from '../ch-uri-value.js';
import { URICharge, URIChargeItem } from '../uri-charge.js';

expect.extend({
  toBeURIChargeList,
  toBeURIChargeMap,
  toBeURIChargeSingle,
  toHaveURIChargeValue,
  toHaveURIChargeValues,
});

function toBeURIChargeList<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  length: number,
  type?: string,
): ExpectationResult {
  const receivedMeta = { ...URIChargeMeta(received), type: received.type };
  const expectedMeta: URIChargeMeta = {
    type,
    length,
    isNone: false,
    isSome: true,
    hasValues: true,
    isSingle: false,
    isList: true,
    isMap: false,
  };

  const pass = this.equals(receivedMeta, expectedMeta);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(receivedMeta)} ${
        pass ? 'not ' : ''
      }to be list with ${this.utils.printExpected(expectedMeta)}`,
    pass,
  };
}

function toBeURIChargeMap<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
): ExpectationResult {
  const receivedMeta = { ...URIChargeMeta(received), type: received.type };
  const expectedMeta: URIChargeMeta = {
    type: undefined,
    length: 0,
    isNone: false,
    isSome: true,
    hasValues: false,
    isSingle: false,
    isList: false,
    isMap: true,
  };

  const pass = this.equals(receivedMeta, expectedMeta);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(receivedMeta)} ${
        pass ? 'not ' : ''
      }to be map with ${this.utils.printExpected(expectedMeta)}`,
    pass,
  };
}

function toBeURIChargeSingle<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  type: string,
): ExpectationResult {
  const receivedMeta = URIChargeMeta(received);
  const expectedMeta: URIChargeMeta = {
    type,
    length: 1,
    isNone: false,
    isSome: true,
    hasValues: true,
    isSingle: true,
    isList: false,
    isMap: false,
  };

  const pass = this.equals(receivedMeta, expectedMeta);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(receivedMeta)} ${
        pass ? 'not ' : ''
      }to have single value with ${this.utils.printExpected(expectedMeta)}`,
    pass,
  };
}

function toHaveURIChargeValue<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  expectedValue: URIChargeItem | undefined,
): ExpectationResult {
  const pass = this.equals(received.value, expectedValue, [URIChargeItem$equal]);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(printURIChargeItem(received.value))} ${
        pass ? 'not ' : ''
      }to have value ${this.utils.printExpected(printURIChargeItem(expectedValue))}`,
    pass,
  };
}

function toHaveURIChargeValues<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  ...expectedValues: (URIChargeItem | undefined)[]
): ExpectationResult {
  const receivedValues = [...received.list()].map(({ value }) => value);
  const pass = this.equals(receivedValues, expectedValues, [URIChargeItem$equal]);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(printURIChargeItems(receivedValues))} ${
        pass ? 'not ' : ''
      }to have ${expectedValues.length} values ${this.utils.printExpected(
        printURIChargeItems(expectedValues),
      )}`,
    pass,
  };
}

function printURIChargeItems(items: (URIChargeItem | undefined)[]): unknown[] {
  return items.map(printURIChargeItem);
}

function printURIChargeItem(item: URIChargeItem | undefined): unknown {
  if (item instanceof ChURIEntity) {
    return String(item);
  }
  if (item instanceof ChURIDirective) {
    return `${item.rawName}(...)`;
  }

  return item;
}

function URIChargeItem$equal(first: URIChargeItem, second: URIChargeItem): boolean | undefined {
  if (!(first instanceof ChURIEntity)) {
    return;
  }

  return second instanceof ChURIEntity && first.raw === second.raw;
}

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeURIChargeList(length: number, type?: string): void;
    toBeURIChargeMap(): void;
    toBeURIChargeSingle(type: string): void;
    toHaveURIChargeValue(expectedValue: URIChargeItem | undefined): void;
    toHaveURIChargeValues(...expectedValues: (URIChargeItem | undefined)[]): void;
  }

  interface Matchers<R> {
    toBeURIChargeList(length: number, type?: string): R;
    toBeURIChargeMap(): R;
    toBeURIChargeSingle(type: string): R;
    toHaveURIChargeValue(expectedValue: URIChargeItem | undefined): R;
    toHaveURIChargeValues(...expectedValues: (URIChargeItem | undefined)[]): R;
  }
}

interface URIChargeMeta {
  type: string | undefined;
  length: number;
  isNone: boolean;
  isSome: boolean;
  hasValues: boolean;
  isSingle: boolean;
  isList: boolean;
  isMap: boolean;
}

function URIChargeMeta(charge: URICharge): URIChargeMeta {
  return {
    type: charge.type,
    length: charge.length,
    isNone: charge.isNone(),
    isSome: charge.isSome(),
    hasValues: charge.hasValues(),
    isSingle: charge.isSingle(),
    isList: charge.isList(),
    isMap: charge.isMap(),
  };
}
