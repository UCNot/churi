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
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxBeforeMod, UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';

export class UnknownUcrxClass extends UcrxClass {

  static uccProcess(setup: UcrxSetup): UccConfig {
    return {
      configureSchema: schema => {
        setup
          .useUcrxClass('unknown', (lib, schema) => new this(lib, schema))
          .processModel(this.listSchemaFor(schema))
          .processModel(this.mapSchemaFor(schema));
      },
    };
  }

  static listSchemaFor(schema: UcSchema): UcList.Schema {
    return ucList(schema);
  }

  static mapSchemaFor(schema: UcSchema): UcMap.Schema<UcMap.EntriesModel, UcSchema> {
    return ucMap<UcMap.EntriesModel, UcSchema>({}, { extra: schema });
  }

  readonly #listClass: () => UcrxClass;
  readonly #mapClass: () => UcrxClass;

  readonly #listRx: EsFieldHandle;
  readonly #mapRx: EsFieldHandle;
  readonly #setMap: EsMethodHandle<{ map: EsArg; cx: EsArg }>;

  constructor(lib: UcrxLib, schema: UcSchema) {
    super({
      lib,
      typeName: schema.nullable ? 'Any' : 'NonNull',
      schema,
      baseClass: lib.baseUcrx,
      classConstructor: {
        args: UcrxSignature,
      },
    });
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
            args: { set },
          },
        }) => code => {
          code.line('super', this.baseClass!.classConstructor.signature.call({ set }), ';');
        },
    });
  }

  #declareSetMap(): EsMethodHandle<{ map: EsArg; cx: EsArg }> {
    return new EsMethod('setMap', {
      visibility: EsMemberVisibility.Private,
      args: { map: {}, cx: {} },
    }).declareIn(this, {
      body:
        ({
          member: {
            args: { map, cx },
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
                .indent(esline`${listRx}.map(${cx});`)
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
    UcrxCore.nls.overrideIn(this, {
      body: ({
        member: {
          args: { cx },
        },
      }) => esline`return ${this.#listRx.get('this')}.nls(${cx});`,
    });
  }

  #declareNul(): void {
    if (this.schema.nullable) {
      this.#declareMethod(UcrxCore.nul);
    } else {
      UcrxCore.nul.overrideIn(this, {
        body:
          ({
            member: {
              args: { cx },
            },
          }) => code => {
            const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');

            code.write(esline`return ${cx}.reject(${ucrxRejectNull}(this));`);
          },
      });
    }
  }

  #declareFor(): void {
    UcrxCore.for.overrideIn(this, {
      body:
        ({
          member: {
            args: { key, cx },
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
                set: esline`map => ${this.#setMap.call('this', { map: 'map', cx })}`,
              }),
              ';',
            )
            .write(esline`return ${mapRx}.for(${key}, ${cx});`);
        },
    });
  }

  #declareMap(): void {
    UcrxCore.map.overrideIn(this, {
      body:
        ({
          member: {
            args: { cx },
          },
        }) => code => {
          const listRx = this.#listRx.get('this');
          const mapRx = this.#mapRx.get('this');
          const res = new EsVarSymbol('res');

          code
            .write(esline`if (${mapRx}) {`)
            .indent(
              res.declare({ value: () => esline`${mapRx}.map(${cx})` }),
              esline`${this.#mapRx.set('this', 'undefined')};`,
              esline`return ${res};`,
            )
            .write(`}`)
            .write(esline`if (${listRx}) {`)
            .indent(esline`return ${listRx}.map(${cx});`)
            .write(`}`)
            .write(
              esline`return ${this.#mapClass().instantiate({
                set: `this.set.bind(this)`,
              })}.map(${cx});`,
            );
        },
    });
  }

  #declareAnd(): void {
    UcrxCore.and.overrideIn(this, {
      body:
        ({
          member: {
            args: { cx },
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
                    }),
                  ),
                  ';',
                )
                .write(esline`${listRx}.and(${cx});`);
            })
            .write(`}`)
            .write('return 1;');
        },
    });
  }

  #declareEnd(): void {
    UcrxCore.end.overrideIn(this, {
      body: ({
        member: {
          args: { cx },
        },
      }) => esline`${this.#listRx.get('this')}?.end(${cx});`,
    });
  }

  #declareAny(): void {
    UcrxCore.any.overrideIn(this, {
      body: ({
        member: {
          args: { value },
        },
      }) => esline`return this.set(${value});`,
    });
  }

  #declareMethod<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    method: UcrxMethod<TArgs, TMod>,
  ): void {
    method.overrideIn(this, {
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
      if (
        !declared
        && member instanceof UcrxMethod
        && member !== UcrxCore.ins
        && member !== UcrxCore.raw
      ) {
        this.#declareMethod(member);
      }
    }
  }

  protected addItem<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    method: UcrxMethod<TArgs, TMod>,
    listRx: EsSnippet,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet {
    return esline`return ${this.member(method).call(listRx, args)};`;
  }

  protected setValue<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    method: UcrxMethod<TArgs, TMod>,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet {
    return esline`return ${this.member(method).call('super', args)};`;
  }

}
