import { URIChargeObject } from './uri-charge-value.js';

export interface URIChargeParser<T> {
  parseString(input: string): T;
  parseObject(): [consumer: URIChargeParser.Consumer, endCharge: () => T];
}

export namespace URIChargeParser {
  export interface Consumer {
    addBigInt(key: string, value: bigint): void;
    addBoolean(key: string, value: boolean): void;
    addNumber(key: string, value: number): void;
    addString(key: string, value: string): void;
    startObject(key: string): Consumer;
    endObject(suffix: string): void;
  }

  export interface Result<T = string | URIChargeObject> {
    readonly charge: T;
    readonly end: number;
  }
}
