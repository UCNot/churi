import { asArray } from '@proc7ts/primitives';
import { CHURI_MODULE, DEFAULT_ENTITIES_MODULE } from '../../impl/module-names.js';
import { escapeJsString } from '../../impl/quote-property-key.js';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcSchemaResolver } from '../../schema/uc-schema-resolver.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcLexer } from '../../syntax/uc-lexer.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UccCode, UccFragment, UccSource } from '../codegen/ucc-code.js';
import { UccInitLocation } from '../codegen/ucc-declarations.js';
import { UcSchema$Variant, ucUcSchemaVariant } from '../impl/uc-schema.variant.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';
import { UcdFeature, UcdSetup } from './ucd-feature.js';
import { UcdFunction } from './ucd-function.js';
import { ucdSupportDefaults } from './ucd-support-defaults.js';

export class UcdLib<TSchemae extends UcdLib.Schemae = UcdLib.Schemae> extends UcrxLib {

  readonly #schemae: {
    readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
  };

  readonly #types: Map<string | UcSchema.Class, UcrxTemplate.Factory>;
  readonly #entities: UcdLib$EntityConfig[] | undefined;
  readonly #createDeserializer: Exclude<UcdLib.Options<TSchemae>['createDeserializer'], undefined>;
  readonly #deserializers = new Map<string | UcSchema.Class, Map<UcSchema$Variant, UcdFunction>>();
  #entityHandler?: string;

  constructor(options: UcdLib.Options<TSchemae>) {
    const {
      schemae,
      features,
      defaultEntities: defaultEntities = true,
      createDeserializer = options => new UcdFunction(options),
    } = options;

    const types = new Map<string | UcSchema.Class, UcrxTemplate.Factory>();
    // Ignore default entity definitions.
    // Precompiled entity handler will be used.
    const entities: UcdLib$EntityConfig[] | undefined =
      features || !defaultEntities ? [] : undefined;
    const methods = new Set<UcrxMethod<any>>();
    const enabled = new Set<UcdFeature>();

    const enableFeature = (feature: UcdFeature): void => {
      if (!enabled.has(feature)) {
        enabled.add(feature);
        if ('configureDeserializer' in feature) {
          feature.configureDeserializer(setup);
        } else {
          feature(setup);
        }
      }
    };

    const setup: UcdSetup = {
      enable(feature) {
        enableFeature(feature);

        return this;
      },
      useUcrxTemplate(type, factory) {
        types.set(type, factory);

        return this;
      },
      declareUcrxMethod(method) {
        methods.add(method);

        return this;
      },
      handleEntity(entity, feature) {
        entities?.push({ entity, feature });

        return this;
      },
      handleEntityPrefix(entity, feature) {
        entities?.push({ entity, feature, prefix: true });

        return this;
      },
    };

    (features ? asArray(features) : [ucdSupportDefaults]).forEach(enableFeature);

    super({ ...options, methods });

    this.#types = types;
    this.#entities = entities;
    this.#schemae = Object.fromEntries(
      Object.entries(schemae).map(([externalName, schemaSpec]) => [
        externalName,
        this.resolver.schemaOf(schemaSpec),
      ]),
    ) as {
      readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
    };

    this.#createDeserializer = createDeserializer;

    for (const schema of Object.values(this.#schemae)) {
      this.deserializerFor(schema);
    }
  }

  get entityHandler(): string {
    return (this.#entityHandler ??= this.#createEntityHandler());
  }

  #createEntityHandler(): string {
    const entities = this.#entities;

    if (!entities) {
      // Use precompiled entity handler.
      return this.import(DEFAULT_ENTITIES_MODULE, 'onEntity$byDefault');
    }

    if (!entities.length) {
      // No entities supported.
      return 'undefined';
    }

    // Generate custom entity handler.
    return this.declarations.declare('onEntity$byDefault', location => code => {
      code.write(this.createEntityHandler(location));
    });
  }

  createEntityHandler({ prefix, suffix, addDep }: UccInitLocation): UccSource {
    const EntityUcrxHandler = this.import(CHURI_MODULE, 'EntityUcrxHandler');

    return code => {
      code.write(`${prefix}new ${EntityUcrxHandler}()`).indent(code => {
        this.#entities!.forEach(({ entity, feature, prefix }, index, { length }) => {
          if (typeof entity === 'string') {
            entity = UcLexer.scan(entity);
          }

          const tokenArray =
            '['
            + entity
              .map(token => typeof token === 'number' ? token.toString() : `'${escapeJsString(token)}'`)
              .join(', ')
            + ']';

          code.write(
            feature({
              lib: this,
              prefix: `${prefix ? '.addPrefix' : '.addEntity'}(${tokenArray}, `,
              suffix: ')',
              addDep,
            }),
          );

          if (index + 2 > length) {
            code.write(`.toRx()${suffix}`);
          }
        });
      });
    };
  }

  deserializerFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcdFunction<T, TSchema> {
    const { id = schema.type } = schema;
    const variant = ucUcSchemaVariant(schema);

    let variants = this.#deserializers.get(id);

    if (!variants) {
      variants = new Map();
      this.#deserializers.set(id, variants);
    }

    let deserializer = variants.get(variant) as UcdFunction<T, TSchema> | undefined;

    if (!deserializer) {
      deserializer = this.#createDeserializer({
        lib: this as UcdLib,
        schema,
      });
      variants.set(variant, deserializer);
    }

    return deserializer;
  }

  override ucrxTemplateFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate<T, TSchema> {
    return this.deserializerFor<T, TSchema>(schema).template;
  }

  ucrxTemplateFactoryFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate.Factory<T, TSchema> | undefined {
    return this.#types.get(schema.type) as UcrxTemplate.Factory<T, TSchema> | undefined;
  }

  compile(mode: 'async'): UcdLib.AsyncCompiled<TSchemae>;
  compile(mode: 'sync'): UcdLib.SyncCompiled<TSchemae>;
  compile(mode?: UcDeserializer.Mode): UcdLib.Compiled<TSchemae>;

  compile(mode: UcDeserializer.Mode = 'all'): UcdLib.Compiled<TSchemae> {
    return {
      lib: this,
      toCode: () => this.#toFactoryCode(mode),
      toDeserializers: () => this.#toDeserializers(mode),
    };
  }

  #toFactoryCode(mode: UcDeserializer.Mode): UccSource {
    return code => {
      code
        .write('return (async () => {')
        .indent(
          this.imports.asDynamic(),
          '',
          this.declarations,
          '',
          this.#returnDeserializers(mode),
        )
        .write('})();');
    };
  }

  #returnDeserializers(mode: UcDeserializer.Mode): UccSource {
    return code => {
      code
        .write('return {')
        .indent(this.#declareDeserializers(mode, mode === 'async' ? 'async ' : '', ','))
        .write('};');
    };
  }

  async #toDeserializers(mode: UcDeserializer.Mode): Promise<UcdLib.Exports<TSchemae>> {
    const text = await new UccCode().write(this.#toFactoryCode(mode)).toText();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(text) as () => Promise<UcdLib.Exports<TSchemae>>;

    return await factory();
  }

  compileModule(mode: UcDeserializer.Mode = 'all'): UcdLib.Module<TSchemae> {
    return {
      lib: this,
      toCode: () => this.#toModuleCode(mode),
      toText: async () => await this.#toModuleText(mode),
    };
  }

  #toModuleCode(mode: UcDeserializer.Mode): UccSource {
    return code => {
      code.write(
        this.imports.asStatic(),
        '',
        this.declarations,
        '',
        this.#exportDeserializers(mode),
      );
    };
  }

  #exportDeserializers(mode: UcDeserializer.Mode): UccSource {
    return this.#declareDeserializers(
      mode,
      mode === 'async' ? 'export async function ' : 'export function ',
      '',
    );
  }

  #declareDeserializers(mode: UcDeserializer.Mode, fnPrefix: string, fnSuffix: string): UccSource {
    return code => {
      const { opaqueUcrx } = this;

      for (const [externalName, schema] of Object.entries(this.#schemae)) {
        const fn = this.deserializerFor(schema);
        const input = mode === 'async' ? fn.vars.stream : fn.vars.input;
        const options = fn.vars.options;

        code
          .write(
            `${fnPrefix}${externalName}(${input}, { onError, onEntity = ${this.entityHandler} } = {}) {`,
          )
          .indent(code => {
            if (opaqueUcrx) {
              code
                .write(`const ${options} = {`)
                .indent(code => {
                  code.write(
                    'onError,',
                    'onEntity,',
                    `opaqueRx: `
                      + opaqueUcrx.newInstance({
                        set: 'undefined',
                        context: 'undefined',
                      })
                      + ',',
                  );
                })
                .write('};');
            } else {
              code.write(`const ${options} = { onError, onEntity };`);
            }
            code.write(fn.toUcDeserializer(mode, input, options));
          })
          .write(`}${fnSuffix}`);
      }
    };
  }

  async #toModuleText(mode: UcDeserializer.Mode): Promise<string> {
    return await new UccCode().write(this.#toModuleCode(mode)).toText();
  }

}

