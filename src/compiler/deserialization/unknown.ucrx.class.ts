import { lazyValue } from '@proc7ts/primitives';
import {
  EsArg,
  EsField,
  EsFieldHandle,
  EsMemberVisibility,
  EsMethod,
  EsMethodHandle,
  EsSignature,
  EsSnippet,
  EsVarSymbol,
  esline,
} from 'esgen';
import { UcList, ucList } from '../../schema/list/uc-list.js';
import { UcMap, ucMap } from '../../schema/map/uc-map.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { ucSchemaTypeSymbol } from '../impl/uc-schema-symbol.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxClass, UcrxClassSignature } from '../rx/ucrx.class.js';
import { UcdCompiler } from './ucd-compiler.js';

export class UnknownUcrxClass extends UcrxClass {

  static configureSchemaDeserializer(compiler: UcdCompiler.Any, schema: UcSchema): void {
    compiler
      .useUcrxClass('unknown', (lib, schema) => new this(lib, schema))
      .processModel(this.listSchemaFor(schema))
      .processModel(this.mapSchemaFor(schema));
  }

  static listSchemaFor(schema: UcSchema): UcList.Schema {
    return ucList(schema, { id: 'listOf' + ucSchemaTypeSymbol(schema) });
  }

  static mapSchemaFor(schema: UcSchema): UcMap.Schema<UcMap.Schema.Entries.Model, UcSchema> {
    return ucMap<UcMap.Schema.Entries.Model, UcSchema>(
      {},
      { id: 'mapOf' + ucSchemaTypeSymbol(schema), extra: schema },
    );
  }

  readonly #listClass: () => UcrxClass;
  readonly #mapClass: () => UcrxClass;

  readonly #context: EsFieldHandle;
  readonly #listRx: EsFieldHandle;
  readonly #mapRx: EsFieldHandle;
  readonly #setMap: EsMethodHandle<{ map: EsArg; reject: EsArg }>;

