/* eslint-disable @typescript-eslint/naming-convention */
import { expect } from '@jest/globals';
import { ExpectationResult, MatcherContext } from 'expect';
import { URICharge, URIChargeItem } from '../charge/uri-charge.js';
import { UcEntity } from '../schema/uc-entity.js';

expect.extend({
  toBeURIChargeList,
  toBeURIChargeMap,
  toBeURIChargeNone,
  toBeURIChargeSingle,
  toHaveURIChargeEntries,
  toHaveURIChargeItems,
  toHaveURIChargeValue,
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
    hasValues: !!length,
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

function toBeURIChargeNone<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
): ExpectationResult {
  const receivedMeta = URIChargeMeta(received);
  const receivedData = { ...receivedMeta, value: received.value };
  const expectedMeta: URIChargeMeta = {
    type: undefined,
    length: 0,
    isNone: true,
    isSome: false,
    hasValues: false,
    isSingle: false,
    isList: false,
    isMap: false,
  };
  const expectedData = { ...expectedMeta, value: received.value };

  const pass = this.equals(receivedData, expectedData);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(receivedData)} ${
        pass ? 'not ' : ''
      }to be "None" value with ${this.utils.printExpected(expectedData)}`,
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

function toHaveURIChargeEntries<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  expectedEntries: Record<string, URIChargeValue>,
): ExpectationResult {
  const receivedEntries = Object.fromEntries(
    [...received.entries()].map(([key, value]) => [key, extractURIChargeItem(value)]),
  );
  const pass = this.equals(receivedEntries, expectedEntries);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(receivedEntries)} ${
        pass ? 'not ' : ''
      }to be a map of ${this.utils.printExpected(expectedEntries)}`,
    pass,
  };
}

function toHaveURIChargeItems<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  ...expectedValues: URIChargeValue[]
): ExpectationResult {
  const receivedValues = [...received.list()].map(extractURIChargeItem);
  const pass = this.equals(receivedValues, expectedValues);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(receivedValues)} ${
        pass ? 'not ' : ''
      }to have ${expectedValues.length} values ${this.utils.printExpected(expectedValues)}`,
    pass,
  };
}

function toHaveURIChargeValue<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  expectedValue: URIChargeValue,
): ExpectationResult {
  const receivedValue = extractURIChargeValue(received);
  const pass = this.equals(receivedValue, expectedValue);

  return {
    message: () => `expected URI charge with ${this.utils.printReceived(received.value)} ${
        pass ? 'not ' : ''
      }to have value ${this.utils.printExpected(expectedValue)}`,
    pass,
  };
}

type URIChargeValue =
  | undefined
  | URIChargeItem
  | { [key: string]: URIChargeValue }
  | URIChargeValue[]
  | undefined;

function extractURIChargeItem(charge: URICharge): URIChargeValue {
  if (charge.isList()) {
    return [...charge.list()].map(extractURIChargeItem);
  }
  if (charge.isMap()) {
    return Object.fromEntries(
      [...charge.entries()].map(([key, value]) => [key, extractURIChargeItem(value)]),
    );
  }

  return extractURIChargeValue(charge);
}

function extractURIChargeValue(charge: URICharge): URIChargeValue {
  const { value } = charge;

  if (value instanceof UcEntity) {
    return { raw: value.raw };
  }

  return value;
}

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeURIChargeList(length: number, type?: string): void;
    toBeURIChargeMap(): void;
    toBeURIChargeNone(): void;
    toBeURIChargeSingle(type: string): void;
    toHaveURIChargeEntries(expectedEntries: Record<string, URIChargeValue>): void;
    toHaveURIChargeValue(expectedValue: URIChargeValue): void;
    toHaveURIChargeItems(...expectedValues: URIChargeValue[]): void;
  }

  interface Matchers<R> {
    toBeURIChargeList(length: number, type?: string): R;
    toBeURIChargeMap(): R;
    toBeURIChargeNone(): R;
    toBeURIChargeSingle(type: string): R;
    toHaveURIChargeEntries(expectedEntries: Record<string, URIChargeValue>): R;
    toHaveURIChargeValue(expectedValue: URIChargeValue): R;
    toHaveURIChargeItems(...expectedValues: URIChargeValue[]): R;
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
