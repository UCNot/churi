/* eslint-disable @typescript-eslint/naming-convention */
import { expect } from '@jest/globals';
import { ExpectationResult, MatcherContext } from 'expect';
import { UcEntity } from '../schema/entity/uc-entity.js';
import { UcFormatted } from '../schema/entity/uc-formatted.js';
import { URICharge } from '../schema/uri-charge/uri-charge.js';

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
    message: () =>
      `expected URI charge with ${this.utils.printReceived(receivedMeta)} ${
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
    message: () =>
      `expected URI charge with ${this.utils.printReceived(receivedMeta)} ${
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
    message: () =>
      `expected URI charge with ${this.utils.printReceived(receivedData)} ${
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
    message: () =>
      `expected URI charge with ${this.utils.printReceived(receivedMeta)} ${
        pass ? 'not ' : ''
      }to have single value with ${this.utils.printExpected(expectedMeta)}`,
    pass,
  };
}

function toHaveURIChargeEntries<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  expectedEntries: Record<string, unknown>,
): ExpectationResult {
  const receivedEntries = Object.fromEntries(
    [...received.entries()].map(([key, value]) => [key, extractURIChargeItem(value)]),
  );
  const pass = this.equals(receivedEntries, expectedEntries);

  return {
    message: () =>
      `expected URI charge with ${this.utils.printReceived(receivedEntries)} ${
        pass ? 'not ' : ''
      }to be a map of ${this.utils.printExpected(expectedEntries)}`,
    pass,
  };
}

function toHaveURIChargeItems<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  ...expectedValues: unknown[]
): ExpectationResult {
  const receivedValues = [...received.list()].map(extractURIChargeItem);
  const pass = this.equals(receivedValues, expectedValues);

  return {
    message: () =>
      `expected URI charge with ${this.utils.printReceived(receivedValues)} ${
        pass ? 'not ' : ''
      }to have ${expectedValues.length} values ${this.utils.printExpected(expectedValues)}`,
    pass,
  };
}

function toHaveURIChargeValue<TContext extends MatcherContext = MatcherContext>(
  this: TContext,
  received: URICharge,
  expectedValue: unknown,
): ExpectationResult {
  const receivedValue = extractURIChargeValue(received);
  const pass = this.equals(receivedValue, expectedValue);

  return {
    message: () =>
      `expected URI charge with ${this.utils.printReceived(received.value)} ${
        pass ? 'not ' : ''
      }to have value ${this.utils.printExpected(expectedValue)}`,
    pass,
  };
}

function extractURIChargeItem(charge: URICharge): unknown {
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

function extractURIChargeValue(charge: URICharge): unknown {
  const { value } = charge;

  if (value instanceof UcEntity) {
    return { entity: value.name };
  }
  if (value instanceof UcFormatted) {
    return { format: value.format, data: value.data };
  }

  return value;
}

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeURIChargeList(length: number, type?: string): void;
    toBeURIChargeMap(): void;
    toBeURIChargeNone(): void;
    toBeURIChargeSingle(type: string): void;
    toHaveURIChargeEntries(expectedEntries: Record<string, unknown>): void;
    toHaveURIChargeValue(expectedValue: unknown): void;
    toHaveURIChargeItems(...expectedValues: unknown[]): void;
  }

  interface Matchers<R> {
    toBeURIChargeList(length: number, type?: string): R;
    toBeURIChargeMap(): R;
    toBeURIChargeNone(): R;
    toBeURIChargeSingle(type: string): R;
    toHaveURIChargeEntries(expectedEntries: Record<string, unknown>): R;
    toHaveURIChargeValue(expectedValue: unknown): R;
    toHaveURIChargeItems(...expectedValues: unknown[]): R;
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