  constructor(lib: UcrxLib, schema: UcSchema) {
    super({
      typeName: schema.nullable ? 'Any' : 'NonNull',
      schema,
      baseClass: lib.baseUcrx,
      classConstructor: {
        args: UcrxClassSignature,
      },
    });
    this.#context = new EsField('context', { visibility: EsMemberVisibility.Private }).declareIn(
      this,
    );
    this.#listRx = new EsField('listRx', { visibility: EsMemberVisibility.Private }).declareIn(
      this,
    );
    this.#mapRx = new EsField('mapRx', { visibility: EsMemberVisibility.Private }).declareIn(this);
    this.#setMap = this.#declareSetMap();

    this.#listClass = lazyValue(() => {
      const listSchema = (this.constructor as typeof UnknownUcrxClass).listSchemaFor(this.schema);

      return lib.ucrxClassFor(listSchema);
    });
    this.#mapClass = lazyValue(() => {
      const mapSchema = (this.constructor as typeof UnknownUcrxClass).mapSchemaFor(this.schema);

      return lib.ucrxClassFor(mapSchema);
    });

    this.#declareConstructor();

    this.#declareNls();
    this.#declareNul();
    this.#declareFor();
    this.#declareMap();
    this.#declareAnd();
    this.#declareEnd();
    this.#declareAny();

    this.#overrideRemainingMethods();
  }

  protected override discoverTypes(types: Set<string>): void {
    types.add(this.schema.nullable ? 'any' : 'non-null');
  }

  #declareConstructor(): void {
    this.declareConstructor({
      body:
        ({
          member: {
            args: { set, context },
          },
        }) => code => {
          code
            .line('super', this.baseClass!.classConstructor.signature.call({ set, context }), ';')
            .line(this.#context.set('this', context), ';');
        },
    });
  }

  #declareSetMap(): EsMethodHandle<{ map: EsArg; reject: EsArg }> {
    return new EsMethod('setMap', {
      visibility: EsMemberVisibility.Private,
      args: { map: {}, reject: {} },
    }).declareIn(this, {
      body:
        ({
          member: {
            args: { map, reject },
          },
        }) => code => {
          const listRx = this.#listRx.get('this');
          const mapRx = this.#mapRx.get('this');

          code
            .write(esline`if (${listRx}) {`)
            .indent(code => {
              code
                .write(esline`if (${mapRx} === ${listRx}) {`)
                // Existing list receiver used as map receiver.
                .indent(esline`${listRx}.map(${reject});`)
                .write(`} else {`)
                // List charge started _after_ the map charge start.
                // Add created map to list.
                .indent(esline`${listRx}.any(${map});`)
                .write(`}`);
            })
            .write('} else {')
            .indent(code => {
              // Store constructed map as single value.
              code.write(esline`this.set(${map});`);
            })
            .write('}');
        },
    });
  }

  #declareNls(): void {
    UcrxCore.nls.declareIn(this, {
      body: ({
        member: {
          args: { reject },
        },
      }) => esline`return ${this.#listRx.get('this')}.nls(${reject});`,
    });
  }

  #declareNul(): void {
    if (this.schema.nullable) {
      this.#declareMethod(UcrxCore.nul);
    } else {
      UcrxCore.nul.declareIn(this, {
        body:
          ({
            member: {
              args: { reject },
            },
          }) => code => {
            const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');

            code.write(esline`return ${reject}(${ucrxRejectNull}(this));`);
          },
      });
    }
  }

  #declareFor(): void {
    UcrxCore.for.declareIn(this, {
      body:
        ({
          member: {
            args: { key, reject },
          },
        }) => code => {
          const listRx = this.#listRx.get('this');
          const mapRx = this.#mapRx.get('this');

          code
            .line(
              mapRx,
              ' ??= ',
              listRx,
              ' ?? ',
              this.#mapClass().instantiate({
                set: esline`map => ${this.#setMap.call('this', { map: 'map', reject })}`,
                context: this.#context.get('this'),
              }),
              ';',
            )
            .write(esline`return ${mapRx}.for(${key}, ${reject});`);
        },
    });
  }

  #declareMap(): void {
    UcrxCore.map.declareIn(this, {
      body:
        ({
          member: {
            args: { reject },
          },
        }) => code => {
          const listRx = this.#listRx.get('this');
          const mapRx = this.#mapRx.get('this');
          const res = new EsVarSymbol('res');

          code
            .write(esline`if (${mapRx}) {`)
            .indent(
              res.declare({ value: () => esline`${mapRx}.map(${reject})` }),
              esline`${this.#mapRx.set('this', 'undefined')};`,
              esline`return ${res};`,
            )
            .write(`}`)
            .write(esline`if (${listRx}) {`)
            .indent(esline`return ${listRx}.map(${reject});`)
            .write(`}`)
            .write(
              esline`return ${this.#mapClass().instantiate({
                set: `this.set.bind(this)`,
                context: this.#context.get('this'),
              })}.map(${reject});`,
            );
        },
    });
  }

  #declareAnd(): void {
    UcrxCore.and.declareIn(this, {
      body:
        ({
          member: {
            args: { reject },
          },
        }) => code => {
          const listRx = this.#listRx.get('this');

          code
            .write(esline`if (!${listRx}) {`)
            .indent(code => {
              code
                .line(
                  this.#listRx.set(
                    'this',
                    this.#listClass().instantiate({
                      set: `this.set.bind(this)`,
                      context: this.#context.get('this'),
                    }),
                  ),
                  ';',
                )
                .write(esline`${listRx}.and(${reject});`);
            })
            .write(`}`)
            .write('return 1;');
        },
    });
  }

  #declareEnd(): void {
    UcrxCore.end.declareIn(this, {
      body: ({
        member: {
          args: { reject },
        },
      }) => esline`${this.#listRx.get('this')}?.end(${reject});`,
    });
  }

  #declareAny(): void {
    UcrxCore.any.declareIn(this, {
      body: ({
        member: {
          args: { value },
        },
      }) => esline`return this.set(${value})`,
    });
  }

  #declareMethod<TArgs extends EsSignature.Args>(method: UcrxMethod<TArgs>): void {
    method.declareIn(this, {
      body:
        ({ member: { args } }) => code => {
          const listRx = this.#listRx.get('this');

          code
            .write(esline`if (${listRx}) {`)
            .indent(
              this.addItem(
                method,
                listRx,
                args as EsSignature.ValuesOf<EsSignature.Args> as EsSignature.ValuesOf<TArgs>,
              ),
            )
            .write(`}`)
            .write(
              this.setValue(
                method,
                args as EsSignature.ValuesOf<EsSignature.Args> as EsSignature.ValuesOf<TArgs>,
              ),
            );
        },
    });
  }

  #overrideRemainingMethods(): void {
    for (const { member, declared } of this.members()) {
      if (!declared && member instanceof UcrxMethod) {
        this.#declareMethod(member);
      }
    }
  }

  protected addItem<TArgs extends EsSignature.Args>(
    method: UcrxMethod<TArgs>,
    listRx: EsSnippet,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet {
    return esline`return ${this.member(method).call(listRx, args)};`;
  }

  protected setValue<TArgs extends EsSignature.Args>(
    method: UcrxMethod<TArgs>,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet {
    return esline`return ${this.member(method).call('super', args)};`;
  }

}