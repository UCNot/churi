import { EsArg, EsMethodDeclaration, EsSignature } from 'esgen';
import { UcrxCore$stub } from '../impl/ucrx-core.stub.js';
import { UcrxMethod, UcrxMethodInit } from './ucrx-method.js';

export class UcrxInsetMethod extends UcrxMethod<UcrxInsetSignature.Args> {

  constructor(requestedName: string, init: UcrxInsetMethodInit = {}) {
    const { stub = UcrxCore$stub } = init;

    super(requestedName, { ...init, args: UcrxInsetSignature, stub });
  }

}

export interface UcrxInsetMethodInit
  extends Omit<UcrxMethodInit<UcrxInsetSignature.Args>, 'args' | 'stub' | 'typeName'> {
  readonly stub?: EsMethodDeclaration<UcrxInsetSignature.Args> | undefined;
}

export const UcrxInsetSignature = /*#__PURE__*/ new EsSignature({ id: {}, emit: {}, cx: {} });

export type UcrxInsetSignature = EsSignature<UcrxInsetSignature.Args>;

export namespace UcrxInsetSignature {
  export type Args = {
    readonly id: EsArg;
    readonly emit: EsArg;
    readonly cx: EsArg;
  };

  export type Values = EsSignature.ValuesOf<Args>;
}
