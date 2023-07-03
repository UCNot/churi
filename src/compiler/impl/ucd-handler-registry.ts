import {
  EsDeclarationContext,
  EsNamespace,
  EsSnippet,
  EsVarSymbol,
  esMemberAccessor,
  esline,
} from 'esgen';
import { UcdHandlerFeature } from '../deserialization/ucd-handler-feature.js';
import { UC_MODULE_DESERIALIZER_DEFAULTS } from './uc-modules.js';

export class UcdHandlerRegistry {

  readonly #requestedName: string;
  #defaults: UcdHandlerConfig[] | undefined;
  #custom: UcdHandlerConfig[] | undefined = [];
  #defaultConfig = false;

  constructor(requestedName: string) {
    this.#requestedName = requestedName;
  }

  addHandler(key: string, feature: UcdHandlerFeature): this {
    this.#init().push({ key: key, feature });

    return this;
  }

  #init(): UcdHandlerConfig[] {
    return (this.#custom ??= this.#defaults)!;
  }

  configureDefaults(): void {
    this.#defaultConfig = !this.#custom?.length;
  }

  makeDefault(): void {
    if (this.#defaultConfig) {
      this.#defaultConfig = false;
      this.#defaults = this.#custom;
      this.#custom = undefined;
    }
  }

  declare(): (exportNs?: EsNamespace) => EsSnippet {
    return exportNs => this.#declare(exportNs);
  }

  #declare(exportNs?: EsNamespace): EsSnippet {
    if (this.#defaults?.length && !this.#custom) {
      // Use precompiled handlers.
      return UC_MODULE_DESERIALIZER_DEFAULTS.import(this.#requestedName);
    }

    if (!this.#custom?.length) {
      // No handlers registered.
      return 'undefined';
    }

    // Generate handlers.
    const handlers = new EsVarSymbol(this.#requestedName, {
      declare: {
        at: exportNs ? 'exports' : 'bundle',
        value: context => this.#register(context),
      },
    });

    return exportNs ? exportNs.refer(handlers) : handlers;
  }

  #register({ refer }: EsDeclarationContext): EsSnippet {
    return code => {
      code.multiLine(code => {
        code
          .write(`{`)
          .indent(code => {
            this.#custom!.forEach(({ key, feature }) => {
              code.write(
                feature({
                  register: handler => esline`${esMemberAccessor(key).key}: ${handler},`,
                  refer,
                }),
              );
            });
          })
          .write('}');
      });
    };
  }

}

interface UcdHandlerConfig {
  readonly key: string;
  readonly feature: UcdHandlerFeature;
}
