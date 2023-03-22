import { BaseUcrxTemplate } from '../rx/base.ucrx-template.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';

export class ExternalUcrxTemplate extends BaseUcrxTemplate {

  readonly #preferredClassName: string;
  readonly #importFrom: string;

  #className?: string;

  constructor(options: ExternalUcrxTemplate.Options) {
    super(options);

    const { className, importFrom } = options;

    this.#preferredClassName = className;
    this.#importFrom = importFrom;
  }

  override get className(): string {
    return (this.#className ??= this.#importClass());
  }

  #importClass(): string {
    return this.lib.import(this.#importFrom, this.#preferredClassName);
  }

}

export namespace ExternalUcrxTemplate {
  export interface Options extends UcrxTemplate.Options {
    readonly className: string;
    readonly importFrom: string;
  }
}
