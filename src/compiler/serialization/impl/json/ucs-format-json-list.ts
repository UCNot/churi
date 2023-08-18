import { EsSnippet, EsVarKind, EsVarSymbol, esline } from 'esgen';
import { UcList } from '../../../../schema/list/uc-list.js';
import { ucModelName } from '../../../../schema/uc-model-name.js';
import { ucNullable } from '../../../../schema/uc-nullable.js';
import { ucOptional } from '../../../../schema/uc-optional.js';
import { UcModel, UcSchema } from '../../../../schema/uc-schema.js';
import { UccListOptions } from '../../../common/ucc-list-options.js';
import { UnsupportedUcSchemaError } from '../../../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter, UcsFormatterContext, UcsFormatterSignature } from '../../ucs-formatter.js';
import { ucsFormatJSON } from './ucs-format-json.js';

export function ucsFormatJSONList<TItem, TItemModel extends UcModel<TItem>>({
  single,
}: UccListOptions): UcsFormatter<TItem[]> {
  return ucsFormatJSON(function ucsWriteJSONList(
    args: UcsFormatterSignature.AllValues,
    schema: UcList.Schema<TItem, TItemModel>,
    context: UcsFormatterContext,
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
            .indent(ucsWriteJSONItem({ writer, value }, itemSchema, context))
            .write(esline`} else if (${value}.length === 1) {`)
            .indent(ucsWriteJSONItem({ writer, value: esline`${value}[0]` }, itemSchema, context))
            .write('} else {')
            .indent(ucsWriteJSONListItems(args, schema, context))
            .write('}');
        };
      case 'as-is':
        return code => {
          code
            .write(esline`if (Array.isArray(${value})) {`)
            .indent(ucsWriteJSONListItems(args, schema, context))
            .write(esline`} else {`)
            .indent(ucsWriteJSONItem({ writer, value }, itemSchema, context))
            .write('}');
        };
      case 'accept':
      case 'reject':
        // Always an array.
        return ucsWriteJSONListItems(args, schema, context);
    }
  });
}

function ucsWriteJSONListItems<TItem, TItemModel extends UcModel<TItem>>(
  { writer, value }: UcsFormatterSignature.AllValues,
  schema: UcList.Schema<TItem, TItemModel>,
  context: UcsFormatterContext,
): EsSnippet {
  const openingBracket = UC_MODULE_SERIALIZER.import('UCS_OPENING_BRACKET');
  const closingBracket = UC_MODULE_SERIALIZER.import('UCS_CLOSING_BRACKET');
  const emptyArray = UC_MODULE_SERIALIZER.import('UCS_JSON_EMPTY_ARRAY');
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
        esline`${writer}.write(${itemWritten} ? ${comma} : ${openingBracket});`,
        esline`${itemWritten} = true;`,
        ucsWriteJSONItem({ writer, value: itemValue }, itemSchema, context),
      )
      .write(`}`)
      .write(esline`await ${writer}.ready;`)
      .write(esline`${writer}.write(${itemWritten} ? ${closingBracket} : ${emptyArray});`);
  };
}

function ucsWriteJSONItem(
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
