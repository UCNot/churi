import { capitalize } from '../../impl/capitalize.js';
import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/uc-list.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { BaseUcrxTemplate } from '../rx/base.ucrx-template.js';
import { CustomUcrxTemplate } from '../rx/custom.ucrx-template.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcrxArgs } from '../rx/ucrx.args.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdLib } from './ucd-lib.js';

export class ListUcdDef<
  TItem = unknown,
  TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>,
> extends CustomUcrxTemplate<TItem[], UcList.Schema<TItem, TItemSpec>> {

  static get type(): string | UcSchema.Class {
    return 'list';
  }

  static createTemplate<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
    lib: UcdLib,
    schema: UcList.Schema<TItem, TItemSpec>,
  ): UcrxTemplate<TItem[], UcList.Schema<TItem, TItemSpec>> {
    return schema.createTemplate?.(lib, schema) ?? new this(lib, schema);
  }

  #itemTemplate?: UcrxTemplate;
  #allocation?: ListUcdDef.Allocation;

  constructor(lib: UcdLib, schema: UcList.Schema<TItem, TItemSpec>) {
    super({
      lib,
      schema,
      className: capitalize(ucSchemaSymbol(schema)) + 'Ucrx',
      args: ['set', 'context'],
    });
  }

  get base(): BaseUcrxTemplate {
    return this.#isMatrix ? this.lib.voidUcrx : this.#getItemTemplate();
  }

  protected override callSuperConstructor(
    base: BaseUcrxTemplate,
    args: UcrxArgs.ByName,
  ): UccCode.Source<UccCode> | undefined {
    const { addItem } = this.#getAllocation();

    if (this.#isMatrix) {
      return;
    }

    return `super(${base.args.call({ ...args, set: `item => this.${addItem.name}(item)` })});`;
  }

  protected override declareConstructor(args: UcrxArgs.ByName): UccCode.Source<UccCode>;
  protected override declareConstructor({
    set,
    context,
  }: UcrxArgs.ByName): UccCode.Source<UccCode> {
    return code => {
      const { context: contextVar, setList } = this.#getAllocation();

      code.write(`${contextVar} = ${context};`);

      if (!this.#isMatrix) {
        code.write(`${setList} = ${set};`);
      }
    };
  }

  protected override declareMethods(): UcrxTemplate.MethodDecls | undefined {
    const allocation = this.#getAllocation();

    return this.#isMatrix
      ? this.#declareMatrixMethods(allocation)
      : this.#declareListMethods(allocation);
  }

  get #isNullableList(): boolean | undefined {
    return this.schema.nullable;
  }

  get #isNullableItem(): boolean | undefined {
    return this.schema.item.nullable;
  }

  get #isNullable(): boolean | undefined {
    return this.#isNullableList || this.#isNullableItem;
  }

  get #isMatrix(): boolean {
    return !!this.#getItemTemplate().definedMethods.ls;
  }

  #getAllocation(): ListUcdDef.Allocation {
    if (this.#allocation) {
      return this.#allocation;
    }

    const items = this.declarePrivate('items', '[]');

    return (this.#allocation = {
      context: this.declarePrivate('context'),
      setList: this.#isMatrix ? 'this.set' : this.declarePrivate('setList'),
      items,
      addItem: this.declarePrivateMethod(
        'addItem',
        new UccArgs('item'),
        ({ item }) => `${items}.push(${item})`,
      ),
      listCreated: this.declarePrivate('listCreated', '0'),
      isNull: this.#isNullableList ? this.declarePrivate('isNull', '0') : undefined,
    });
  }

  #getItemTemplate(): BaseUcrxTemplate {
    if (this.#itemTemplate) {
      return this.#itemTemplate;
    }

    const {
      schema: { item },
    } = this;

    try {
      return (this.#itemTemplate = this.lib.ucrxTemplateFor(item));
    } catch (cause) {
      throw new UnsupportedUcSchemaError(
        item,
        `${ucSchemaName(this.schema)}: Can not deserialize list item of type "${ucSchemaName(
          item,
        )}"`,
        { cause },
      );
    }
  }

  #declareListMethods({
    context,
    setList,
    items,
    listCreated,
    isNull,
  }: ListUcdDef.ListAllocation): UcrxTemplate.MethodDecls {
    const { lib } = this;
    const ucrxUnexpectedSingleItemError = lib.import(CHURI_MODULE, 'ucrxUnexpectedSingleItemError');
    const ucrxUnexpectedNullError = lib.import(CHURI_MODULE, 'ucrxUnexpectedNullError');

    return {
      em: _location => code => {
        code.write(`return ${listCreated} = 1;`);
      },
      ls: _location => code => {
        if (isNull) {
          code
            .write(`if (${isNull}) {`)
            .indent(`${setList}(null);`)
            .write(`} else if (${listCreated}) {`);
        } else {
          code.write(`if (${listCreated}) {`);
        }

        code
          .indent(`${setList}(${items});`)
          .write(`} else {`)
          .indent(`${context}.error(${ucrxUnexpectedSingleItemError}(this));`)
          .write(`}`);
      },
      nul: isNull
        ? _location => code => {
            code
              .write(`if (${listCreated}) {`)
              .indent(code => {
                code.write(`${isNull} = 0;`);
                if (this.#isNullableItem) {
                  code.write(`return super.nul();`);
                } else {
                  code.write(`${context}.error(${ucrxUnexpectedNullError}(this));`);
                }
              })
              .write(`}`)
              .write(`return ${isNull} = 1;`);
          }
        : undefined,
    };
  }

  #declareMatrixMethods({
    context,
    items,
    addItem,
    listCreated,
    isNull,
  }: ListUcdDef.MatrixAllocation): UcrxTemplate.MethodDecls {
    const { lib } = this;
    const ucrxUnexpectedNullError = lib.import(CHURI_MODULE, 'ucrxUnexpectedNullError');

    return {
      nls: _location => code => {
        const itemTemplate = this.#getItemTemplate();

        code.write(
          itemTemplate.newInstance({
            args: { set: `this.${addItem.name}.bind(this)`, context },
            prefix: `return `,
            suffix: ';',
          }),
        );
      },
      em: _location => code => {
        if (this.#isNullableItem && this.#isNullableList) {
          code
            .write(`if (!${listCreated}) {`)
            .indent(code => {
              code
                .write(`${listCreated} = 1;`)
                .write(`if (${isNull}) {`)
                .indent(`${items}.push(null);`)
                .write(`}`);
            })
            .write(`}`)
            .write(`return 1;`);
        } else {
          code.write(`return ${listCreated} = 1;`);
        }
      },
      ls: _location => code => {
        if (this.#isNullableList) {
          code
            .write(`if (${isNull}) {`)
            .indent(`this.set(null);`)
            .write(`} else if (${listCreated}) {`);
        } else {
          code.write(`if (${listCreated}) {`);
        }
        code.indent(`this.set(${items});`).write(`}`);
      },
      nul: this.#isNullable
        ? _location => code => {
            code
              .write(`if (${listCreated}) {`)
              .indent(code => {
                if (this.#isNullableList && !this.#isNullableItem) {
                  code.write(`${isNull} = 1;`);
                }
                if (this.#isNullableItem) {
                  code.write(`${items}.push(null);`);
                } else {
                  code.write(`${context}.error(${ucrxUnexpectedNullError}(this));`);
                }
              })
              .write(`} else {`)
              .indent(code => {
                if (this.#isNullableList) {
                  code.write(`${isNull} = 1;`);
                } else {
                  code.write(`${context}.error(${ucrxUnexpectedNullError}(this));`);
                }
              })
              .write(`}`)
              .write(`return 1;`);
          }
        : undefined,
    };
  }

}

export namespace ListUcdDef {
  export type Allocation = MatrixAllocation | ListAllocation;

  export interface ListAllocation {
    readonly context: string;
    readonly setList: string;
    readonly items: string;
    readonly listCreated: string;
    readonly addItem: UccMethod<'item'>;
    readonly isNull?: string | undefined;
  }

  export interface MatrixAllocation {
    readonly context: string;
    readonly setList: string;
    readonly items: string;
    readonly listCreated: string;
    readonly addItem: UccMethod<'item'>;
    readonly isNull?: string | undefined;
  }
}
