import { EsSignature } from 'esgen';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { UccProcessor } from '../processor/ucc-processor.js';
import { UccSchemaIndex } from '../processor/ucc-schema-index.js';
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

  readonly #types = new Map<string | UcDataType, UcrxTypeEntry>();
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
    this.#typeEntryFor(type).useProto(proto);

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
  ): this {
    this.#typeEntryFor(schema.type).modifyMethodOf(schema, method, mod);

    return this;
  }

  createUcrxLibOptions(): UcrxLib.Options {
    return {
      methods: this.#methods,
      ucrxProtoFor: this.#ucrxProtoFor.bind(this),
    };
  }

  #ucrxProtoFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxProto<T, TSchema> | undefined {
    return this.#typeEntryFor(schema.type).protoFor(schema) as UcrxProto<T, TSchema> | undefined;
  }

  #typeEntryFor(type: string | UcDataType): UcrxTypeEntry {
    let entry = this.#types.get(type);

    if (!entry) {
      entry = new UcrxTypeEntry(this.schemaIndex);
      this.#types.set(type, entry);
    }

    return entry;
  }

}

export namespace UcrxProcessor {
  export type Any = UcrxProcessor<UcrxProcessor.Any>;
}

class UcrxTypeEntry<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schemaIndex: UccSchemaIndex;
  #proto: UcrxProto<T, TSchema> | undefined;
  readonly #mods = new Map<string, UcrxClassMods<T, TSchema>>();

  constructor(schemaIndex: UccSchemaIndex) {
    this.#schemaIndex = schemaIndex;
  }

  useProto(proto: UcrxProto<T, TSchema>): void {
    this.#proto = proto;
  }

  protoFor(schema: TSchema): UcrxProto<T, TSchema> | undefined {
    return this.#proto && this.#modsOf(schema).proto(this.#proto);
  }

  modifyMethodOf<TArgs extends EsSignature.Args, TMod>(
    schema: TSchema,
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): void {
    this.#modsOf(schema).modifyMethod(method, mod);
  }

  #modsOf(schema: TSchema): UcrxClassMods<T, TSchema> {
    const schemaId = this.#schemaIndex.schemaId(schema);

    let mods = this.#mods.get(schemaId);

    if (!mods) {
      mods = new UcrxClassMods();
      this.#mods.set(schemaId, mods);
    }

    return mods;
  }

}

class UcrxClassMods<out T, out TSchema extends UcSchema<T>> {

  readonly #mods: ((ucrxClass: UcrxClass.Any) => void)[] = [];
  #proto?: UcrxProto<T, TSchema>;

  proto(rawProto: UcrxProto<T, TSchema>): UcrxProto<T, TSchema> {
    if (!this.#proto) {
      this.#proto = (lib, schema) => {
        const ucrxClass = rawProto(lib, schema);

        if (ucrxClass) {
          this.#modify(ucrxClass);

          ucrxClass.initUcrx(lib);
        }

        return ucrxClass;
      };
    }

    return this.#proto;
  }

  modifyMethod<TArgs extends EsSignature.Args, TMod>(
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): void {
    this.#mods.push(ucrxClass => ucrxClass.modifyMethod(method, mod));
  }

  #modify(ucrxClass: UcrxClass.Any): void {
    this.#mods.forEach(mod => mod(ucrxClass));
  }

}
