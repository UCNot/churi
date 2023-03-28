import { UcList, ucList } from '../../schema/list/uc-list.js';
import { UcMap, ucMap } from '../../schema/map/uc-map.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { CustomUcrxTemplate } from '../rx/custom.ucrx-template.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxSetter, isUcrxSetter } from '../rx/ucrx-setter.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcrxArgs } from '../rx/ucrx.args.js';

export class UnknownUcdDef extends CustomUcrxTemplate {

  static get type(): string | UcSchema.Class {
    return 'unknown';
  }

  static createTemplate(lib: UcrxLib, schema: UcSchema): UcrxTemplate {
    return new UnknownUcdDef(lib, schema);
  }

  #allocation?: UnknownUcdDef$Allocation;

  constructor(lib: UcrxLib, schema: UcSchema) {
    super({ lib, schema, args: ['set', 'context'] });
  }

  #getAllocation(): UnknownUcdDef$Allocation {
    return (this.#allocation ??= this.#allocate());
  }

  #allocate(): UnknownUcdDef$Allocation {
    const { lib } = this;
    const { resolver } = lib;
    const listSpec = ucList(this.schema);
    const mapSpec = ucMap({}, { extra: this.schema });

    const listRx = this.declarePrivate('listRx');
    const mapRx = this.declarePrivate('mapRx');

    return {
      context: this.declarePrivate('context'),
      listRx,
      mapRx,
      setMap: this.declarePrivateMethod('setMap', ['map'], ({ map }) => code => {
        code
          .write(`if (${listRx}) {`)
          .indent(code => {
            code
              .write(`if (${mapRx} === ${listRx}) {`)
              // Existing list receiver used as map receiver.
              .indent(`${listRx}.map();`)
              .write(`} else {`)
              // List charge started _after_ the map charge start.
              // Add created map to list.
              .indent(`${listRx}.any(${map});`)
              .write(`}`);
          })
          .write('} else {')
          .indent(code => {
            // Store constructed map as single value.
            code.write(`this.set(${map});`);
          })
          .write('}');
      }),
      listTemplate: lib.ucrxTemplateFor(resolver.schemaOf(listSpec)),
      mapTemplate: lib.ucrxTemplateFor(resolver.schemaOf(mapSpec)),
    };
  }

  protected override declareConstructor({ context }: UcrxArgs.ByName): UccCode.Source {
    return code => {
      const { context: varContext } = this.#getAllocation();

      code.write(`${varContext} = ${context};`);
    };
  }

  protected override declareTypes(): UccCode.Source {
    return code => {
      code
        .write('get types() {')
        .indent(this.schema.nullable ? `return ['any'];` : `return ['non-null']`)
        .write('}');
    };
  }

  protected override overrideMethods(): UcrxTemplate.MethodDecls {
    return {
      ...Object.fromEntries(
        Object.entries<UcrxMethod<any>>(UcrxCore)
          .filter(
            ([, method]) => method.preferredKey !== 'set'
              && method.preferredKey !== 'any'
              && isUcrxSetter(method),
          )
          .map(([key, setter]) => [key, this.#declareMethod(setter)]),
      ),
      nls: this.#declareNls.bind(this),
      nul: this.schema.nullable ? this.#declareMethod(UcrxCore.nul) : () => `return 0;`,
      for: this.#declareFor.bind(this),
      map: this.#declareMap.bind(this),
      and: this.#declareAnd.bind(this),
      end: this.#declareEnd.bind(this),
      any: this.#declareAny.bind(this),
      custom: this.lib.voidUcrx.customMethods.map(method => ({
        method,
        body: this.#declareMethod(method),
      })),
    };
  }

  #declareNls(): UccCode.Source {
    const { listRx } = this.#getAllocation();

    return `return ${listRx}.nls()`;
  }

  #declareFor({ key }: UccArgs.ByName<'key'>): UccCode.Source {
    const { context, listRx, mapRx, setMap, mapTemplate } = this.#getAllocation();

    return code => {
      code.write(
        `${mapRx} ??= ${listRx} ?? `
          + mapTemplate.newInstance({ set: setMap.bind('this'), context })
          + ';',
        `return ${mapRx}.for(${key});`,
      );
    };
  }

  #declareMap(): UccCode.Source {
    const { mapRx } = this.#getAllocation();

    return code => {
      code.write(`${mapRx}.map();`, `${mapRx} = undefined;`);
    };
  }

  #declareAnd(): UccCode.Source {
    return code => {
      const { context, listRx, listTemplate } = this.#getAllocation();

      code
        .write(`if (!${listRx}) {`)
        .indent(code => {
          code
            .write(
              `${listRx} = `
                + listTemplate.newInstance({ set: `this.set.bind(this)`, context })
                + ';',
            )
            .write(`${listRx}.and();`);
        })
        .write(`}`)
        .write('return 1;');
    };
  }

  #declareEnd(): UccCode.Source {
    const { listRx } = this.#getAllocation();

    return `${listRx}?.end();`;
  }

  #declareAny({ value }: UccArgs.ByName<UcrxSetter.Arg>): UccCode.Source {
    return `return this.set(${value})`;
  }

  #declareMethod<TArg extends string>(method: UcrxMethod<TArg>): UccMethod.Body<TArg> {
    return args => {
      const { listRx } = this.#getAllocation();

      return code => {
        const uccMethod = method.toMethod(this.lib);

        code
          .write(`if (${listRx}) {`)
          .indent(`return ${uccMethod.call(listRx, args)};`)
          .write(`}`)
          .write(`return ${uccMethod.call('super', args)};`);
      };
    };
  }

}

interface UnknownUcdDef$Allocation {
  readonly context: string;
  readonly listRx: string;
  readonly mapRx: string;
  readonly setMap: UccMethod<'map'>;
  readonly listTemplate: UcrxTemplate<unknown[], UcList.Schema>;
  readonly mapTemplate: UcrxTemplate<
    Record<string, unknown>,
    UcMap.Schema<Record<string, never>, UcSchema>
  >;
}
