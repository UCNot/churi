export class PerLineStream extends TransformStream<string, string> {

  #partial = '';
  #hangingCR = false;

  constructor() {
    super({
      transform: (chunk, controller) => this.#transform(chunk, controller),
      flush: controller => this.#flush(controller),
    });
  }

  #transform(chunk: string, controller: TransformStreamDefaultController<string>): void {
    // Always odd count of lines and NLs between them.
    // At three elements long.
    const linesAndNLs = this.#splitLines(chunk, controller);

    if (!linesAndNLs) {
      return;
    }

    for (let lineIndex = 2; ; lineIndex += 2) {
      const line = linesAndNLs[lineIndex];
      const nlIndex = lineIndex + 1;

      if (nlIndex < linesAndNLs.length) {
        const nl = linesAndNLs[nlIndex];

        if (nl === '\r') {
          const nextLineIndex = lineIndex + 2;

          if (nextLineIndex + 1 >= linesAndNLs.length && !linesAndNLs[nextLineIndex]) {
            // Hanging CR.
            this.#partial = `${line}\r`;
            this.#hangingCR = true;

            break;
          }
        }

        controller.enqueue(`${line}${nl}`);
      } else {
        // Last line.
        this.#partial = line;

        break;
      }
    }
  }

  #splitLines(
    chunk: string,
    controller: TransformStreamDefaultController<string>,
  ): string[] | undefined {
    if (!chunk) {
      return; // Ignore empty chunks.
    }

    if (this.#hangingCR) {
      chunk = this.#handleHangingCR(chunk, controller);

      if (!chunk) {
        return;
      }
    }

    // Always odd count of lines and NLs between them.
    const linesAndNLs = chunk.split(NL_PATTERN);

    if (linesAndNLs.length < 2) {
      // No line separators.
      // Adjust partial line.
      this.#partial += chunk;

      return;
    }

    if (this.#handleFirstLine(linesAndNLs, controller)) {
      return linesAndNLs;
    }

    return;
  }

  #handleHangingCR(chunk: string, controller: TransformStreamDefaultController<string>): string {
    // Partial line ends with CR.
    // Enqueue it first.
    if (chunk.startsWith('\n')) {
      controller.enqueue(this.#partial + '\n');

      this.#partial = '';
      this.#hangingCR = false;

      return chunk.slice(1);
    }

    controller.enqueue(this.#partial);

    this.#partial = '';
    this.#hangingCR = false;

    return chunk;
  }

  #handleFirstLine(
    linesAndNLs: string[],
    controller: TransformStreamDefaultController<string>,
  ): boolean {
    const [firstLine, firstNL, secondLine] = linesAndNLs;

    if (linesAndNLs.length < 4 && !secondLine && firstNL === '\r') {
      // The only line ends with CR.
      // Adjust partial string and flag hanging CR.
      this.#partial += `${firstLine}\r`;
      this.#hangingCR = true;

      return false;
    }

    // Prefix the first line with partial one and enqueue it.
    // Hanging CR handled already.
    controller.enqueue(`${this.#partial}${firstLine}${firstNL}`);
    this.#partial = '';

    return true;
  }

  #flush(controller: TransformStreamDefaultController<string>): void {
    const partial = this.#partial;

    if (partial) {
      this.#partial = '';
      this.#hangingCR = false;
      controller.enqueue(partial);
    }
  }

}

const NL_PATTERN = /(\r\n?|\n)/;
