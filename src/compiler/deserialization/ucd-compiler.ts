import { PromiseResolver } from '@proc7ts/async';
import { asArray, asis } from '@proc7ts/primitives';
import {
  EsBundle,
  EsDeclarationContext,
  EsEvaluationOptions,
  EsFunction,
  EsGenerationOptions,
  EsScopeSetup,
  EsSnippet,
  EsSymbol,
  esEvaluate,
  esGenerate,
  esStringLiteral,
  esline,
} from 'esgen';
import { capitalize } from 'httongue';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCapability } from '../bootstrap/ucc-capability.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxProcessor } from '../rx/ucrx-processor.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';
import { UcdHandlerRegistry } from './impl/ucd-handler-registry.js';
import { UcdHandlerFeature } from './ucd-handler-feature.js';
import { UcdLib } from './ucd-lib.js';
import { UcdExports, UcdModels } from './ucd-models.js';
import { ucdProcessDefaults } from './ucd-process-defaults.js';
import { UcdSetup } from './ucd-setup.js';

/**
 * Compiler of schema {@link churi!UcDeserializer deserializers}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcdCompiler<out TModels extends UcdModels = UcdModels>
  extends UcrxProcessor<UcdSetup>
  implements UcdSetup {

  readonly #options: UcdCompiler.Options<TModels>;

  readonly #entities: UcdHandlerRegistry;
  readonly #formats: UcdHandlerRegistry;
  readonly #meta: UcdHandlerRegistry;

  readonly #internalModels: UcdLib.InternalModel[] = [];

  #bootstrapped = false;

  /**
   * Constructs deserializer compiler.
   *
   * @param options - Compiler options.
   */
  constructor(options: UcdCompiler.Options<TModels>) {
    const { validate = true } = options;

    super({
      ...options,
      processors: validate ? ['validator', 'deserializer'] : ['deserializer'],
    });

    this.#options = options;
    this.#entities = new UcdHandlerRegistry('defaultEntities');
    this.#formats = new UcdHandlerRegistry('defaultFormats');
    this.#meta = new UcdHandlerRegistry('defaultMeta');
  }

  protected override createSetup(): UcdSetup {
    return this;
  }

  override createConfig<TOptions>(feature: UccFeature<UcdSetup, TOptions>): UccConfig<TOptions> {
    if (feature === ucdProcessDefaults) {
      return this.#enableDefault() as UccConfig<TOptions>;
    }

    return super.createConfig(feature);
  }

  #enableDefault(): UccConfig {
    return {
      configure: () => this.#configureDefaults(),
    };
  }

  #configureDefaults(): void {
    const defaultConfig = ucdProcessDefaults(this);

    this.#entities.configureDefaults();
    this.#formats.configureDefaults();
    this.#meta.configureDefaults();

    // Stop registering default handlers.
    // Start registering custom ones.
    defaultConfig.configure!(undefined);

    this.#entities.makeDefault();
    this.#formats.makeDefault();
    this.#meta.makeDefault();
  }

  compileSchema<T>(
    schema: UcSchema<T>,
    whenCompiled: (
      /**
       * Compiled charge receiver class.
       */
      ucrxClass: UcrxClass<UcrxSignature.Args, T>,
    ) => void,
  ): this {
    this.#internalModels.push({ schema, whenCompiled });

    return this;
  }

  handleEntity(entity: string, feature: UcdHandlerFeature): this {
    this.#entities.addHandler(entity, feature);

    return this;
  }

  handleFormat(format: string, feature: UcdHandlerFeature): this {
    this.#formats.addHandler(format, feature);

    return this;
  }

  handleMeta(attribute: string, feature: UcdHandlerFeature): this {
    this.#meta.addHandler(attribute, feature);

    return this;
  }

  parseMetaValue<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    attribute: string,
    schema: TSchema,
    set: (
      this: void,
      args: {
        readonly cx: EsSnippet;
        readonly rx: EsSnippet;
        readonly value: EsSnippet;
      },
      context: EsDeclarationContext,
    ) => EsSnippet = ({ cx, value }) => esline`${cx}.meta.add(${esStringLiteral(attribute)}, ${value});`,
  ): this {
    const whenUcrxClass = new PromiseResolver<UcrxClass>();
    const handleAttr = new EsFunction(
      `handle${capitalize(attribute)}Attr`,
      {
        cx: {},
        rx: {},
        attr: {},
      },
      {
        declare: {
          at: 'bundle',
          body:
            ({ args: { cx, rx } }, context) => async (code, { ns }) => {
              const value = ns.addSymbol(new EsSymbol('$'), asis);
              const ucrxClass = await whenUcrxClass.whenDone();

              code
                .write(esline`return new ${ucrxClass}(${value} => {`)
                .indent(set({ cx, rx, value }, context))
                .write('});');
            },
        },
      },
    );

    this.compileSchema(schema, ucrxClass => {
      whenUcrxClass.resolve(ucrxClass);
    });

    return this.handleMeta(attribute, setup => setup.register(handleAttr));
  }

  /**
   * Generates deserialization code.
   *
   * @param options - Code generation options.
   * @param snippets - Additional code snippets.
   *
   * @returns Promise resolved to deserializer module text.
   */
  async generate(options: EsGenerationOptions = {}, ...snippets: EsSnippet[]): Promise<string> {
    return await esGenerate(
      {
        ...options,
        setup: [...asArray(options.setup), await this.bootstrap()],
      },
      ...snippets,
    );
  }

  /**
   * Generates serialization code and evaluates it.
   *
   * @param options - Code evaluation options.
   * @param snippets - Additional code snippets.
   *
   * @returns Promise resolved to deserializers exported from generated module.
   */
  async evaluate(
    options: EsEvaluationOptions = {},
    ...snippets: EsSnippet[]
  ): Promise<UcdExports<TModels>> {
    return (await esEvaluate(
      {
        ...options,
        setup: [...asArray(options.setup), await this.bootstrap()],
      },
      ...snippets,
    )) as UcdExports<TModels>;
  }

  /**
   * Bootstraps deserializer library.
   *
   * Enables configured {@link enable deserialization features}, bootstraps {@link bootstrapOptions library options},
   * then creates library with that options.
   *
   * @returns Promise resolved to bundle setup.
   */
  async bootstrap(): Promise<EsScopeSetup<EsBundle>> {
    const options = await this.bootstrapOptions();

    return {
      esSetupScope(context) {
        const lib = new UcdLib(context.scope, options);

        context.set(UcrxLib, lib);
        context.set(UcdLib, lib);
      },
    };
  }

  /**
   * Bootstraps deserializer library options.
   *
   * Enables configured {@link enable deserialization features}.
   *
   * @returns Promise resolved to deserializer library options.
   */
  async bootstrapOptions(): Promise<UcdLib.Options<TModels>> {
    await this.#bootstrap();

    return {
      ...this.#options,
      ...this.createUcrxLibOptions(),
      schemaIndex: this.schemaIndex,
      internalModels: this.#internalModels,
      entities: this.#entities.declare(),
      formats: this.#formats.declare(),
      meta: this.#meta.declare(),
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
      this.enable(ucdProcessDefaults);
    }
  }

}

export namespace UcdCompiler {
  export interface Options<out TModels extends UcdModels = UcdModels>
    extends Omit<UcrxLib.Options, 'methods'> {
    readonly presentations?: UcPresentationName | UcPresentationName[] | undefined;
    readonly capabilities?:
      | UccCapability<UcdSetup>
      | readonly UccCapability<UcdSetup>[]
      | undefined;
    readonly models: TModels;
    readonly validate?: boolean | undefined;
    readonly features?: UccFeature<UcdSetup> | readonly UccFeature<UcdSetup>[] | undefined;
    readonly exportDefaults?: boolean | undefined;
  }
}
