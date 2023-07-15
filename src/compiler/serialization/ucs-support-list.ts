import { EsSnippet, EsVarKind, EsVarSymbol, esline } from 'esgen';
import { UcList } from '../../schema/list/uc-list.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UcModel } from '../../schema/uc-schema.js';
import { UccListOptions } from '../common/ucc-list-options.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';
import { UcsFunction } from './ucs-function.js';
import { UcsSignature } from './ucs.signature.js';

export function ucsSupportList(
  compiler: UcsCompiler,
  schema: UcList.Schema,
): UccConfig<UccListOptions> {
  return {
    configure(options) {
      compiler
        .processModel(schema.item)
        .useUcsGenerator('list', ucsWriteList)
        .useUcsGenerator(schema, (fn, schema, args) => ucsWriteList(fn, schema, args, options));
    },
  };
}

function ucsWriteList<TItem, TItemModel extends UcModel<TItem>>(
  fn: UcsFunction,
  schema: UcList.Schema<TItem, TItemModel>,
  { writer, value, asItem }: UcsSignature.AllValues,
  _options: UccListOptions = { single: 'as-is' },
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
        fn.serialize(
          itemSchema,
          {
            writer,
            value: itemValue,
            asItem: '1',
          },
          (schema, fn) => {
            throw new UnsupportedUcSchemaError(
              schema,
              `${fn}: Can not serialize list item of type "${ucModelName(schema)}"`,
            );
          },
        ),
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
