import { esline } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcString } from '../../schema/string/uc-string.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccCapability } from '../processor/ucc-capability.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatBigInt } from './impl/ucs-format-bigint.js';
import { ucsFormatBoolean } from './impl/ucs-format-boolean.js';
import { ucsFormatInteger } from './impl/ucs-format-integer.js';
import { ucsFormatNumber } from './impl/ucs-format-number.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsSetup } from './ucs-setup.js';
import { ucsSupportBigInt } from './ucs-support-bigint.js';
import { ucsSupportInteger } from './ucs-support-integer.js';
import { ucsSupportNumber } from './ucs-support-number.js';
import { ucsSupportString } from './ucs-support-string.js';

export function ucsEnablePlainText(activation: UccCapability.Activation<UcsSetup>): void {
  activation
    .enable(ucsSupportPlainTextDefaults)
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportBigInt.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema, constraint: { with: options } }) => {
        const { number = 'parse' } = options as UcBigInt.Variant;

        setup.formatWith('plainText', schema, ucsFormatPlainText(ucsFormatBigInt({ number })));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportInteger.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('plainText', schema, ucsFormatPlainText(ucsFormatInteger()));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportNumber.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('plainText', schema, ucsFormatPlainText(ucsFormatNumber()));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportString.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('plainText', schema, ucsFormatStringAsPlainText());
      },
    );
}

function ucsSupportPlainTextDefaults(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup
        .formatWith('plainText', BigInt, ucsFormatPlainText(ucsFormatBigInt()))
        .formatWith('plainText', Boolean, ucsFormatPlainText(ucsFormatBoolean()))
        .formatWith('plainText', Number, ucsFormatPlainText(ucsFormatNumber()))
        .formatWith('plainText', String, ucsFormatStringAsPlainText());
    },
  };
}

function ucsFormatStringAsPlainText(): UcsFormatter<UcString> {
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
