import { EsCode, EsSnippet, EsVarKind, EsVarSymbol, esline } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcBoolean } from '../../schema/boolean/uc-boolean.js';
import { UcList } from '../../schema/list/uc-list.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UcString } from '../../schema/string/uc-string.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import {
  ucsWriteBigIntJSON,
  ucsWriteBigIntOrNumberJSON,
} from '../../serializer/ucs-write-bigint.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UccListOptions } from '../common/ucc-list-options.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { UcsFormatter, UcsFormatterContext, UcsFormatterSignature } from './ucs-formatter.js';
import { ucsProcessBigInt } from './ucs-process-bigint.js';
import { ucsProcessInteger } from './ucs-process-integer.js';
import { ucsProcessList } from './ucs-process-list.js';
import { ucsProcessNumber } from './ucs-process-number.js';

export function ucsProcessJSON(boot: UcsBootstrap): UccFeature.Handle<UcsBootstrap> {
  boot
    .enable(ucsProcessJSONDefaults)
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsProcessBigInt.name,
        from: COMPILER_MODULE,
      },
      ({
        schema,
        options,
      }: UccFeature.ConstraintApplication<UcsBootstrap, UcBigInt.Variant | undefined>) => {
        boot.formatWith('json', schema, ucsFormatJSONBigInt(options));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsProcessInteger.name,
        from: COMPILER_MODULE,
      },
      ({
        schema,
        options,
      }: UccFeature.ConstraintApplication<UcsBootstrap, UcInteger.Variant | undefined>) => {
        boot.formatWith('json', schema, ucsFormatJSONInteger(options));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsProcessNumber.name,
        from: COMPILER_MODULE,
      },
      ({
        schema,
        options,
      }: UccFeature.ConstraintApplication<UcsBootstrap, UcNumber.Variant | undefined>) => {
        boot.formatWith('json', schema, ucsFormatJSONNumber(options));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsProcessList.name,
        from: COMPILER_MODULE,
      },
      ({ schema, options }: UccFeature.ConstraintApplication<UcsBootstrap, UccListOptions>) => {
        boot.formatWith(
          'json',
          schema,
          ucsFormatJSON(
            (
              args: UcsFormatterSignature.AllValues,
              schema: UcList.Schema,
              context: UcsFormatterContext,
            ) => ucsWriteJSONList(args, schema, context, options),
          ),
        );
      },
    );

  return {
    constrain({ schema }) {
      boot.formatWith('json', schema);
    },
  };
}

function ucsProcessJSONDefaults(boot: UcsBootstrap): void {
  boot
    .formatWith('json', BigInt, ucsFormatJSONBigInt())
    .formatWith('json', Boolean, ucsFormatJSON(ucsFormatJSONBoolean()))
    .formatWith('json', 'integer', ucsFormatJSONInteger())
    .formatWith('json', Number, ucsFormatJSONNumber())
    .formatWith('json', String, ucsFormatJSONString());
}

function ucsFormatJSONBigInt({ string, number }: UcBigInt.Variant = {}): UcsFormatter<UcBigInt> {
  return ucsFormatJSON(({ writer, value }, schema) => code => {
    const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

    if (string === 'reject' && number !== 'serialize') {
      throw new UnsupportedUcSchemaError(schema, `BigInt value has to be representable as string`);
    }
    if (number === 'reject') {
      // Prefix with `0n`, as otherwise the value will be rejected.
      const writeBigInt = UC_MODULE_SERIALIZER.import(ucsWriteBigIntJSON.name);

      code.write(esline`await ${writeBigInt}(${writer}, ${value});`);
    } else if (string === 'serialize') {
      code.write(esline`await ${writeAsIs}(writer, \`"\${${value}}"\`);`);
    } else if (number === 'serialize') {
      code.write(esline`await ${writeAsIs}(${writer}, String(${value}));`);
    } else {
      const writeBigIntOrNumber = UC_MODULE_SERIALIZER.import(ucsWriteBigIntOrNumberJSON.name);

      code.write(esline`await ${writeBigIntOrNumber}(${writer}, ${value});`);
    }
  });
}

function ucsFormatJSONBoolean(): UcsFormatter<UcBoolean, UcBoolean.Schema> {
  return ({ writer, value }) => code => {
      const jsonTrue = UC_MODULE_SERIALIZER.import('UCS_JSON_TRUE');
      const jsonFalse = UC_MODULE_SERIALIZER.import('UCS_JSON_FALSE');

      code.write(
        esline`await ${writer}.ready;`,
        esline`${writer}.write(${value} ? ${jsonTrue} : ${jsonFalse});`,
      );
    };
}

function ucsFormatJSONNumber(variant?: UcNumber.Variant): UcsFormatter<UcNumber> {
  return ucsFormatJSONNumeric(
    variant?.string === 'serialize'
      ? value => esline`\`"\${${value}}"\``
      : value => esline`String(${value})`,
  );
}

function ucsFormatJSONInteger(variant?: UcInteger.Variant): UcsFormatter<UcInteger> {
  return ucsFormatJSONNumeric(
    variant?.string === 'serialize'
      ? value => esline`\`"\${${value}.toFixed(0)}"\``
      : value => esline`${value}.toFixed(0)`,
  );
}

function ucsFormatJSONNumeric(toString: (value: EsSnippet) => EsSnippet): UcsFormatter<UcNumber> {
  return ({ writer, value }) => code => {
      const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);
      const jsonNull = UC_MODULE_SERIALIZER.import('UCS_JSON_NULL');

      code
        .write(esline`if (Number.isFinite(${value})) {`)
        .indent(esline`await ${writeAsIs}(${writer}, ${toString(value)});`)
        .write('} else {')
        .indent(esline`await ${writer}.ready;`, esline`${writer}.write(${jsonNull});`)
        .write('}');
    };
}

function ucsFormatJSONString(): UcsFormatter<UcString> {
  return ucsFormatJSON(({ writer, value }) => code => {
    const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

    code.write(esline`await ${writeAsIs}(${writer}, JSON.stringify(${value}));`);
  });
}

function ucsWriteJSONList<TItem, TItemModel extends UcModel<TItem>>(
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

function ucsFormatJSON<T>(formatter: UcsFormatter<T>): UcsFormatter<T> {
  return (args, schema, context) => ucsCheckJSON(args, schema, formatter(args, schema, context));
}

function ucsCheckJSON(
  { writer, value }: UcsFormatterSignature.Values,
  schema: UcSchema,
  onValue: EsSnippet,
  {
    onNull = code => {
      const jsonNull = UC_MODULE_SERIALIZER.import('UCS_JSON_NULL');

      code.write(esline`await ${writer}.ready;`, esline`${writer}.write(${jsonNull})`);
    },
  }: {
    readonly onNull?: EsSnippet;
  } = {},
): EsSnippet {
  return function checkConstraints(code: EsCode) {
    if (schema.nullable || schema.optional) {
      code
        .write(esline`if (${value} != null) {`)
        .indent(onValue)
        .write(`} else {`)
        .indent(onNull)
        .write('}');
    } else {
      code.write(onValue);
    }
  };
}
