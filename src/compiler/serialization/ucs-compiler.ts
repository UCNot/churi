import { asArray } from '@proc7ts/primitives';
import {
  EsBundle,
  EsEvaluationOptions,
  EsGenerationOptions,
  EsScopeSetup,
  esEvaluate,
  esGenerate,
} from 'esgen';
import { UcDataType, UcInfer, UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UcSerializer } from '../../schema/uc-serializer.js';
import { ucsCheckConstraints } from '../impl/ucs-check-constraints.js';
import { UccFeature } from '../processor/ucc-feature.js';
import { UccProcessor } from '../processor/ucc-processor.js';
import { UccSchemaIndex } from '../processor/ucc-schema-index.js';
import { UcsFunction } from './ucs-function.js';
import { UcsGenerator } from './ucs-generator.js';
import { UcsLib } from './ucs-lib.js';
import { ucsSupportDefaults } from './ucs-support-defaults.js';

/**
 * Compiler of schema {@link churi!UcSerializer serializers}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcsCompiler<TModels extends UcsModels = UcsModels> extends UccProcessor<UcsCompiler> {

  readonly #options: UcsCompiler.Options<TModels>;
  readonly #perType = new Map<string | UcDataType, UcsTypeEntry>();

  #bootstrapped = false;

  /**
   * Starts serializer setup.
   *
   * @param options - Setup options.
   */
  constructor(options: UcsCompiler.Options<TModels>) {
    const { models, features } = options;

    super({
      processorNames: 'serializer',
      models: Object.values(models),
      features,
    });

    this.#options = options;
  }

  /**
   * Assigns serialization code generator to use for `target` value type or schema.
   *
   * Generator provided for particular schema takes precedence over the one provided for the type.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param target - Name or class of target value type, or target schema instance.
   * @param generator - Assigned generator.
   *
   * @returns `this` instance.
   */
  useUcsGenerator<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    target: TSchema['type'] | TSchema,
    generator: UcsGenerator<T, TSchema>,
  ): this {
    const fullGenerator: UcsGenerator<T, TSchema> = (fn, schema, args) => {
      const onValue = generator(fn, schema, args);

      return onValue && ucsCheckConstraints(fn, schema, args.value, onValue);
    };

    if (typeof target === 'object') {
      this.#typeEntryFor(target.type).useGeneratorFor(target, fullGenerator);
    } else {
      this.#typeEntryFor(target).useGenerator(fullGenerator);
    }

    return this;
  }

  #typeEntryFor<T, TSchema extends UcSchema<T>>(type: TSchema['type']): UcsTypeEntry<T, TSchema> {
    let typeEntry = this.#perType.get(type) as UcsTypeEntry<T, TSchema> | undefined;

    if (!typeEntry) {
      typeEntry = new UcsTypeEntry(this.schemaIndex);
      this.#perType.set(type, typeEntry);
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
      generatorFor: this.#generatorFor.bind(this),
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

  #generatorFor<T, TSchema extends UcSchema<T>>(
    schema: TSchema,
  ): UcsGenerator<T, TSchema> | undefined {
    return this.#typeEntryFor<T, TSchema>(schema.type).generatorFor(schema);
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

export interface UcsModels {
  readonly [writer: string]: UcModel;
}

export type UcsExports<out TModels extends UcsModels> = {
  readonly [writer in keyof TModels]: UcSerializer<UcInfer<TModels[writer]>>;
};

class UcsTypeEntry<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schemaIndex: UccSchemaIndex;
  readonly #perSchema = new Map<string, UcsGenerator<T, TSchema>>();
  #generator: UcsGenerator<T, TSchema> | undefined;

  constructor(schemaIndex: UccSchemaIndex) {
    this.#schemaIndex = schemaIndex;
  }

  useGenerator(generator: UcsGenerator<T, TSchema>): void {
    this.#generator = generator;
  }

  useGeneratorFor(schema: TSchema, generator: UcsGenerator<T, TSchema>): void {
    const schemaId = this.#schemaIndex.schemaId(schema);

    this.#perSchema.set(schemaId, generator);
  }

  generatorFor(schema: TSchema): UcsGenerator<T, TSchema> | undefined {
    const schemaId = this.#schemaIndex.schemaId(schema);

    return this.#perSchema.get(schemaId) ?? this.#generator;
  }

}
