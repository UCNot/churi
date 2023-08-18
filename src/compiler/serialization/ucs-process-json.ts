import { EsCode, EsSnippet, esline } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcBoolean } from '../../schema/boolean/uc-boolean.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UcString } from '../../schema/string/uc-string.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import {
  ucsWriteBigIntJSON,
  ucsWriteBigIntOrNumberJSON,
} from '../../serializer/ucs-write-bigint.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { UcsFormatter, UcsFormatterSignature } from './ucs-formatter.js';
import { ucsProcessBigInt } from './ucs-process-bigint.js';
import { ucsProcessInteger } from './ucs-process-integer.js';
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
