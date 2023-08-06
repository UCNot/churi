import { esImport, esline } from 'esgen';
import { encodeURIPart } from 'httongue';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcString } from '../../schema/string/uc-string.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucsWriteURIEncoded } from '../../serializer/ucs-write-string.js';
import { UccCapability } from '../bootstrap/ucc-capability.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
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
import { UcsWriterClass } from './ucs-writer.class.js';

export function ucsSupportURIEncoded(): UccCapability<UcsBootstrap> {
  return activation => {
    activation
      .enable(ucsProcessURIEncodedDefaults)
      .onConstraint(
        {
          processor: 'serializer',
          use: ucsProcessBigInt.name,
          from: COMPILER_MODULE,
        },
        ({ boot, schema, constraint: { with: options } }) => {
          const { number = 'parse' } = options as UcBigInt.Variant;

          boot.formatWith('uriEncoded', schema, ucsFormatURIEncoded(ucsFormatBigInt({ number })));
        },
      )
      .onConstraint(
        {
          processor: 'serializer',
          use: ucsProcessInteger.name,
          from: COMPILER_MODULE,
        },
        ({ boot, schema }) => {
          boot.formatWith('uriEncoded', schema, ucsFormatURIEncoded(ucsFormatInteger()));
        },
      )
      .onConstraint(
        {
          processor: 'serializer',
          use: ucsProcessNumber.name,
          from: COMPILER_MODULE,
        },
        ({ boot, schema }) => {
          boot.formatWith('uriEncoded', schema, ucsFormatURIEncoded(ucsFormatNumber()));
        },
      )
      .onConstraint(
        {
          processor: 'serializer',
          use: ucsProcessString.name,
          from: COMPILER_MODULE,
        },
        ({ boot, schema }) => {
          boot.formatWith('uriEncoded', schema, ucsFormatURIEncodedString());
        },
      );
  };
}

function ucsProcessURIEncodedDefaults(boot: UcsBootstrap): UccConfig {
  return {
    configure() {
      boot
        .formatWith('uriEncoded', BigInt, ucsFormatURIEncoded(ucsFormatBigInt()))
        .formatWith('uriEncoded', Boolean, ucsFormatURIEncoded(ucsFormatBoolean()))
        .formatWith('uriEncoded', Number, ucsFormatURIEncoded(ucsFormatNumber()))
        .formatWith('uriEncoded', String, ucsFormatURIEncodedString())
        .writeWith('uriEncoded', ({ stream, options }) => async (code, { ns }) => {
          const encodeURI = esImport('httongue', encodeURIPart.name);
          const naming = await ns.refer(UcsWriterClass).whenNamed();

          code.line(
            naming.instantiate({
              stream,
              options: esline`{ ...${options}, encodeURI: ${encodeURI} }`,
            }),
          );
        });
    },
  };
}

function ucsFormatURIEncodedString(): UcsFormatter<UcString> {
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
