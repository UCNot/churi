import { ChURIArray, ChURIObject } from './ch-uri-value.js';
import { URIChargeVisitor } from './uri-charge-visitor.js';

export type URIChargeParser<T> = URIChargeParser.WithVisitor<T> | URIChargeParser.WithoutVisitor;

export namespace URIChargeParser {
  export interface Options<T> {
    readonly visitor?: URIChargeVisitor<T> | undefined;
  }
  export interface WithVisitor<T> extends Options<T> {
    readonly visitor: URIChargeVisitor<T>;
  }
  export interface WithoutVisitor extends Options<never> {
    readonly visitor?: undefined;
  }
  export interface Result<T = string | ChURIObject | ChURIArray> {
    readonly charge: T;
    readonly end: number;
  }
}
