import { esline } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcString } from '../../schema/string/uc-string.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { ucsFormatBigInt } from './impl/ucs-format-bigint.js';
import { ucsFormatBoolean } from './impl/ucs-format-boolean.js';
import { ucsFormatInteger } from './impl/ucs-format-integer.js';
import { ucsFormatNumber } from './impl/ucs-format-number.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { UcsFormatter } from './ucs-formatter.js';
import { ucsProcessBigInt } from './ucs-process-bigint.js';
import { ucsProcessInteger } from './ucs-process-integer.js';
import { ucsProcessNumber } from './ucs-process-number.js';
import { ucsProcessString } from './ucs-process-string.js';

export function ucsSupportPlainText(): UccFeature<UcsBootstrap> {
  return boot => {
    boot
      .enable(ucsProcessPlainTextDefaults)
      .onConstraint(
        {
          processor: 'serializer',
          use: ucsProcessBigInt.name,
          from: COMPILER_MODULE,
        },
        ({ schema, constraint: { with: options } }) => {
          const { number = 'parse' } = options as UcBigInt.Variant;

          boot.formatWith('plainText', schema, ucsFormatPlainText(ucsFormatBigInt({ number })));
        },
      )
      .onConstraint(
        {
          processor: 'serializer',
          use: ucsProcessInteger.name,
          from: COMPILER_MODULE,
        },
        ({ schema }) => {
          boot.formatWith('plainText', schema, ucsFormatPlainText(ucsFormatInteger()));
        },
      )
      .onConstraint(
        {
          processor: 'serializer',
          use: ucsProcessNumber.name,
          from: COMPILER_MODULE,
        },
        ({ schema }) => {
          boot.formatWith('plainText', schema, ucsFormatPlainText(ucsFormatNumber()));
        },
      )
      .onConstraint(
        {
          processor: 'serializer',
          use: ucsProcessString.name,
          from: COMPILER_MODULE,
        },
        ({ schema }) => {
          boot.formatWith('plainText', schema, ucsFormatPlainTextString());
        },
      );
  };
}

function ucsProcessPlainTextDefaults(boot: UcsBootstrap): void {
  boot
    .formatWith('plainText', BigInt, ucsFormatPlainText(ucsFormatBigInt()))
    .formatWith('plainText', Boolean, ucsFormatPlainText(ucsFormatBoolean()))
    .formatWith('plainText', Number, ucsFormatPlainText(ucsFormatNumber()))
    .formatWith('plainText', String, ucsFormatPlainTextString());
}

function ucsFormatPlainTextString(): UcsFormatter<UcString> {
  return ucsFormatPlainText(({ writer, value }) => {
    const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

    return esline`await ${writeAsIs}(${writer}, ${value});`;
  });
}

function ucsFormatPlainText<T>(formatter: UcsFormatter<T>): UcsFormatter<T> {
  return (args, schema, context) => {
    if (schema.nullable) {
      throw new UnsupportedUcSchemaError(
        schema,
        `${context}: Can not serialize nullable values of type "${ucModelName(
          schema,
        )}" to plain text`,
      );
    }
    if (schema.optional) {
      throw new UnsupportedUcSchemaError(
        schema,
        `${context}: Can not serialize optional values of type "${ucModelName(
          schema,
        )}" to plain text`,
      );
    }

    return formatter(args, schema, context);
  };
}
