export type URIChargeValue = URIChargeValue.Simple | URIChargeValue.Object;

export namespace URIChargeValue {
  export type Simple = bigint | boolean | number | string;
  export interface Object {
    [key: string]: URIChargeValue | URIChargeValue[];
  }
}
