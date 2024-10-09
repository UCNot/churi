import { EsArg, EsMethodDeclaration, EsSignature, esStringLiteral, esline } from 'esgen';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { UcrxMethod, UcrxMethodInit } from './ucrx-method.js';

export class UcrxSetter extends UcrxMethod<UcrxSetterSignature.Args> {
  constructor(requestedName: string, init: UcrxSetterInit) {
    const { typeName, stub = UcrxSetter$createStub(typeName) } = init;

    super(requestedName, { ...init, args: UcrxSetterSignature, stub });
  }
}

export interface UcrxSetter extends UcrxMethod<UcrxSetterSignature.Args> {
  get typeName(): string;
}

export interface UcrxSetterInit
  extends Omit<UcrxMethodInit<UcrxSetterSignature.Args>, 'args' | 'stub'> {
  readonly typeName: string;
  readonly stub?: EsMethodDeclaration<UcrxSetterSignature.Args> | undefined;
}

export const UcrxSetterSignature: UcrxSetterSignature = /*#__PURE__*/ new EsSignature({
  value: {},
  cx: {},
});

export type UcrxSetterSignature = EsSignature<UcrxSetterSignature.Args>;

export namespace UcrxSetterSignature {
  export type Args = {
    readonly value: EsArg;
    readonly cx: EsArg;
  };
  export type Values = EsSignature.ValuesOf<Args>;
}

export function isUcrxSetter(method: UcrxMethod): method is UcrxSetter {
  return method.signature === UcrxSetterSignature;
}

function UcrxSetter$createStub(typeName: string): EsMethodDeclaration<UcrxSetterSignature.Args> {
  return {
    body({
      member: {
        args: { value, cx },
      },
    }) {
      const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

      return esline`return this.any(${value}) || ${cx}.reject(${ucrxRejectType}(${esStringLiteral(
        typeName,
      )}, this));`;
    },
  };
}
