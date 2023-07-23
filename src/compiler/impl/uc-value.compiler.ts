import { EsFunction, esline } from 'esgen';
import { UcUnknown, ucUnknown } from '../../schema/unknown/uc-unknown.js';
import { UcdCompiler } from '../deserialization/ucd-compiler.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { UcdModels } from '../deserialization/ucd-models.js';
import { UcrxLib } from '../rx/ucrx-lib.js';

export class UcValueCompiler extends UcdCompiler<{
  parseUcValue: UcdModels.Entry<UcUnknown.Schema, 'sync'>;
}> {

  constructor() {
    super({
      models: { parseUcValue: { model: ucUnknown(), mode: 'sync' } },
    });
  }

  override async bootstrapOptions(): Promise<
    UcdLib.Options<{ parseUcValue: UcdModels.Entry<UcUnknown.Schema, 'sync'> }>
  > {
    const options = await super.bootstrapOptions();
    const onMeta = new EsFunction(
      'onMeta$byDefault',
      { cx: {}, rx: {}, attr: {} },
      {
        declare: {
          at: 'exports',
          body:
            ({ args: { cx, attr } }) => (code, scope) => {
              const ucrxLib = scope.get(UcrxLib);
              const ucrxClass = ucrxLib.ucrxClassFor(options.models.parseUcValue.model);

              code.write(esline`return new ${ucrxClass}($ => ${cx}.meta.add(${attr}, $));`);
            },
        },
      },
    );

    return {
      ...options,
      onMeta,
    };
  }

}
