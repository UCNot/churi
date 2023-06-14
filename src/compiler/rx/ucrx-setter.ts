import {
  EsArg,
  EsMemberRef,
  EsMethodDeclaration,
  EsMethodHandle,
  EsSignature,
  EsSnippet,
  esStringLiteral,
  esline,
} from 'esgen';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { UcrxMethod, UcrxMethodInit } from './ucrx-method.js';
import { UcrxClass } from './ucrx.class.js';

export class UcrxSetter extends UcrxMethod<UcrxSetterSignature.Args, UcrxSetterMod> {

  constructor(requestedName: string, init: UcrxSetterInit) {
    const { typeName, stub = UcrxSetter$createStub(typeName) } = init;

    super(requestedName, { ...init, args: UcrxSetterSignature, stub });
  }

  override overrideIn(
    ucrxClass: UcrxClass.Any,
    declaration: EsMethodDeclaration<UcrxSetterSignature.Args>,
  ): EsMethodHandle<UcrxSetterSignature.Args> {
    return this.declareIn(ucrxClass, {
      ...declaration,
      body: (member, hostClass) => code => {
        const mods = ucrxClass.methodModifiersOf(this);

        for (const { before } of mods) {
          code.write(
            before(
              member as EsMemberRef<UcrxSetter, EsMethodHandle<UcrxSetterSignature.Args>>,
              ucrxClass,
            ),
          );
        }

        code.write(declaration.body(member, hostClass));
      },
    });
  }

}

export interface UcrxSetter extends UcrxMethod<UcrxSetterSignature.Args, UcrxSetterMod> {
  get typeName(): string;
}

export interface UcrxSetterMod {
  before(
    member: EsMemberRef<UcrxSetter, EsMethodHandle<UcrxSetterSignature.Args>>,
    ucrxClass: UcrxClass.Any,
  ): EsSnippet;
}

export interface UcrxSetterInit
  extends Omit<UcrxMethodInit<UcrxSetterSignature.Args>, 'args' | 'stub'> {
  readonly typeName: string;
  readonly stub?: EsMethodDeclaration<UcrxSetterSignature.Args> | undefined;
}

export const UcrxSetterSignature: UcrxSetterSignature = /*#__PURE__*/ new EsSignature({
  value: {},
  reject: {},
});

export type UcrxSetterSignature = EsSignature<UcrxSetterSignature.Args>;

export namespace UcrxSetterSignature {
  export type Args = {
    readonly value: EsArg;
    readonly reject: EsArg;
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
        args: { value, reject },
      },
    }) {
      const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

      return esline`return this.any(${value}) || ${reject}(${ucrxRejectType}(${esStringLiteral(
        typeName,
      )}, this));`;
    },
  };
}
