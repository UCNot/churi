import { UcDeserializer } from '../schema/uc-deserializer.js';
import { UcError, UcErrorInfo } from '../schema/uc-error.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcdRx } from './ucd-rx.js';

export abstract class AbstractUcdReader {

  readonly #onError: (error: UcErrorInfo) => void;

  constructor(options?: UcDeserializer.Options);

  constructor({ onError = UcDeserializer$throwOnError }: UcDeserializer.Options = {}) {
    this.#onError = onError;
  }

  abstract hasNext(): boolean;

  abstract current(): UcToken | undefined;

  abstract prev(): readonly UcToken[];

  error(error: UcErrorInfo): void {
    this.#onError(error);
  }

  abstract read(rx: UcdRx): Promise<void> | void;

  abstract next(): Promise<UcToken | undefined> | UcToken | undefined;

  abstract find(
    matcher: (token: UcToken) => boolean | null | undefined,
  ): Promise<UcToken | undefined> | UcToken | undefined;

  abstract consume(): UcToken[];

  abstract consumePrev(): UcToken[];

  abstract skip(): void;

  abstract omitPrev(): void;

  abstract done(): void;

}

function UcDeserializer$throwOnError(error: unknown): never {
  throw UcError.create(error);
}
