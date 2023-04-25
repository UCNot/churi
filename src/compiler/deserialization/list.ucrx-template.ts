import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/list/uc-list.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcModel } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { ucUcSchemaVariant } from '../impl/uc-schema.variant.js';
import { BaseUcrxTemplate } from '../rx/base.ucrx-template.js';
import { CustomUcrxTemplate } from '../rx/custom.ucrx-template.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcrxArgs } from '../rx/ucrx.args.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdLib } from './ucd-lib.js';
import { UcdSetup } from './ucd-setup.js';

export class ListUcrxTemplate<
  TItem = unknown,
  TItemModel extends UcModel<TItem> = UcModel<TItem>,
> extends CustomUcrxTemplate<TItem[], UcList.Schema<TItem, TItemModel>> {

  static configureSchemaDeserializer(setup: UcdSetup, { item }: UcList.Schema): void {
    setup.useUcrxTemplate('list', (lib, schema: UcList.Schema) => new this(lib, schema));
    setup.processModel(item);
  }

  #typeName?: string;
  #itemTemplate?: UcrxTemplate;
  #allocation?: ListUcrxTemplate.Allocation;

  constructor(lib: UcdLib, schema: UcList.Schema<TItem, TItemModel>) {
    super({
      lib,
      schema,
      args: ['set', 'context'],
    });
  }

  override get base(): BaseUcrxTemplate {
    return this.#isMatrix ? this.lib.voidUcrx : this.#getItemTemplate();
  }

  override get typeName(): string {
    return (this.#typeName ??=
      'List' + ucUcSchemaVariant(this.schema) + 'Of' + this.#getItemTemplate().typeName);
  }

  override get permitsSingle(): boolean {
    return false;
  }

  protected override discoverTypes(): Set<string> {
    if (!this.#isMatrix || this.#getItemTemplate().permitsSingle) {
      return new Set(this.#getItemTemplate().expectedTypes);
    }

    return super.discoverTypes();
  }

  protected override callSuperConstructor(
    base: BaseUcrxTemplate,
    args: UcrxArgs.ByName,
  ): UccSource | undefined {
    const { addItem } = this.#getAllocation();

    if (this.#isMatrix) {
      return;
    }

    return `super(${base.args.call({
      ...args,
      set: `item => ${addItem.call('this', { item: 'item' })}`,
    })});`;
  }

  protected override declareConstructor(args: UcrxArgs.ByName): UccSource;
  protected override declareConstructor({ set, context }: UcrxArgs.ByName): UccSource {
    return code => {
      const { context: contextVar, setList } = this.#getAllocation();

      code.write(`${contextVar} = ${context};`);

      if (!this.#isMatrix) {
        code.write(`${setList} = ${set};`);
      }
    };
  }

  protected override overrideMethods(): UcrxTemplate.MethodDecls | undefined {
    const allocation = this.#getAllocation();

    return allocation.isMatrix
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
    return !!this.#getItemTemplate().definedMethods.and;
  }

  #getAllocation(): ListUcrxTemplate.Allocation {
    if (this.#allocation) {
      return this.#allocation;
    }

    const isMatrix = this.#isMatrix;
    const context = this.declarePrivate('context');
    const items = this.declarePrivate('items', '[]');
    const addItem = this.declarePrivateMethod(
      'addItem',
      new UccArgs('item'),
      ({ item }) => `${items}.push(${item})`,
    );
    const listCreated = this.declarePrivate('listCreated', '0');
    const isNull = this.#isNullableList ? this.declarePrivate('isNull', '0') : undefined;

    if (isMatrix) {
      const itemTemplate = this.#getItemTemplate();
      const itemRx = this.declarePrivate('_itemRx');

      return (this.#allocation = {
        isMatrix,
        context,
        setList: 'this.set',
        items,
        addItem,
        itemRx: itemTemplate.permitsSingle
          ? this.declarePrivateMethod<''>(
              'itemRx',
              [],
              () => `return ${itemRx} ??= `
                + itemTemplate.newInstance({ set: addItem.bind('this'), context })
                + ';',
            )
          : undefined,
        listCreated,
        isNull,
      });
    }

    return (this.#allocation = {
      isMatrix,
      context,
      setList: this.declarePrivate('setList'),
      items,
      addItem,
      listCreated,
      isNull,
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
        `${ucModelName(this.schema)}: Can not deserialize list item of type "${ucModelName(item)}"`,
        { cause },
      );
    }
  }

  #declareListMethods(allocation: ListUcrxTemplate.ListAllocation): UcrxTemplate.MethodDecls {
    const { context, listCreated, isNull } = allocation;
    const { lib } = this;
    const ucrxUnexpectedSingleItemError = lib.import(CHURI_MODULE, 'ucrxUnexpectedSingleItemError');
    const ucrxUnexpectedNullError = lib.import(CHURI_MODULE, 'ucrxUnexpectedNullError');

    return {
      and: () => code => {
        code.write(`return ${listCreated} = 1;`);
      },
      nul: isNull
        ? () => code => {
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
      end: () => code => {
        if (isNull) {
          code
            .write(`if (${isNull}) {`)
            .indent(this.storeNull(allocation))
            .write(`} else if (${listCreated}) {`);
        } else {
          code.write(`if (${listCreated}) {`);
        }

        code
          .indent(this.storeItems(allocation))
          .write(`} else {`)
          .indent(`${context}.error(${ucrxUnexpectedSingleItemError}(this));`)
          .write(`}`);
      },
    };
  }

  #declareMatrixMethods(allocation: ListUcrxTemplate.MatrixAllocation): UcrxTemplate.MethodDecls {
    const { context, addItem, itemRx, listCreated, isNull } = allocation;
    const itemTemplate = this.#getItemTemplate();

    const coreMethods: {
      [key: string]: UcrxMethod.Body<any> | undefined;
    } = {};
    const custom: UcrxTemplate.Method<any>[] = [];

    if (itemRx) {
      for (const [key, method] of Object.entries(itemTemplate.definedMethods)) {
        if (method) {
          if (key in UcrxCore) {
            coreMethods[key] = this.#delegate(allocation);
          } else {
            custom.push({ method: method.method, body: this.#delegate(allocation) });
          }
        }
      }
    }

    return {
      ...coreMethods,
      nls: () => code => {
        const itemTemplate = this.#getItemTemplate();

        code.write(
          'return '
            + itemTemplate.newInstance({
              set: addItem.bind('this'),
              context,
            })
            + ';',
        );
      },
      and: () => code => {
        code.write(`return ${listCreated} = 1;`);
      },
      end: () => code => {
        if (isNull) {
          code
            .write(`if (${isNull}) {`)
            .indent(this.storeNull(allocation))
            .write(`} else if (${listCreated}) {`);
        } else {
          code.write(`if (${listCreated}) {`);
        }
        code.indent(this.storeItems(allocation)).write(`}`);
      },
      nul: this.#isNullable
        ? () => code => {
            code
              .write(`if (${listCreated}) {`)
              .indent(code => {
                if (this.#isNullableItem) {
                  code.write(this.addNull(allocation), `return 1;`);
                } else {
                  code.write(`return 0;`);
                }
              })
              .write(`}`)
              .write(code => {
                if (isNull) {
                  code.write(`return ${isNull} = 1;`);
                } else {
                  code.write(`return 0;`);
                }
              });
          }
        : undefined,
      custom,
    };
  }

  addNull(allocation: ListUcrxTemplate.Allocation): UccSource;
  addNull({ addItem }: ListUcrxTemplate.Allocation): UccSource {
    return addItem.call('this', { item: 'null' }) + ';';
  }

  storeItems(allocation: ListUcrxTemplate.Allocation): UccSource;
  storeItems({ setList, items }: ListUcrxTemplate.Allocation): UccSource {
    return `${setList}(${items});`;
  }

  storeNull(allocation: ListUcrxTemplate.Allocation): UccSource;
  storeNull({ setList }: ListUcrxTemplate.Allocation): UccSource {
    return `${setList}(null);`;
  }

  #delegate<TArg extends string>({
    itemRx,
    listCreated,
  }: ListUcrxTemplate.MatrixAllocation): UcrxMethod.Body<TArg> {
    return (args, method) => code => {
      code
        .write(`if (${listCreated}) {`)
        .indent(`return ` + method.call(itemRx!.call('this'), args) + ';')
        .write('}')
        .write('return 0;');
    };
  }

}

export namespace ListUcrxTemplate {
  export type Allocation = MatrixAllocation | ListAllocation;

  export interface ListAllocation {
    readonly isMatrix: false;
    readonly context: string;
    readonly setList: string;
    readonly items: string;
    readonly listCreated: string;
    readonly addItem: UccMethod<'item'>;
    readonly isNull?: string | undefined;
  }

  export interface MatrixAllocation {
    readonly isMatrix: true;
    readonly context: string;
    readonly setList: string;
    readonly items: string;
    readonly listCreated: string;
    readonly addItem: UccMethod<'item'>;
    readonly itemRx: UccMethod<''> | undefined;
    readonly isNull?: string | undefined;
  }
}