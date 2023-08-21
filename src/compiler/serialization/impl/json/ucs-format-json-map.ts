import { EsSnippet, esline } from 'esgen';
import { UcMap } from '../../../../schema/map/uc-map.js';
import { UcModel } from '../../../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter, UcsFormatterContext, UcsFormatterSignature } from '../../ucs-formatter.js';
import { UcsMapSerializer } from '../map/ucs-map.serializer.js';
import { ucsFormatJSON } from './ucs-format-json.js';

export function ucsFormatJSONMap<
  TEntriesModel extends UcMap.EntriesModel,
  TExtraModel extends UcModel | false,
>(): UcsFormatter<UcMap.Infer<TEntriesModel, TExtraModel>> {
  return ucsFormatJSON(function ucsWriteJSONMap(
    args: UcsFormatterSignature.AllValues,
    schema: UcMap.Schema<TEntriesModel, TExtraModel>,
    context: UcsFormatterContext,
  ): EsSnippet {
    return new UcsMapJSONSerializer(args, schema, context).write();
  });
}

class UcsMapJSONSerializer<
  TEntriesModel extends UcMap.EntriesModel,
  TExtraModel extends UcModel | false,
> extends UcsMapSerializer<TEntriesModel, TExtraModel> {

  protected override firstEntryPrefix(entryKey: string): EsSnippet {
    return this.lib.binConst(`{${JSON.stringify(entryKey)}:`);
  }

  protected override nextEntryPrefix(entryKey: string): EsSnippet {
    return this.lib.binConst(`,${JSON.stringify(entryKey)}:`);
  }

  protected override firstExtraPrefix(extraKey: EsSnippet): EsSnippet {
    return esline`\`{\${JSON.stringify(${extraKey})}:\``;
  }

  protected override nextExtraPrefix(extraKey: EsSnippet): EsSnippet {
    return esline`\`,\${JSON.stringify(${extraKey})}:\``;
  }

  protected override null(): EsSnippet {
    return UC_MODULE_SERIALIZER.import('UCS_JSON_NULL');
  }

  protected override endOfMap(): EsSnippet {
    return UC_MODULE_SERIALIZER.import('UCS_CLOSING_BRACE');
  }

  protected override emptyMap(): EsSnippet {
    return UC_MODULE_SERIALIZER.import('UCS_JSON_EMPTY_OBJECT');
  }

}
