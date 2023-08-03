import { isDefined } from '@proc7ts/primitives';
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
import { UcrxCore$stub } from './impl/ucrx-core.stub.js';
import { UcrxBeforeMod, UcrxMethod, UcrxMethodInit } from './ucrx-method.js';
import { UcrxClass } from './ucrx.class.js';

export class UcrxInsetMethod extends UcrxMethod<UcrxInsetSignature.Args, UcrxInsetMod> {

  constructor(requestedName: string, init: UcrxInsetMethodInit = {}) {
    const { stub = UcrxCore$stub } = init;

    super(requestedName, { ...init, args: UcrxInsetSignature, stub });
  }

  override overrideIn(
    ucrxClass: UcrxClass.Any,
    declaration: EsMethodDeclaration<UcrxInsetSignature.Args>,
  ): EsMethodHandle<UcrxInsetSignature.Args> {
    return super.overrideIn(ucrxClass, {
      ...declaration,
      body: (member, hostClass) => code => {
        const mods = ucrxClass.methodModifiersOf(this);
        const insets = mods
          .map(({ inset }) => inset && ([inset.insetId, inset] as const))
          .filter(isDefined);

        if (insets.length) {
          const {
            member: { args },
          } = member;
          const { id } = args;

          code
            .write(esline`switch (${id}) {`)
            .indent(code => {
              let defaultInset: UcrxInsetMod['inset'];

              for (const [insetId, inset] of insets) {
                if (insetId != null) {
                  code.line(
                    `case ${
                      typeof insetId === 'string' ? esStringLiteral(insetId) : insetId
                    }: return `,
                    inset.createLexer(member as EsMemberRef<UcrxInsetMethod>, ucrxClass),
                    ';',
                  );
                } else {
                  defaultInset = inset;
                }
              }

              if (defaultInset) {
                code.line(
                  'default: return ',
                  defaultInset.createLexer(member as EsMemberRef<UcrxInsetMethod>, ucrxClass),
                  ';',
                );
              }
            })
            .write('}');
        }

        code.write(declaration.body(member, hostClass));
      },
    });
  }

}

export interface UcrxInsetMod extends UcrxBeforeMod<UcrxInsetSignature.Args> {
  readonly inset?:
    | {
        readonly insetId?: number | string | undefined;
        createLexer(
          member: EsMemberRef<UcrxInsetMethod, EsMethodHandle<UcrxInsetSignature.Args>>,
          ucrxClass: UcrxClass.Any,
        ): EsSnippet;
      }
    | undefined;
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