export namespace UcdLib {
  export interface Options<TSchemae extends Schemae> extends Omit<UcrxLib.Options, 'methods'> {
    readonly schemae: TSchemae;
    readonly resolver?: UcSchemaResolver | undefined;
    readonly features?: UcdFeature | readonly UcdFeature[] | undefined;
    readonly defaultEntities?: boolean | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
  }

  export interface Schemae {
    readonly [reader: string]: UcSchema.Spec;
  }

  export type Exports<TSchemae extends Schemae> = {
    readonly [reader in keyof TSchemae]: UcDeserializer<UcSchema.DataType<TSchemae[reader]>>;
  };

  export type AsyncExports<TSchemae extends Schemae> = {
    readonly [reader in keyof TSchemae]: UcDeserializer.Async<UcSchema.DataType<TSchemae[reader]>>;
  };

  export type SyncExports<TSchemae extends Schemae> = {
    readonly [reader in keyof TSchemae]: UcDeserializer.Sync<UcSchema.DataType<TSchemae[reader]>>;
  };

  export interface Compiled<TSchemae extends Schemae> extends UccFragment {
    readonly lib: UcdLib<TSchemae>;
    toDeserializers(): Promise<Exports<TSchemae>>;
  }

  export interface AsyncCompiled<TSchemae extends Schemae> extends UccFragment {
    readonly lib: UcdLib<TSchemae>;
    toDeserializers(): Promise<AsyncExports<TSchemae>>;
  }

  export interface SyncCompiled<TSchemae extends Schemae> extends UccFragment {
    readonly lib: UcdLib<TSchemae>;
    toDeserializers(): Promise<SyncExports<TSchemae>>;
  }

  export interface Module<TSchemae extends Schemae> extends UccFragment {
    readonly lib: UcdLib<TSchemae>;
    toText(): Promise<string>;
  }
}

interface UcdLib$EntityConfig {
  readonly entity: string | readonly UcToken[];
  readonly feature: UcdEntityFeature;
  readonly prefix?: boolean;
}
