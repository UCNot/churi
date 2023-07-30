import { EsFunction, esline } from 'esgen';
import { UcUnknown, ucUnknown } from '../../../schema/unknown/uc-unknown.js';
import { UcrxLib } from '../../rx/ucrx-lib.js';
import { UcdCompiler } from '../ucd-compiler.js';
import { UcdLib } from '../ucd-lib.js';
import { UcdModels } from '../ucd-models.js';

export class UcValueCompiler extends UcdCompiler<{
  parseUcValue: UcdModels.SyncEntry<UcUnknown.Schema>;
}> {

  constructor() {
    super({
      models: {
        parseUcValue: {
          model: ucUnknown(),
          mode: 'sync',
        },
      },
    });
  }

  override async bootstrapOptions(): Promise<
    UcdLib.Options<{ parseUcValue: UcdModels.SyncEntry<UcUnknown.Schema> }>
  > {
    const options = await super.bootstrapOptions();
    const onMeta = new EsFunction(
      'onMeta$byDefault',
      {
        cx: {},
        rx: {},
        attr: {},
      },
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
