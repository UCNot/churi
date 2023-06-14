import { EsAnyMember, EsArg, EsClass, EsClassInit, EsSignature, esStringLiteral } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucSchemaTypeSymbol } from '../impl/uc-schema-symbol.js';
import { UcrxCore } from './ucrx-core.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxMethod } from './ucrx-method.js';

export abstract class UcrxClass<
  out TArgs extends UcrxSignature1.Args = UcrxSignature.Args,
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
> extends EsClass<TArgs> {

  readonly #schema: TSchema;
  readonly #typeName: string;
  readonly #methodMods = new Map<UcrxMethod<EsSignature.Args, unknown>, unknown[]>();
  #supportedTypes?: ReadonlySet<string>;

  constructor(init: UcrxClass.Init<TArgs, T, TSchema>) {
    const { schema, typeName = ucSchemaTypeSymbol(schema), declare = { at: 'bundle' } } = init;

    super(`${typeName}Ucrx`, { ...init, declare });

    this.#schema = schema;
    this.#typeName = typeName;
  }

  get baseUcrx(): UcrxClass | undefined {
    const { baseClass } = this;

    return baseClass instanceof UcrxClass ? baseClass : undefined;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get typeName(): string {
    return this.#typeName;
  }

  get permitsSingle(): boolean {
    return true;
  }

  get supportedTypes(): ReadonlySet<string> {
    if (!this.#supportedTypes) {
      const types = new Set<string>();

      this.discoverTypes(types);

      this.#supportedTypes = types;
    }

    return this.#supportedTypes;
  }

  isMemberOverridden(member: EsAnyMember): boolean {
    const found = this.findMember(member);

    if (!found) {
      return false;
    }
    if (found.declared) {
      return true;
    }

    return !!this.baseUcrx?.isMemberOverridden(member);
  }

  methodModifiersOf<TArgs extends EsSignature.Args, TMod>(
    method: UcrxMethod<TArgs, TMod>,
  ): readonly TMod[] {
    return (this.#methodMods.get(method) ?? []) as TMod[];
  }

  modifyMethod<TArgs extends EsSignature.Args, TMod>(
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): void {
    const mods = this.#methodMods.get(method);

    if (mods) {
      mods.push(mod);
    } else {
      this.#methodMods.set(method, [mod]);
    }
  }

  protected discoverTypes(types: Set<string>): void {
    for (const memberRef of this.members()) {
      const { member, declared } = memberRef;

      if (declared && member instanceof UcrxMethod) {
        const { typeName } = member;

        if (typeName) {
          types.add(typeName);
        }
      }
    }

    this.baseUcrx?.discoverTypes(types);
  }

  initUcrx(lib: UcrxLib): void;
  initUcrx(_lib: UcrxLib): void {
    this.#declareTypes();
  }

  #declareTypes(): void {
    UcrxCore.types.declareIn(this as EsClass, {
      get: () => `return [` + [...this.supportedTypes].map(type => esStringLiteral(type)).join(', ') + `];`,
    });
  }

}

export namespace UcrxClass {
  export type Any = UcrxClass<UcrxSignature1.Args>;

  export type Init<
    TArgs extends UcrxSignature1.Args,
    T = unknown,
    TSchema extends UcSchema<T> = UcSchema<T>,
  > = EsClassInit<TArgs> & {
    readonly schema: TSchema;
    readonly typeName?: string | undefined;
  };
}

export type UcrxProto<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> = {
  createUcrxClass(lib: UcrxLib, schema: TSchema): UcrxClass.Any | undefined;
}['createUcrxClass'];

export const UcrxSignature: UcrxSignature = /*#__PURE__*/ new EsSignature({
  set: {},
  context: {},
});

export const UcrxSignature1: UcrxSignature1 = /*#__PURE__*/ new EsSignature({
  set: {},
});

export type UcrxSignature = EsSignature<UcrxSignature.Args>;
export type UcrxSignature1 = EsSignature<UcrxSignature1.Args>;

export namespace UcrxSignature {
  export type Args = {
    readonly set: EsArg;
    readonly context: EsArg;
  };
}

export namespace UcrxSignature1 {
  export type Args = {
    readonly set: EsArg;
  };
}
