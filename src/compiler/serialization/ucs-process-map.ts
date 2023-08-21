import { EsSnippet, esline } from 'esgen';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcModel } from '../../schema/uc-schema.js';
import { ucsEncodeKey } from '../../serializer/ucs-encode-key.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsMapSerializer } from './impl/map/ucs-map.serializer.js';
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

class UcsMapChargeSerializer<
  TEntriesModel extends UcMap.EntriesModel,
  TExtraModel extends UcModel | false,
> extends UcsMapSerializer<TEntriesModel, TExtraModel> {

  protected override firstEntryPrefix(entryKey: string): EsSnippet {
    return entryKey
      ? this.lib.binConst(`${ucsEncodeKey(entryKey)}(`)
      : UC_MODULE_SERIALIZER.import('UCS_EMPTY_ENTRY_PREFIX');
  }

  protected override nextEntryPrefix(entryKey: string): EsSnippet {
    return entryKey
      ? this.lib.binConst(`)${ucsEncodeKey(entryKey)}(`)
      : UC_MODULE_SERIALIZER.import('UCS_EMPTY_NEXT_ENTRY_PREFIX');
  }

  protected override firstExtraPrefix(extraKey: EsSnippet): EsSnippet {
    const encodeKey = UC_MODULE_SERIALIZER.import(ucsEncodeKey.name);

    return esline`\`\${${encodeKey}(${extraKey})}(\``;
  }

  protected override nextExtraPrefix(extraKey: EsSnippet): EsSnippet {
    const encodeKey = UC_MODULE_SERIALIZER.import(ucsEncodeKey.name);

    return esline`\`)\${${encodeKey}(${extraKey})}(\``;
  }

  protected override null(): EsSnippet {
    return UC_MODULE_SERIALIZER.import('UCS_NULL');
  }

  protected override endOfMap(): EsSnippet {
    return UC_MODULE_SERIALIZER.import('UCS_CLOSING_PARENTHESIS');
  }

  protected override emptyMap(): EsSnippet {
    return UC_MODULE_SERIALIZER.import('UCS_EMPTY_MAP');
  }

}
