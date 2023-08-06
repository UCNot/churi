import {
  EsArg,
  EsField,
  EsFieldHandle,
  EsMemberVisibility,
  EsMethod,
  EsMethodHandle,
  EsProperty,
  EsPropertyHandle,
  EsSignature,
  EsSnippet,
  esline,
} from 'esgen';
import { UcList } from '../../schema/list/uc-list.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcModel } from '../../schema/uc-schema.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UccListOptions } from '../common/ucc-list-options.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { ucSchemaTypeSymbol } from '../impl/uc-schema-symbol.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxBeforeMod, UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';

export class ListUcrxClass<
  TItem = unknown,
  TItemModel extends UcModel<TItem> = UcModel<TItem>,
> extends UcrxClass<UcrxSignature.Args, TItem[], UcList.Schema<TItem, TItemModel>> {

  static uccProcess(boot: UcrxBootstrap): UccConfig<UccListOptions> {
    return {
      configureSchema: (schema: UcList.Schema, options) => {
        boot
          .processModel(schema.item)
          .useUcrxClass(schema, (lib, schema: UcList.Schema) => new this(lib, schema, options));
      },
    };
  }

  readonly #itemClass: UcrxClass;
  readonly #isMatrix: boolean;
  readonly #single: UccListOptions['single'];

  readonly #items: EsFieldHandle;
  readonly #addItem: EsMethodHandle<{ item: EsArg }>;
  readonly #listCreated: EsFieldHandle;
  readonly #isNull: EsFieldHandle | undefined;
  readonly #setList: EsSnippet;
  readonly #setListField: EsFieldHandle | undefined;
  readonly #itemRx: EsPropertyHandle | undefined;

  constructor(
    lib: UcrxLib,
    schema: UcList.Schema<TItem, TItemModel>,
    { single }: UccListOptions = { single: 'reject' },
  ) {
    let itemClass: UcrxClass;

    const { item } = schema;

    try {
      itemClass = lib.ucrxClassFor(item);
    } catch (cause) {
      throw new UnsupportedUcSchemaError(
        item,
        `${ucSchemaTypeSymbol(schema)}: Can not deserialize list item of type "${ucModelName(
          item,
        )}"`,
        { cause },
      );
    }

    const isMatrix = itemClass.isMemberOverridden(UcrxCore.and);

    super({
      lib,
      schema,
      typeName:
        (single === 'reject' || single === 'accept' ? 'List' : 'MultiValue')
        + ucSchemaVariant(schema)
        + 'Of'
        + itemClass.typeName,
      baseClass: isMatrix ? lib.baseUcrx : itemClass,
      classConstructor: {
        args: UcrxSignature,
      },
    });

    this.#itemClass = itemClass;
    this.#isMatrix = isMatrix;
    this.#single = single;

    this.#items = new EsField('items', { visibility: EsMemberVisibility.Private }).declareIn(this, {
      initializer: () => '[]',
    });
    this.#addItem = this.#declareAddItem();
    this.#listCreated = new EsField('listCreated', {
      visibility: EsMemberVisibility.Private,
    }).declareIn(this, { initializer: () => '0' });
    this.#isNull = this.#isNullableList
      ? new EsField('isNull', { visibility: EsMemberVisibility.Private }).declareIn(this, {
          initializer: () => '0',
        })
      : undefined;

    const [setList, setListField] = this.#declareSetList();

    this.#setList = setList;
    this.#setListField = setListField;

    this.#itemRx = this.#declareItemRx();

    this.#declareConstructor();

    if (isMatrix) {
      this.#declareMatrixMethods();
    } else {
      this.#declareListMethods();
    }
  }

  get itemClass(): UcrxClass {
    return this.#itemClass;
  }

  #declareAddItem(): EsMethodHandle<{ item: EsArg }> {
    return new EsMethod('addItem', {
      args: { item: {} },
      visibility: EsMemberVisibility.Private,
    }).declareIn(this, {
      body: ({
        member: {
          args: { item },
        },
      }) => esline`${this.#items.get('this')}.push(${item});`,
    });
  }

  #declareSetList(): [EsSnippet, EsFieldHandle?] {
    if (this.#isMatrix) {
      return [`this.set`];
    }

    const setList = new EsField('setList', { visibility: EsMemberVisibility.Private }).declareIn(
      this,
    );

    return [setList.get('this'), setList];
  }

  #declareItemRx(): EsPropertyHandle | undefined {
    if (!this.#isMatrix || !this.itemClass.permitsSingle) {
      return;
    }

    const itemRxState = new EsField('_itemRx', {
      visibility: EsMemberVisibility.Private,
    }).declareIn(this);

    return new EsProperty('itemRx', { visibility: EsMemberVisibility.Private }).declareIn(this, {
      get: () => esline`return ${itemRxState.get('this')} ??= ${this.itemClass.instantiate({
          set: esline`item => ${this.#addItem.call('this', { item: 'item' })}`,
        })};`,
    });
  }

  #declareConstructor(): void {
    this.declareConstructor({
      body:
        ({
          member: {
            args: { set },
          },
        }) => code => {
          code.line(
            'super',
            this.baseClass!.classConstructor.signature.call({
              set: this.#isMatrix
                ? set
                : esline`item => ${this.#addItem.call('this', { item: 'item' })}`,
            }),
            ';',
          );

          if (this.#setListField) {
            code.line(this.#setListField.set('this', set), ';');
          }
        },
    });
  }

  override get permitsSingle(): boolean {
    return false;
  }

  protected createNullItem(cx: EsSnippet): EsSnippet;
  protected createNullItem(_cx: EsSnippet): EsSnippet {
    return 'null';
  }

  protected createList(_cx: EsSnippet): EsSnippet {
    return this.#items.get('this');
  }

  protected countItems(_cx: EsSnippet): EsSnippet {
    return esline`${this.#items.get('this')}.length`;
  }

  protected createSingle(_cx: EsSnippet): EsSnippet {
    return esline`${this.#items.get('this')}[0]`;
  }

  protected createEmptyList(_cx: EsSnippet): EsSnippet {
    return '[]';
  }

  protected createNullList(cx: EsSnippet): EsSnippet;
  protected createNullList(_cx: EsSnippet): EsSnippet {
    return 'null';
  }

  protected override discoverTypes(types: Set<string>): void {
    if (this.#isMatrix && !this.itemClass.permitsSingle) {
      return super.discoverTypes(types);
    }

    for (const type of this.itemClass.supportedTypes) {
      types.add(type);
    }
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

  #declareListMethods(): void {
    const ucrxRejectSingleItem = UC_MODULE_CHURI.import('ucrxRejectSingleItem');
    const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');
    const listCreated = this.#listCreated;
    const isNull = this.#isNull;

    UcrxCore.and.overrideIn(this, {
      body: () => esline`return ${listCreated.set('this', '1')};`,
    });

    if (isNull) {
      UcrxCore.nul.overrideIn(this, {
        body:
          ({
            member: {
              args: { cx },
            },
          }) => code => {
            code
              .write(esline`if (${listCreated.get('this')}) {`)
              .indent(code => {
                code.line(isNull.set('this', '0'), ';');
                if (this.#isNullableItem) {
                  code.write(esline`return super.nul(${cx});`);
                } else {
                  code.write(esline`return ${cx}.reject(${ucrxRejectNull}(this));`);
                }
              })
              .write(`}`)
              .write(esline`return ${isNull.set('this', '1')};`);
          },
      });
    }

    UcrxCore.end.overrideIn(this, {
      body:
        ({
          member: {
            args: { cx },
          },
        }) => code => {
          switch (this.#single) {
            case 'reject':
              if (isNull) {
                code
                  .write(esline`if (${isNull.get('this')}) {`)
                  .indent(this.#storeNullList(cx))
                  .write(esline`} else if (${listCreated.get('this')}) {`);
              } else {
                code.write(esline`if (${listCreated.get('this')}) {`);
              }

              code
                .indent(this.#storeList(cx))
                .write('} else {')
                .indent(esline`${cx}.reject(${ucrxRejectSingleItem}(this));`)
                .write('}');

              break;
            case 'accept':
              if (isNull) {
                code
                  .write(esline`if (${isNull.get('this')}) {`)
                  .indent(this.#storeNullList(cx))
                  .write(esline`} else {`)
                  .indent(this.#storeList(cx))
                  .write('}');
              } else {
                code.write(this.#storeList(cx));
              }

              break;
            case 'as-is':
            case 'prefer':
              if (isNull) {
                code
                  .write(esline`if (${isNull.get('this')}) {`)
                  .indent(this.#storeNullList(cx))
                  .write(esline`} else if (${listCreated.get('this')}) {`);
              } else {
                code.write(esline`if (${listCreated.get('this')}) {`);
              }
              code
                .indent(
                  this.#single === 'prefer' ? this.#storeSingleOrList(cx) : this.#storeList(cx),
                )
                .write('} else {')
                .indent(this.#storeSingleOrEmpty(cx))
                .write('}');
          }
        },
    });
  }

  #storeNullList(cx: EsSnippet): EsSnippet {
    return esline`${this.#setList}(${this.createNullList(cx)});`;
  }

  #storeList(cx: EsSnippet): EsSnippet {
    return esline`${this.#setList}(${this.createList(cx)});`;
  }

  #storeSingleOrList(cx: EsSnippet): EsSnippet {
    return esline`${this.#setList}(${this.countItems(cx)} === 1 ? ${this.createSingle(
      cx,
    )} : ${this.createList(cx)});`;
  }

  #storeSingleOrEmpty(cx: EsSnippet): EsSnippet {
    return esline`${this.#setList}(${this.countItems(cx)} ? ${this.createSingle(
      cx,
    )} : ${this.createEmptyList(cx)});`;
  }

  #declareMatrixMethods(): void {
    const { itemClass } = this;
    const listCreated = this.#listCreated;
    const isNull = this.#isNull;
    const itemRx = this.#itemRx;

    UcrxCore.nls.overrideIn(this, {
      body: () => esline`return ${itemClass.instantiate({
          set: esline`item => ${this.#addItem.call('this', { item: 'item' })}`,
        })};`,
    });
    UcrxCore.and.overrideIn(this, {
      body: () => esline`return ${listCreated.set('this', '1')};`,
    });
    UcrxCore.end.overrideIn(this, {
      body:
        ({
          member: {
            args: { cx },
          },
        }) => code => {
          if (isNull) {
            code
              .write(esline`if (${isNull.get('this')}) {`)
              .indent(esline`${this.#setList}(${this.createNullList(cx)});`)
              .write(esline`} else if (${listCreated.get('this')}) {`);
          } else {
            code.write(esline`if (${listCreated.get('this')}) {`);
          }
          code.indent(esline`${this.#setList}(${this.createList(cx)});`).write(`}`);
        },
    });
    if (this.#isNullable) {
      UcrxCore.nul.overrideIn(this, {
        body:
          ({
            member: {
              args: { cx },
            },
          }) => code => {
            code
              .write(esline`if (${listCreated.get('this')}) {`)
              .indent(code => {
                if (this.#isNullableItem) {
                  code
                    .line(this.#addItem.call('this', { item: this.createNullItem(cx) }), ';')
                    .write(`return 1;`);
                } else {
                  const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');

                  code.write(esline`return ${cx}.reject(${ucrxRejectNull}(this));`);
                }
              })
              .write(`}`)
              .write(code => {
                if (isNull) {
                  code.write(esline`return ${isNull.set('this', '1')};`);
                } else {
                  const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');

                  code.write(esline`return ${cx}.reject(${ucrxRejectNull}(this));`);
                }
              });
          },
      });
    }

    if (itemRx) {
      for (const { member } of itemClass.members()) {
        if (
          itemClass.isMemberOverridden(member)
          && member instanceof UcrxMethod
          && !this.findMember(member)?.declared
        ) {
          this.#delegate(member, itemRx);
        }
      }
    }
  }

  #delegate<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    method: UcrxMethod<TArgs, TMod>,
    itemRx: EsPropertyHandle,
  ): void {
    method.overrideIn(this, {
      body:
        ({ getHandle, member: { args } }) => code => {
          code
            .write(esline`if (${this.#listCreated.get('this')}) {`)
            .indent(
              esline`return ${getHandle().call(
                itemRx.get('this'),
                args as EsSignature.ValuesOf<EsSignature.Args> as EsSignature.ValuesOf<TArgs>,
              )};`,
            )
            .write('}')
            .write('return 0;');
        },
    });
  }

}
