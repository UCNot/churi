import { asArray } from '@proc7ts/primitives';
import {
  EsBundle,
  EsEvaluationOptions,
  EsGenerationOptions,
  EsScopeSetup,
  esEvaluate,
  esGenerate,
} from 'esgen';
import { UcFormatName } from '../../schema/uc-presentations.js';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { ucsCheckConstraints } from '../impl/ucs-check-constraints.js';
import { UccFeature } from '../processor/ucc-feature.js';
import { UccProcessor } from '../processor/ucc-processor.js';
import { UccSchemaIndex } from '../processor/ucc-schema-index.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsFunction } from './ucs-function.js';
import { UcsLib } from './ucs-lib.js';
import { UcsExports, UcsModels } from './ucs-models.js';
import { ucsSupportDefaults } from './ucs-support-defaults.js';

/**
 * Compiler of schema {@link churi!UcSerializer serializers}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcsCompiler<TModels extends UcsModels = UcsModels> extends UccProcessor<UcsCompiler> {

  readonly #options: UcsCompiler.Options<TModels>;
  readonly #formats = new Map<UcFormatName, Map<string | UcDataType, UcsTypeEntry>>();

  #bootstrapped = false;

  /**
   * Starts serializer setup.
   *
   * @param options - Setup options.
   */
  constructor(options: UcsCompiler.Options<TModels>) {
    const { models, features } = options;

    super({
      processors: 'serializer',
      models: Object.values(models).map(({ model }) => model),
      features,
    });

    this.#options = options;
  }

  /**
   * Assigns formatter to use for `target` value type or schema.
   *
   * Formatter provided for particular schema takes precedence over the one provided for the type.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @typeParam format - Name of target format.
   * @param target - Name or class of target value type, or target schema instance.
   * @param formatter - Assigned formatter.
   *
   * @returns `this` instance.
   */
  formatWith<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    format: UcFormatName,
    target: TSchema['type'] | TSchema,
    formatter: UcsFormatter<T, TSchema>,
  ): this {
    const fullFormatter: UcsFormatter<T, TSchema> = (args, schema, context) => {
      const onValue = formatter(args, schema, context);

      return onValue && ucsCheckConstraints(args, schema, onValue);
    };

    if (typeof target === 'object') {
      this.#typeEntryFor(format, target.type).formatSchemaWith(target, fullFormatter);
    } else {
      this.#typeEntryFor(format, target).formatTypeWith(fullFormatter);
    }

    return this;
  }

  #typeEntryFor<T, TSchema extends UcSchema<T>>(
    format: UcFormatName,
    type: TSchema['type'],
  ): UcsTypeEntry<T, TSchema> {
    let perType = this.#formats.get(format);

    if (!perType) {
      perType = new Map();
      this.#formats.set(format, perType);
    }

    let typeEntry = perType.get(type) as UcsTypeEntry<T, TSchema> | undefined;

    if (!typeEntry) {
      typeEntry = new UcsTypeEntry(this.schemaIndex);
      perType.set(type, typeEntry);
    }

    return typeEntry;
  }

  /**
   * Generates serialization code.
   *
   * @param options - Code generation options.
   *
   * @returns Promise resolved to serializer module text.
   */
  async generate(options: EsGenerationOptions = {}): Promise<string> {
    return await esGenerate({
      ...options,
      setup: [...asArray(options.setup), await this.bootstrap()],
    });
  }

  /**
   * Generates serialization code and evaluates it.
   *
   * @param options - Code evaluation options.
   *
   * @returns Promise resolved to deserializers exported from generated module.
   */
  async evaluate(options: EsEvaluationOptions = {}): Promise<UcsExports<TModels>> {
    return (await esEvaluate({
      ...options,
      setup: [...asArray(options.setup), await this.bootstrap()],
    })) as UcsExports<TModels>;
  }

  /**
   * Bootstraps serializer library.
   *
   * Enables configured {@link enable serialization features}, bootstraps {@link bootstrapOptions library options},
   * then creates library with that options.
   *
   * @returns Promise resolved to code bundle initialization setup.
   */
  async bootstrap(): Promise<EsScopeSetup<EsBundle>> {
    const options = await this.bootstrapOptions();

    return {
      esSetupScope(context) {
        context.set(UcsLib, new UcsLib(context.scope, options));
      },
    };
  }

  /**
   * Bootstraps serializer library options.
   *
   * Enables configured {@link enable serialization features}.
   *
   * @returns Promise resolved to serializer library options.
   */
  async bootstrapOptions(): Promise<UcsLib.Options<TModels>> {
    await this.#bootstrap();

    const { createSerializer = options => new UcsFunction(options) } = this.#options;

    return {
      ...this.#options,
      schemaIndex: this.schemaIndex,
      formatterFor: this.#formatterFor.bind(this),
      createSerializer,
    };
  }

  async #bootstrap(): Promise<void> {
    if (this.#bootstrapped) {
      return;
    }

    this.#bootstrapped = true;
    this.#enableDefaultFeatures();
    await this.processInstructions();
  }

  #enableDefaultFeatures(): void {
    const { features } = this.#options;

    if (!features) {
      this.enable(ucsSupportDefaults);
    }
  }

  #formatterFor<T, TSchema extends UcSchema<T>>(
    format: UcFormatName,
    schema: TSchema,
  ): UcsFormatter<T, TSchema> | undefined {
    return this.#typeEntryFor<T, TSchema>(format, schema.type).formatterFor(schema);
  }

}

export namespace UcsCompiler {
  export interface Options<TModels extends UcsModels> {
    readonly models: TModels;
    readonly features?: UccFeature<UcsCompiler> | readonly UccFeature<UcsCompiler>[] | undefined;

    createSerializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
  }
}

class UcsTypeEntry<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schemaIndex: UccSchemaIndex;
  readonly #schemaFormatters = new Map<string, UcsFormatter<T, TSchema>>();
  #typeFormatter: UcsFormatter<T, TSchema> | undefined;

  constructor(schemaIndex: UccSchemaIndex) {
    this.#schemaIndex = schemaIndex;
  }

  formatTypeWith(formatter: UcsFormatter<T, TSchema>): void {
    this.#typeFormatter = formatter;
  }

  formatSchemaWith(schema: TSchema, formatter: UcsFormatter<T, TSchema>): void {
    const schemaId = this.#schemaIndex.schemaId(schema);

    this.#schemaFormatters.set(schemaId, formatter);
  }

  formatterFor(schema: TSchema): UcsFormatter<T, TSchema> | undefined {
    const schemaId = this.#schemaIndex.schemaId(schema);

    return this.#schemaFormatters.get(schemaId) ?? this.#typeFormatter;
  }

}
