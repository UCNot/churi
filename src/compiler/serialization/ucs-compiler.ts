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
  readonly #generators = new Map<string | UcDataType, UcsGenerator>();

  /**
   * Starts serializer setup.
   *
   * @param options - Setup options.
   */
  constructor(options: UcsCompiler.Options<TModels>) {
    const { models, features } = options;

    super({
      tool: 'serializer',
      models: Object.values(models),
      features,
    });

    this.#options = options;
  }

  /**
   * Assigns serialization code generator for the given type.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param type - Target type name or class.
   * @param generator - Assigned generator.
   *
   * @returns `this` instance.
   */
  useUcsGenerator<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    type: TSchema['type'],
    generator: UcsGenerator<T, TSchema>,
  ): this {
    this.#generators.set(type, (fn: UcsFunction, schema: TSchema, args) => {
      const onValue = generator(fn, schema, args);

      return onValue && ucsCheckConstraints(fn, schema, args.value, onValue);
    });

    return this;
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
    this.#enableDefaultFeatures();
    await this.processInstructions();

    const { createSerializer = options => new UcsFunction(options) } = this.#options;

    return {
      ...this.#options,
      generatorFor: this.#generatorFor.bind(this),
      createSerializer,
    };
  }

  #enableDefaultFeatures(): void {
    const { features } = this.#options;

    if (!features) {
      this.enable(ucsSupportDefaults);
    }
  }

  #generatorFor<T, TSchema extends UcSchema<T>>(
    type: TSchema['type'],
  ): UcsGenerator<T, TSchema> | undefined {
    return this.#generators.get(type) as UcsGenerator<T, TSchema> | undefined;
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
