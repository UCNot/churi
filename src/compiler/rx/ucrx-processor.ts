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

  readonly #perType = new Map<string | UcDataType, UcrxTypeEntry>();
  readonly #methods = new Set<UcrxMethod<any>>();

  /**
   * Assigns {@link churi!Ucrx Ucrx} class to use for `target` value type or schema processing.
   *
   * The class prototype provided for particular schema takes precedence over the one provided for the type.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param target - Name or class of target value type, or target schema instance.
   * @param proto - Ucrx class prototype.
   *
   * @returns `this` instance.
   */
  useUcrxClass<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    target: TSchema['type'] | TSchema,
    proto: UcrxProto<T, TSchema>,
  ): this {
    if (typeof target === 'object') {
      this.#typeEntryFor(target.type).useProtoFor(target, proto);
    } else {
      this.#typeEntryFor(target).useProto(proto);
    }

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
    return this.#typeEntryFor<T, TSchema>(schema.type).protoFor(schema);
  }

  #typeEntryFor<T, TSchema extends UcSchema<T>>(type: TSchema['type']): UcrxTypeEntry<T, TSchema> {
    let typeEntry = this.#perType.get(type) as UcrxTypeEntry<T, TSchema> | undefined;

    if (!typeEntry) {
      typeEntry = new UcrxTypeEntry(this.schemaIndex);
      this.#perType.set(type, typeEntry);
    }

    return typeEntry;
  }

}

export namespace UcrxProcessor {
  export type Any = UcrxProcessor<UcrxProcessor.Any>;
}

class UcrxTypeEntry<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schemaIndex: UccSchemaIndex;
  #proto: UcrxProto<T, TSchema> | undefined;
  readonly #perSchema = new Map<string, UcrxSchemaEntry<T, TSchema>>();

  constructor(schemaIndex: UccSchemaIndex) {
    this.#schemaIndex = schemaIndex;
  }

  useProto(proto: UcrxProto<T, TSchema>): void {
    this.#proto = proto;
  }

  useProtoFor(schema: TSchema, proto: UcrxProto<T, TSchema>): void {
    this.#schemaEntryFor(schema).useProto(proto);
  }

  protoFor(schema: TSchema): UcrxProto<T, TSchema> | undefined {
    return this.#schemaEntryFor(schema).proto(this.#proto);
  }

  modifyMethodOf<TArgs extends EsSignature.Args, TMod>(
    schema: TSchema,
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): void {
    this.#schemaEntryFor(schema).modifyMethod(method, mod);
  }

  #schemaEntryFor(schema: TSchema): UcrxSchemaEntry<T, TSchema> {
    const schemaId = this.#schemaIndex.schemaId(schema);
    let schemaEntry = this.#perSchema.get(schemaId);

    if (!schemaEntry) {
      schemaEntry = new UcrxSchemaEntry();
      this.#perSchema.set(schemaId, schemaEntry);
    }

    return schemaEntry;
  }

}

class UcrxSchemaEntry<out T, out TSchema extends UcSchema<T>> {

  readonly #mods: ((ucrxClass: UcrxClass.Any) => void)[] = [];
  #explicitProto: UcrxProto<T, TSchema> | undefined;
  #proto: UcrxProto<T, TSchema> | undefined;

  useProto(proto: UcrxProto<T, TSchema>): void {
    this.#explicitProto = proto;
  }

  proto(typeProto: UcrxProto<T, TSchema> | undefined): UcrxProto<T, TSchema> | undefined {
    return (this.#proto ??= this.#createProto(typeProto));
  }

  #createProto(typeProto: UcrxProto<T, TSchema> | undefined): UcrxProto<T, TSchema> | undefined {
    const baseProto = this.#explicitProto ?? typeProto;

    if (!baseProto) {
      return;
    }

    return (lib, schema) => {
      const ucrxClass = baseProto(lib, schema);

      if (ucrxClass) {
        this.#modifyUcrxClass(ucrxClass);

        ucrxClass.initUcrx(lib);
      }

      return ucrxClass;
    };
  }

  modifyMethod<TArgs extends EsSignature.Args, TMod>(
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): void {
    this.#mods.push(ucrxClass => ucrxClass.modifyMethod(method, mod));
  }

  #modifyUcrxClass(ucrxClass: UcrxClass.Any): void {
    this.#mods.forEach(mod => mod(ucrxClass));
  }

}
