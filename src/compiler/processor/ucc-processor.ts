import { asArray, lazyValue, mayHaveProperties } from '@proc7ts/primitives';
import { esQuoteKey, esStringLiteral } from 'esgen';
import { UcInstructions } from '../../schema/uc-instructions.js';
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UccConfig } from './ucc-config.js';
import { UccFeature } from './ucc-feature.js';
import { UccSchemaFeature } from './ucc-schema-feature.js';

/**
 * Abstract schema processor.
 *
 * Supports processing {@link UccFeature features}.
 */
export abstract class UccProcessor<TProcessor extends UccProcessor<TProcessor>> {

  readonly #name: keyof UcInstructions;
  readonly #models: readonly UcModel[] | undefined;
  readonly #features: readonly UccFeature<TProcessor, void>[] | undefined;
  readonly #configs = new Map<UccFeature<TProcessor, never>, () => UccConfig<never>>();
  readonly #uses = new Map<UcSchema['type'], UccProcessor$FeatureUse<TProcessor>>();
  #hasPendingInstructions = false;

  constructor(init: UccProcessorInit<TProcessor>);
  constructor({ name, models, features }: UccProcessorInit<TProcessor>) {
    this.#name = name;
    this.#models = models;
    this.#features = features && asArray(features);
  }

  get name(): keyof UcInstructions {
    return this.#name;
  }

  /**
   * Enables the given processing `feature`.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   * @param options - Processing options.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UccFeature<TProcessor, TOptions>, options: TOptions): this;

  /**
   * Enables the given processing `feature` that does not require options.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UccFeature<TProcessor, void>): this;

  /**
   * Enables the given processing `feature`.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   * @param options - Processing options.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UccFeature<TProcessor, TOptions>, options?: TOptions): this {
    let getConfig = this.#configs.get(feature) as (() => UccConfig<TOptions>) | undefined;

    if (!getConfig) {
      getConfig = lazyValue(() => this.createConfig(feature));
      this.#configs.set(feature, getConfig);
    }

    getConfig().configure(options!);

    return this;
  }

  protected createConfig<TOptions>(feature: UccFeature<TProcessor, TOptions>): UccConfig<TOptions> {
    return 'uccProcess' in feature
      ? feature.uccProcess(this as unknown as TProcessor)
      : feature(this as unknown as TProcessor);
  }

  /**
   * Applies model deserialization instructions.
   *
   * @typeParam T - Implied data type.
   * @param model - Target model.
   *
   * @returns `this` instance.
   */
  processModel<T>(model: UcModel<T>): this {
    const schema = ucSchema(model);
    const use = asArray(schema.with?.[this.#name]?.use);

    use.forEach(useFeature => this.#useFeature(schema, useFeature));

    return this;
  }

  #useFeature<TOptions>(
    schema: UcSchema,
    { from, feature, options }: UcInstructions.UseFeature,
  ): void {
    const useId = `${ucSchemaSymbol(schema)}::${from}::${feature}`;
    let use = this.#uses.get(useId) as UccProcessor$FeatureUse<TProcessor, TOptions> | undefined;

    if (!use) {
      this.#hasPendingInstructions = true;
      use = new UccProcessor$FeatureUse(schema, from, feature);
      this.#uses.set(useId, use);
    }

    use.configure(options as TOptions);
  }

  protected async processInstructions(): Promise<void> {
    this.#collectInstructions();
    await this.#processInstructions();
    this.#enableExplicitFeatures();
    await this.#processInstructions(); // More instructions may be added by explicit features.
  }

  #collectInstructions(): void {
    this.#models?.forEach(model => {
      this.processModel(model);
    });
  }

  async #processInstructions(): Promise<void> {
    while (this.#hasPendingInstructions) {
      this.#hasPendingInstructions = false;
      await Promise.all(
        [...this.#uses.values()].map(
          async use => await use.enableIn(this as unknown as TProcessor),
        ),
      );
    }
  }

  #enableExplicitFeatures(): void {
    this.#features?.forEach(feature => {
      this.enable(feature, undefined);
    });
  }

}

export interface UccProcessorInit<TProcessor extends UccProcessor<TProcessor>> {
  readonly name: keyof UcInstructions;
  readonly models?: readonly UcModel[] | undefined;
  readonly features?:
    | UccFeature<TProcessor, void>
    | readonly UccFeature<TProcessor, void>[]
    | undefined;
}

class UccProcessor$FeatureUse<in TProcessor extends UccProcessor<TProcessor>, TOptions = unknown> {

  readonly #schema: UcSchema;
  readonly #from: string;
  readonly #name: string;
  readonly #options: TOptions[] = [];
  #enabled = false;

  constructor(schema: UcSchema, from: string, name: string) {
    this.#schema = schema;
    this.#from = from;
    this.#name = name;
  }

  configure(options: TOptions): void {
    this.#options.push(options);
  }

  async enableIn(processor: TProcessor): Promise<void> {
    if (this.#enabled) {
      return;
    }

    this.#enabled = true;

    const {
      [this.#name]: feature,
    }: { [name: string]: UccFeature<TProcessor, unknown> | UccSchemaFeature<TProcessor, unknown> } =
      await import(this.#from);

    if (mayHaveProperties(feature)) {
      let configured = false;

      if ('uccProcess' in feature) {
        for (const options of this.#options) {
          processor.enable(feature, options);
        }
        configured = true;
      }
      if ('uccProcessSchema' in feature) {
        this.#configure(feature.uccProcessSchema(processor, this.#schema));
        configured = true;
      }

      if (configured) {
        return;
      }

      if (typeof feature === 'function') {
        this.#configure(feature(processor, this.#schema));

        return;
      }
    }

    if (feature === undefined) {
      throw new ReferenceError(`No such schema processing feature: ${this}`);
    }

    throw new ReferenceError(`Not a schema processing feature: ${this}`);
  }

  #configure(config: UccConfig<TOptions>): void {
    for (const options of this.#options) {
      config.configure(options);
    }
  }

  toString(): string {
    return `import(${esStringLiteral(this.#from)}).${esQuoteKey(this.#name)}`;
  }

}
