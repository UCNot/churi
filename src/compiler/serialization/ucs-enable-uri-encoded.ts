import { esline } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcString } from '../../schema/string/uc-string.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucsWriteURIEncoded } from '../../serializer/ucs-write-string.js';
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

export function ucsEnableURIEncoded(activation: UccCapability.Activation<UcsSetup>): void {
  activation
    .enable(ucsSupportURIEncodedDefaults)
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportBigInt.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema, constraint: { with: options } }) => {
        const { number = 'parse' } = options as UcBigInt.Variant;

        setup.formatWith('uriEncoded', schema, ucsFormatURIEncoded(ucsFormatBigInt({ number })));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportInteger.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('uriEncoded', schema, ucsFormatURIEncoded(ucsFormatInteger()));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportNumber.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('uriEncoded', schema, ucsFormatURIEncoded(ucsFormatNumber()));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportString.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('uriEncoded', schema, ucsFormatURIEncodedString());
      },
    );
}

function ucsSupportURIEncodedDefaults(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup
        .formatWith('uriEncoded', BigInt, ucsFormatURIEncoded(ucsFormatBigInt()))
        .formatWith('uriEncoded', Boolean, ucsFormatURIEncoded(ucsFormatBoolean()))
        .formatWith('uriEncoded', Number, ucsFormatURIEncoded(ucsFormatNumber()))
        .formatWith('uriEncoded', String, ucsFormatURIEncodedString());
    },
  };
}

export function ucsFormatURIEncodedString(): UcsFormatter<UcString> {
  return ucsFormatURIEncoded(({ writer, value }) => {
    const write = UC_MODULE_SERIALIZER.import(ucsWriteURIEncoded.name);

    return esline`await ${write}(${writer}, ${value});`;
  });
}

function ucsFormatURIEncoded<T>(formatter: UcsFormatter<T>): UcsFormatter<T> {
  return (args, schema, context) => {
    if (schema.nullable) {
      throw new UnsupportedUcSchemaError(
        schema,
        `${context}: Can not URI-encode nullable values of type "${ucModelName(schema)}"`,
      );
    }
    if (schema.optional) {
      throw new UnsupportedUcSchemaError(
        schema,
        `${context}: Can not URI-encode optional values of type "${ucModelName(schema)}"`,
      );
    }

    return formatter(args, schema, context);
  };
}
