import { EsVarKind, EsVarSymbol, esMemberAccessor, esline } from 'esgen';
import { UcMap } from '../../../schema/map/uc-map.js';
import { UcModel } from '../../../schema/uc-schema.js';
import { ucSchemaTypeSymbol } from '../../impl/uc-schema-symbol.js';
import { UcsFunction } from '../ucs-function.js';
import { UcsLib } from '../ucs-lib.js';

export function ucsMapKeys<
  TEntriesModel extends UcMap.EntriesModel,
  TExtraModel extends UcModel | false,
>(lib: UcsLib, schema: UcMap.Schema<TEntriesModel, TExtraModel>): EsVarSymbol | null {
  return lib
    .serializerFor<
      UcMap.Infer<TEntriesModel, TExtraModel>,
      UcMap.Schema<TEntriesModel, TExtraModel>
    >({
      // Associate with vanilla schema without constraints as the latter have no effect.
      ...schema,
      where: undefined,
      within: undefined,
      nullable: false,
      optional: false,
    })
    .associate(ucsAssociateMapKeys);
}

function ucsAssociateMapKeys<
  TEntriesModel extends UcMap.EntriesModel,
  TExtraModel extends UcModel | false,
>(
  target: UcsFunction<
    UcMap.Infer<TEntriesModel, TExtraModel>,
    UcMap.Schema<TEntriesModel, TExtraModel>
  >,
): EsVarSymbol | null {
  const { schema } = target;
  const { entries, extra } = schema;

  if (!extra) {
    return null;
  }

  const keys = Object.keys(entries);

  if (!keys.length) {
    return null;
  }

  return new EsVarSymbol(ucSchemaTypeSymbol(schema) + '$keys', {
    declare: {
      at: 'bundle',
      as: EsVarKind.Const,
      value: () => code => {
        code.multiLine(code => {
          code
            .write('{')
            .indent(code => {
              for (const key of keys) {
                code.write(esline`${esMemberAccessor(key).key}: 1,`);
              }
            })
            .write('}');
        });
      },
    },
  });
}
