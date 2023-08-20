import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UccListOptions } from '../common/ucc-list-options.js';
import { ucsFormatJSONBigInt } from './impl/json/ucs-format-json-bigint.js';
import { ucsFormatJSONBoolean } from './impl/json/ucs-format-json-boolean.js';
import { ucsFormatJSONList } from './impl/json/ucs-format-json-list.js';
import { ucsFormatJSONMap } from './impl/json/ucs-format-json-map.js';
import { ucsFormatJSONInteger, ucsFormatJSONNumber } from './impl/json/ucs-format-json-numeric.js';
import { ucsFormatJSONString } from './impl/json/ucs-format-json-string.js';
import { ucsFormatJSONUnknown } from './impl/json/ucs-format-json-unknown.js';
import { ucsFormatJSON } from './impl/json/ucs-format-json.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { ucsProcessBigInt } from './ucs-process-bigint.js';
import { ucsProcessInteger } from './ucs-process-integer.js';
import { ucsProcessList } from './ucs-process-list.js';
import { ucsProcessMap } from './ucs-process-map.js';
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
        boot.formatWith('json', schema, ucsFormatJSONList(options));
      },
    )
    .onConstraint(
      {
        processor: 'serializer',
        use: ucsProcessMap.name,
        from: COMPILER_MODULE,
      },
      ({ schema }: UccFeature.ConstraintApplication<UcsBootstrap, UcMap.Variant | undefined>) => {
        boot.formatWith('json', schema, ucsFormatJSONMap());
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
    .formatWith('json', String, ucsFormatJSONString())
    .formatWith('json', 'unknown', ucsFormatJSONUnknown());
}
