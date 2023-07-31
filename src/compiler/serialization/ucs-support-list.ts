import { EsSnippet, EsVarKind, EsVarSymbol, esline } from 'esgen';
import { UcList } from '../../schema/list/uc-list.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UccListOptions } from '../common/ucc-list-options.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { UcsFormatterContext, UcsFormatterSignature } from './ucs-formatter.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportList(setup: UcsSetup): UccConfig<UccListOptions> {
  return {
    configureSchema(schema: UcList.Schema, options) {
      setup.processModel(schema.item).formatWith(
        'charge',
        schema,
        ucsFormatCharge(
          (
            args: UcsFormatterSignature.AllValues,
            schema: UcList.Schema,
            context: UcsFormatterContext,
          ) => ucsWriteList(args, schema, context, options),
        ),
      );
    },
  };
}

function ucsWriteList<TItem, TItemModel extends UcModel<TItem>>(
  args: UcsFormatterSignature.AllValues,
  schema: UcList.Schema<TItem, TItemModel>,
  context: UcsFormatterContext,
  { single }: UccListOptions,
): EsSnippet {
  const { writer, value } = args;
  const itemSchema = schema.item.optional
    ? ucOptional(ucNullable(schema.item), false) // Write `undefined` items as `null`
    : schema.item;

  switch (single) {
    case 'prefer':
      return code => {
        code
          .write(esline`if (!Array.isArray(${value})) {`)
          .indent(ucsWriteItem({ writer, value }, itemSchema, context))
          .write(esline`} else if (${value}.length === 1) {`)
          .indent(ucsWriteItem({ writer, value: esline`${value}[0]` }, itemSchema, context))
          .write('} else {')
          .indent(ucsWriteListItems(args, schema, context))
          .write('}');
      };
    case 'as-is':
      return code => {
        code
          .write(esline`if (Array.isArray(${value})) {`)
          .indent(ucsWriteListItems(args, schema, context))
          .write(esline`} else {`)
          .indent(ucsWriteItem({ writer, value }, itemSchema, context))
          .write('}');
      };
    case 'accept':
    case 'reject':
      // Always an array.
      return ucsWriteListItems(args, schema, context);
  }
}

function ucsWriteListItems<TItem, TItemModel extends UcModel<TItem>>(
  { writer, value, asItem }: UcsFormatterSignature.AllValues,
  schema: UcList.Schema<TItem, TItemModel>,
  context: UcsFormatterContext,
): EsSnippet {
  const openingParenthesis = UC_MODULE_SERIALIZER.import('UCS_OPENING_PARENTHESIS');
  const closingParenthesis = UC_MODULE_SERIALIZER.import('UCS_CLOSING_PARENTHESIS');
  const emptyList = UC_MODULE_SERIALIZER.import('UCS_EMPTY_LIST');
  const comma = UC_MODULE_SERIALIZER.import('UCS_COMMA');
  const itemSchema = schema.item.optional
    ? ucOptional(ucNullable(schema.item), false) // Write `undefined` items as `null`
    : schema.item;

  return (code, { ns: { names } }) => {
    const itemValue = names.reserveName(`itemValue`);
    const itemWritten = new EsVarSymbol(`itemWritten`);

    code
      .line(itemWritten.declare({ as: EsVarKind.Let, value: () => 'false' }), ';')
      .write(esline`for (const ${itemValue} of ${value}) {`)
      .indent(
        esline`await ${writer}.ready;`,
        esline`${writer}.write(${itemWritten} || !${asItem} ? ${comma} : ${openingParenthesis});`,
        esline`${itemWritten} = true;`,
        ucsWriteItem({ writer, value: itemValue }, itemSchema, context),
      )
      .write(`}`)
      .write(esline`if (${asItem}) {`)
      .indent(
        esline`await ${writer}.ready;`,
        esline`${writer}.write(${itemWritten} ? ${closingParenthesis} : ${emptyList});`,
      )
      .write(esline`} else if (!${itemWritten}) {`)
      .indent(esline`await ${writer}.ready;`, esline`${writer}.write(${comma});`)
      .write(`}`);
  };
}

function ucsWriteItem(
  args: Omit<UcsFormatterSignature.AllValues, 'asItem'>,
  itemSchema: UcSchema,
  context: UcsFormatterContext,
): EsSnippet {
  return context.format(itemSchema, { ...args, asItem: '1' }, (schema, context) => {
    throw new UnsupportedUcSchemaError(
      schema,
      `${context}: Can not serialize list item of type "${ucModelName(schema)}"`,
    );
  });
}
