import { EsSnippet } from 'esgen';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcModel } from '../../schema/uc-schema.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UcsMapChargeSerializer } from './impl/map/ucs-map.charge.serializer.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { UcsFormatterContext, UcsFormatterSignature } from './ucs-formatter.js';

export function ucsProcessMap(boot: UcsBootstrap): UccFeature.Handle {
  boot.formatWith('charge', 'map', ucsFormatCharge(ucsWriteMap));

  return {
    inspect({ entries, extra }: UcMap.Schema) {
      Object.values(entries).forEach(entrySchema => boot.processModel(entrySchema));
      if (extra) {
        boot.processModel(extra);
      }
    },
    constrain(_constraint) {},
  };
}

function ucsWriteMap<TEntriesModel extends UcMap.EntriesModel, TExtraModel extends UcModel | false>(
  args: UcsFormatterSignature.AllValues,
  schema: UcMap.Schema<TEntriesModel, TExtraModel>,
  context: UcsFormatterContext,
): EsSnippet {
  return new UcsMapChargeSerializer(args, schema, context).write();
}
