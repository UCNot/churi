import { EsClass, EsMemberInit, EsProperty, EsPropertyDeclaration, EsPropertyHandle } from 'esgen';

export class UcrxProperty extends EsProperty {
  readonly #stub: EsPropertyDeclaration;

  constructor(requestedName: string, init: UcrxPropertyInit) {
    super(requestedName, init);
    this.#stub = init.stub;
  }

  get stub(): EsPropertyDeclaration {
    return this.#stub;
  }

  declareStub(hostClass: EsClass): EsPropertyHandle {
    return this.declareIn(hostClass, this.stub);
  }
}

export interface UcrxPropertyInit extends EsMemberInit {
  readonly stub: EsPropertyDeclaration;
}
