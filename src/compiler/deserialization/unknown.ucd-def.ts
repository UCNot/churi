import { UcList, ucList } from '../../schema/uc-list.js';
import { UcMap, ucMap } from '../../schema/uc-map.js';
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
    const listSpec = ucList(this.schema, { id: anyList });
    const mapSpec = ucMap({}, { id: anyMap, extra: this.schema });

    return {
      context: this.declarePrivate('context'),
      addItem: this.declarePrivate('addItem'),
      listRx: this.declarePrivate('listRx'),
      mapRx: this.declarePrivate('mapRx'),
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

  protected override overrideMethods(): UcrxTemplate.MethodDecls {
    return {
      ...Object.values<UcrxMethod<any>>(UcrxCore)
        .filter(method => method.key !== 'set' && method.key !== 'any' && isUcrxSetter(method))
        .map(setter => this.#declareMethod(setter)),
      for: this.#declareFor.bind(this),
      map: this.#declareMap.bind(this),
      em: this.#declareEm.bind(this),
      ls: this.#declareLs.bind(this),
      any: this.#declareAny.bind(this),
      custom: this.lib.voidUcrx.customMethods.map(method => ({
        method,
        body: this.#declareMethod(method),
      })),
    };
  }

  #declareFor({ key }: UccArgs.ByName<'key'>): UccCode.Source {
    const { context, mapRx, mapTemplate } = this.#getAllocation();

    return code => {
      code.write(
        `${mapRx} ??= ` + mapTemplate.newInstance({ set: `this.set.bind(this)`, context }) + ';',
        `return ${mapRx}.for(${key});`,
      );
    };
  }

  #declareMap(): UccCode.Source {
    const { mapRx } = this.#getAllocation();

    return `${mapRx}.map();`;
  }

  #declareEm(): UccCode.Source {
    const { context, addItem, listRx, listTemplate } = this.#getAllocation();

    return code => {
      code
        .write(`if (!${listRx}) {`)
        .indent(code => {
          code
            .write(
              `${listRx} = `
                + listTemplate.newInstance({ set: `this.set.bind(this)`, context })
                + ';',
            )
            .write(`${addItem}?.();`)
            .write(`${listRx}.em();`);
        })
        .write(`}`)
        .write('return 1;');
    };
  }

  #declareLs(): UccCode.Source {
    const { listRx } = this.#getAllocation();

    return `${listRx}.ls();`;
  }

  #declareAny({ value }: UccArgs.ByName<UcrxSetter.Arg>): UccCode.Source {
    return `return this.set(${value})`;
  }

  #declareMethod<TArg extends string>(method: UcrxMethod<TArg>): UccMethod.Body<TArg> {
    return args => {
      const { addItem, listRx } = this.#getAllocation();

      return code => {
        const call = `${method.key}(${method.args.call(args)})`;

        code
          .write(`if (${listRx}) {`)
          .indent(`return ${listRx}.${call};`)
          .write(`}`)
          .write(code => {
            code.write(`${addItem} = () => ${listRx}.${call};`, `return super.${call};`);
          });
      };
    };
  }

}

interface UnknownUcdDef$Allocation {
  readonly context: string;
  readonly addItem: string;
  readonly listRx: string;
  readonly mapRx: string;
  readonly listTemplate: UcrxTemplate<unknown[], UcList.Schema>;
  readonly mapTemplate: UcrxTemplate<
    Record<string, unknown>,
    UcMap.Schema<Record<string, never>, UcSchema>
  >;
}

// istanbul ignore next
function anyMap(): void {
  // Only used as schema ID.
}

// istanbul ignore next
function anyList(): void {
  // Only used as schema ID.
}
