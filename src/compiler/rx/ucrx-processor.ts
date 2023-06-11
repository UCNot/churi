import { EsSignature } from 'esgen';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { UccProcessor } from '../processor/ucc-processor.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxClass, UcrxProto } from './ucrx.class.js';

/**
 * Schema processor utilizing {@link churi!Ucrx charge receiver} code generation.
 *
 * @typeParam TProcessor - Type of this schema processor.
 */
export abstract class UcrxProcessor<
  in TProcessor extends UcrxProcessor<TProcessor>,
> extends UccProcessor<TProcessor> {

  readonly #types = new Map<string | UcDataType, UcrxProto$Entry>();
  readonly #methods = new Set<UcrxMethod<any>>();

  /**
   * Assigns {@link churi!Ucrx Ucrx} class to use for the given `type` processing.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param type - Target type name or class.
   * @param proto - Ucrx class prototype.
   *
   * @returns `this` instance.
   */
  useUcrxClass<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    type: TSchema['type'],
    proto: UcrxProto<T, TSchema>,
  ): this {
    this.#entryFor(type).useProto(proto);

    return this;
  }

  /**
   * Declares `method` to present in all {@link churi!Ucrx charge receiver} implementations.
   *
   * @typeParam TArgs - Type of method arguments definition.
   * @typeParam TMod - Type of method modifier.
   * @param method - Declaration of method to add to charge receiver template.
   *
   * @returns `this` instance.
   */
  declareUcrxMethod<TArgs extends EsSignature.Args, TMod>(method: UcrxMethod<TArgs, TMod>): this {
    this.#methods.add(method);

    return this;
  }

  /**
   * Modifies the `method` of the target `type` receiver.
   *
   * @typeParam TArgs - Type of method arguments definition.
   * @typeParam TMod - Type of method modifier.
   * @param schema - Target schema.
   * @param method - Method to modify.
   * @param mod - Modifier to apply to target `method`.
   *
   * @returns `this` instance.
   */
  modifyUcrxMethod<TArgs extends EsSignature.Args, TMod>(
    schema: UcSchema,
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): this;

  modifyUcrxMethod<TArgs extends EsSignature.Args, TMod>(
    { type, id = type }: UcSchema,
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): this {
    this.#entryFor(id).modifyMethod(method, mod);

    return this;
  }

  createUcrxLibOptions(): UcrxLib.Options {
    return {
      methods: this.#methods,
      ucrxProtoFor: this.#ucrxProtoFor.bind(this),
    };
  }

  #ucrxProtoFor<T, TSchema extends UcSchema<T> = UcSchema<T>>({
    type,
    id = type,
  }: TSchema): UcrxProto<T, TSchema> | undefined {
    const typeEntry = this.#entryFor(type) as UcrxProto$Entry<T, TSchema>;

    if (id !== type) {
      // Concrete schema modifiers may differ from the ones of the type.
      const entry = this.#entryFor(id) as UcrxProto$Entry<T, TSchema>;

      if (entry) {
        return entry.proto(typeEntry);
      }
    }

    return typeEntry.proto();
  }

  #entryFor(id: string | UcDataType): UcrxProto$Entry {
    let entry = this.#types.get(id);

    if (!entry) {
      entry = new UcrxProto$Entry();
      this.#types.set(id, entry);
    }

    return entry;
  }

}

export namespace UcrxProcessor {
  export type Any = UcrxProcessor<UcrxProcessor.Any>;
}

class UcrxProto$Entry<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  #rawProto?: UcrxProto<T, TSchema>;
  #proto: UcrxProto<T, TSchema> | undefined;
  readonly #mods: ((ucrxClass: UcrxClass.Any) => void)[] = [];

  proto(typeEntry?: UcrxProto$Entry<T, TSchema>): UcrxProto<T, TSchema> | undefined {
    if (!this.#proto) {
      const proto = this.#rawProto ?? (typeEntry && typeEntry.#rawProto);

      if (proto) {
        this.#proto = (lib, schema) => {
          const ucrxClass = proto(lib, schema);

          if (ucrxClass) {
            if (typeEntry) {
              typeEntry.#modify(ucrxClass);
            }
            this.#modify(ucrxClass);

            ucrxClass.initUcrx(lib);
          }

          return ucrxClass;
        };
      }
    }

    return this.#proto;
  }

  #modify(ucrxClass: UcrxClass.Any): void {
    this.#mods.forEach(mod => mod(ucrxClass));
  }

  useProto(proto: UcrxProto<T, TSchema>): void {
    this.#rawProto = proto;
    this.#proto = undefined;
  }

  modifyMethod<TArgs extends EsSignature.Args, TMod>(
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): void {
    this.#mods.push(ucrxClass => ucrxClass.modifyMethod(method, mod));
  }

}
