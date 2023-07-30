import { esline } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccProfile } from '../processor/ucc-profile.js';
import { ucsFormatBigInt } from './impl/ucs-format-bigint.js';
import { ucsFormatInteger } from './impl/ucs-format-integer.js';
import { ucsFormatNumber } from './impl/ucs-format-number.js';
import { UcsSetup } from './ucs-setup.js';
import { ucsSupportBigInt } from './ucs-support-bigint.js';
import { ucsSupportInteger } from './ucs-support-integer.js';
import { ucsSupportNumber } from './ucs-support-number.js';
import { ucsSupportString } from './ucs-support-string.js';

export function ucsAllowPlainText(activation: UccProfile.Activation<UcsSetup>): void {
  activation
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportBigInt.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema, constraint: { with: options = {} } }) => {
        const { number = 'parse' } = options as UcBigInt.Variant;

        setup.formatWith('plainText', schema, ucsFormatBigInt({ string: 'parse', number }));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportInteger.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('plainText', schema, ucsFormatInteger());
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportNumber.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('plainText', schema, ucsFormatNumber());
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsSupportString.name,
        from: COMPILER_MODULE,
      },
      ({ setup, schema }) => {
        setup.formatWith('plainText', schema, ({ writer, value }) => {
          const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

          return esline`await ${writeAsIs}(${writer}, ${value});`;
        });
      },
    );
}
