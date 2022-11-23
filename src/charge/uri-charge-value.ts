export type URIChargeValue = bigint | boolean | number | string | URIChargeObject;

export interface URIChargeObject {
  [key: string]: URIChargeValue;
}
