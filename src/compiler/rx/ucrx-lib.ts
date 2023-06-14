import { EsArg, EsClass, EsScope, EsSignature } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { CustomBaseUcrxClass } from '../impl/custom-base.ucrx.class.js';
import { CustomOpaqueUcrxClass } from '../impl/custom-opaque.ucrx.class.js';
import { VoidUcrxClass } from '../impl/void.ucrx.class.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxClass, UcrxProto } from './ucrx.class.js';

export abstract class UcrxLib {

  static esScopedValue(scope: EsScope): UcrxLib {
    const { bundle } = scope;

    if (scope !== bundle) {
      return bundle.get(this);
    }

    throw new ReferenceError(`UcrxLib is not initialized`);
  }

  readonly #baseUcrx: EsClass<{ set: EsArg }>;
  readonly #opaqueUcrx: EsClass<EsSignature.NoArgs> | undefined;
  readonly #ucrxProtoFor?:
    | (<T, TSchema extends UcSchema<T> = UcSchema<T>>(
        this: void,
        schema: TSchema,
      ) => UcrxProto<T, TSchema> | undefined)
    | undefined;

  constructor(options: UcrxLib.Options) {
    const { ucrxProtoFor: ucrxProtoFor } = options;

    this.#ucrxProtoFor = ucrxProtoFor;

    const baseUcrx = this.#declareBaseUcrx(options);

    this.#baseUcrx = baseUcrx ?? VoidUcrxClass.instance;
    this.#opaqueUcrx = baseUcrx && new CustomOpaqueUcrxClass();
  }

  #declareBaseUcrx({ methods }: UcrxLib.Options): EsClass<{ set: EsArg }> | undefined {
    const voidUcrx = VoidUcrxClass.instance;
    let baseUcrx: CustomBaseUcrxClass | undefined;

    // Register custom methods.
    if (methods) {
      for (const method of methods) {
        if (!voidUcrx.findMember(method)) {
          baseUcrx ??= new CustomBaseUcrxClass();
          if (!baseUcrx.findMember(method)) {
            method.declareStub(baseUcrx);
          }
        }
      }
    }

    return baseUcrx;
  }

  get baseUcrx(): EsClass<{ set: EsArg }> {
    return this.#baseUcrx;
  }

  get opaqueUcrx(): EsClass<EsSignature.NoArgs> | undefined {
    return this.#opaqueUcrx;
  }

  abstract ucrxClassFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(schema: TSchema): UcrxClass;

  ucrxProtoFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxProto<T, TSchema> | undefined {
    return this.#ucrxProtoFor?.(schema);
  }

}

export namespace UcrxLib {
  export interface Options {
    readonly methods?: Iterable<UcrxMethod> | undefined;
    readonly ucrxProtoFor?:
      | (<T, TSchema extends UcSchema<T> = UcSchema<T>>(
          this: void,
          schema: TSchema,
        ) => UcrxProto<T, TSchema> | undefined)
      | undefined;
  }
}
