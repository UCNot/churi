import { asArray } from '@proc7ts/primitives';
import { CHURI_MODULE, DEFAULT_ENTITIES_MODULE } from '../../impl/module-names.js';
import { escapeJsString } from '../../impl/quote-property-key.js';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcSchemaResolver } from '../../schema/uc-schema-resolver.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcLexer } from '../../syntax/uc-lexer.js';
import { UccCode, UccFragment, UccSource } from '../codegen/ucc-code.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UcSchema$Variant, UcSchema$variantOf } from '../impl/uc-schema.variant.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { DefaultUcdDefs } from './default.ucd-defs.js';
import { UcdDef } from './ucd-def.js';
import { UcdEntityDef } from './ucd-entity-def.js';
import { UcdEntityPrefixDef } from './ucd-entity-prefix-def.js';
import { UcdFunction } from './ucd-function.js';
import { UcdTypeDef } from './ucd-type-def.js';

export class UcdLib<TSchemae extends UcdLib.Schemae = UcdLib.Schemae> extends UcrxLib {

  readonly #schemae: {
    readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
  };

  readonly #typeDefs: Map<string | UcSchema.Class, UcdTypeDef>;
  readonly #entityDefs: (UcdEntityDef | UcdEntityPrefixDef)[] | undefined;
  readonly #createDeserializer: Exclude<UcdLib.Options<TSchemae>['createDeserializer'], undefined>;
  readonly #deserializers = new Map<string | UcSchema.Class, Map<UcSchema$Variant, UcdFunction>>();
  #entityHandler?: string;

  constructor(options: UcdLib.Options<TSchemae>) {
    const {
      schemae,
      definitions,
      createDeserializer = options => new UcdFunction(options),
    } = options;

    const typeDefs = new Map<string | UcSchema.Class, UcdTypeDef>();
    // Ignore default entity definitions.
    // Precompiled entity handler will be used.
    const entityDefs: (UcdEntityDef | UcdEntityPrefixDef)[] | undefined = definitions
      ? []
      : undefined;
    let methods: UcrxMethod<any>[] | undefined;

    for (const def of asArray(definitions ?? DefaultUcdDefs)) {
      if (def.type) {
        typeDefs.set(def.type, def);
      } else {
        entityDefs?.push(def as UcdEntityDef | UcdEntityPrefixDef);
      }
      if (def.methods) {
        (methods ??= []).push(...asArray(def.methods));
      }
    }

    super({ ...options, methods });

    this.#typeDefs = typeDefs;
    this.#entityDefs = entityDefs;
    this.#schemae = Object.fromEntries(
      Object.entries(schemae).map(([externalName, schemaSpec]) => [
        externalName,
        this.resolver.schemaOf(schemaSpec),
      ]),
    ) as {
      readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
    };

    this.#createDeserializer = createDeserializer;

    for (const [externalName, schema] of Object.entries(this.#schemae)) {
      this.deserializerFor(schema, externalName);
    }
  }

  get entityHandler(): string {
    return (this.#entityHandler ??= this.#createEntityHandler());
  }

  #createEntityHandler(): string {
    const entityDefs = this.#entityDefs;

    if (!entityDefs) {
      // Use precompiled entity handler.
      return this.import(DEFAULT_ENTITIES_MODULE, 'onEntity$byDefault');
    }

    if (!entityDefs.length) {
      // No entities supported.
      return 'undefined';
    }

    // Generate custom entity handler.
    return this.declarations.declare('onEntity$byDefault', (prefix, suffix) => code => {
      code.write(this.createEntityHandler({ entityDefs, prefix, suffix }));
    });
  }

  createEntityHandler({
    entityDefs,
    prefix,
    suffix,
  }: {
    readonly entityDefs: readonly (UcdEntityDef | UcdEntityPrefixDef)[];
    readonly prefix: string;
    readonly suffix: string;
  }): UccSource {
    const EntityUcrxHandler = this.import(CHURI_MODULE, 'EntityUcrxHandler');

    return code => code.write(`${prefix}new ${EntityUcrxHandler}()`).indent(code => {
        entityDefs.forEach((def, index, { length }) => {
          let entity = def.entity ?? def.entityPrefix;

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
            def.createRx({
              lib: this,
              prefix: `${def.entity ? '.addEntity' : '.addPrefix'}(${tokenArray}, `,
              suffix: ')',
            }),
          );

          if (index + 2 > length) {
            code.write(`.toRx()${suffix}`);
          }
        });
      });
  }

  deserializerFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
    externalName?: string,
  ): UcdFunction<T, TSchema> {
    const { id = schema.type } = schema;
    const variant = UcSchema$variantOf(schema);

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
        name: this.ns.name(`${externalName ?? ucSchemaSymbol(schema)}`),
      });
      variants.set(variant, deserializer);
    }

    return deserializer;
  }

  typeDefFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcdTypeDef<T, TSchema> | undefined {
    return this.#typeDefs.get(schema.type) as UcdTypeDef<T, TSchema> | undefined;
  }

  override ucrxTemplateFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate<T, TSchema> {
    return this.deserializerFor<T, TSchema>(schema).template;
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
    return code => code
        .write('return (async () => {')
        .indent(
          this.imports.asDynamic(),
          '',
          this.declarations,
          '',
          this.#returnDeserializers(mode),
        )
        .write('})();');
  }

  #returnDeserializers(mode: UcDeserializer.Mode): UccSource {
    return code => code
        .write('return {')
        .indent(this.#declareDeserializers(mode, mode === 'async' ? 'async ' : '', ','))
        .write('};');
  }

  async #toDeserializers(mode: UcDeserializer.Mode): Promise<UcdLib.Exports<TSchemae>> {
    const code = new UccCode().write(this.#toFactoryCode(mode)).toString();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(code) as () => Promise<UcdLib.Exports<TSchemae>>;

    return await factory();
  }

  compileModule(mode: UcDeserializer.Mode = 'all'): UcdLib.Module<TSchemae> {
    return {
      lib: this,
      toCode: () => this.#toModuleCode(mode),
      print: () => this.#printModule(mode),
    };
  }

  #toModuleCode(mode: UcDeserializer.Mode): UccSource {
    return code => code.write(
        this.imports.asStatic(),
        '',
        this.declarations,
        '',
        this.#exportDeserializers(mode),
      );
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

  #printModule(mode: UcDeserializer.Mode): string {
    return new UccCode().write(this.#toModuleCode(mode)).toString();
  }

}

export namespace UcdLib {
  export interface Options<TSchemae extends Schemae> extends Omit<UcrxLib.Options, 'methods'> {
    readonly schemae: TSchemae;
    readonly resolver?: UcSchemaResolver | undefined;
    readonly definitions?: UcdDef | readonly UcdDef[] | undefined;

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
    print(): string;
  }
}
