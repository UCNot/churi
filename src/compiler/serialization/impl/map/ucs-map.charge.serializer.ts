import { EsSnippet, esline } from 'esgen';
import { UcMap } from '../../../../schema/map/uc-map.js';
import { UcModel } from '../../../../schema/uc-schema.js';
import { ucsEncodeKey } from '../../../../serializer/ucs-encode-key.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsMapSerializer } from './ucs-map.serializer.js';

export class UcsMapChargeSerializer<
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
