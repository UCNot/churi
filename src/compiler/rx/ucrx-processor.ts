import { EsSignature } from 'esgen';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { UccProcessor } from '../bootstrap/ucc-processor.js';
import { UccSchemaIndex } from '../bootstrap/ucc-schema-index.js';
import { UcrxBootstrap } from './ucrx-bootstrap.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxBeforeMod, UcrxMethod } from './ucrx-method.js';
import { UcrxClass, UcrxClassMod, UcrxProto, UcrxSignature } from './ucrx.class.js';

/**
 * Schema processing utilizing {@link churi!Ucrx charge receiver} code generation.
 *
 * @typeParam TBoot - Type of schema processing bootstrap.
 */
export abstract class UcrxProcessor<in out TBoot extends UcrxBootstrap<TBoot>>
  extends UccProcessor<TBoot>
  implements UcrxBootstrap<TBoot>
{
  readonly #perType = new Map<string | UcDataType, UcrxTypeEntry>();
  readonly #methods = new Set<UcrxMethod<any>>();

  useUcrxClass<T>(target: UcSchema<T>['type'] | UcSchema<T>, proto: UcrxProto<T>): this {
    if (typeof target === 'object') {
      this.#typeEntryFor(target.type).useProtoFor(target, proto);
    } else {
      this.#typeEntryFor(target).useProto(proto);
    }

    return this;
  }

  modifyUcrxClass<T>(schema: UcSchema<T>, mod: UcrxClassMod<T>): this {
    this.#typeEntryFor(schema.type).modifyClass(schema, mod);

    return this;
  }

  declareUcrxMethod<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    method: UcrxMethod<TArgs, TMod>,
  ): this {
    this.#methods.add(method);

    return this;
  }

  modifyUcrxMethod<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
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
      this.#perType.set(type, typeEntry as UcrxTypeEntry);
    }

    return typeEntry;
  }
}

class UcrxTypeEntry<in out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
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

  modifyClass(schema: TSchema, mod: UcrxClassMod<T, TSchema>): void {
    this.#schemaEntryFor(schema).modifyClass(mod);
  }

  modifyMethodOf<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
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

class UcrxSchemaEntry<in out T, out TSchema extends UcSchema<T>> {
  readonly #mods: ((ucrxClass: UcrxClass<UcrxSignature.Args, T, TSchema>) => void)[] = [];
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
        this.#modifyUcrxClass(ucrxClass as UcrxClass<UcrxSignature.Args, T, TSchema>);

        ucrxClass.initUcrx();
      }

      return ucrxClass;
    };
  }

  modifyClass(mod: UcrxClassMod<T, TSchema>): void {
    this.#mods.push(ucrxClass => mod.applyTo(ucrxClass));
  }

  modifyMethod<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): void {
    this.#mods.push(ucrxClass => ucrxClass.modifyMethod(method, mod));
  }

  #modifyUcrxClass(ucrxClass: UcrxClass<UcrxSignature.Args, T, TSchema>): void {
    this.#mods.forEach(mod => mod(ucrxClass));
  }
}
