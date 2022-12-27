import { UcSchema } from '../schema/uc-schema.js';
import { DefaultUcDefinitions } from './impl/default.uc-definitions.js';
import { UcCodeAliases } from './impl/uc-code-aliases.js';
import { UcCodeDeclarations } from './impl/uc-code-declarations.js';
import { UcCodeImports } from './impl/uc-code-imports.js';
import { UcDefinitions } from './uc-definitions.js';
import { UcWriter } from './uc-writer.js';

export class UcWriterGenerator<in out T = unknown> {

  readonly #coders = new Map<string, UcDefinitions>();
  readonly #aliases: UcCodeAliases;
  readonly #imports: UcCodeImports;
  readonly #declarations: UcCodeDeclarations;
  readonly #schema: UcSchema<T>;
  #written = false;
  #code = '';

  constructor(options: UcWriter.Options<T>) {
    this.#aliases = new UcCodeAliases('value', 'writer');
    this.#imports = new UcCodeImports(this.#aliases);
    this.#declarations = new UcCodeDeclarations(this.#aliases);
    this.#schema = options.schema;

    this.#addCoder(DefaultUcDefinitions);
    if (options.definitions) {
      for (const coder of options.definitions) {
        this.#addCoder(coder);
      }
    }
  }

  #addCoder(coder: UcDefinitions): void {
    this.#coders.set(coder.from, coder);
  }

  import(from: string, name: string): string {
    return this.#imports.import(from, name);
  }

  declare(name: string, code: string): string {
    return this.#declarations.declare(name, code);
  }

  serialize(schema: UcSchema, value: string): void {
    const coder = this.#coders.get(schema.from);

    if (!coder) {
      throw new TypeError(`Unknown source of "${schema.type}" type definition: "${schema.from}"`);
    }

    coder.write(this as UcWriterGenerator, schema, value);
  }

  write(code: string): void {
    this.#code += `${code}\n`;
  }

  async generateFunction(functionName = ''): Promise<UcWriter<T>> {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(`
return (async () => {
${this.#dynamicImports()}

return ${this.#fn(functionName)};
})();
`) as () => Promise<UcWriter<T>>;

    return await factory();
  }

  #dynamicImports(): string {
    let imports = '';

    for (const [from, name, alias] of this.#imports) {
      imports += `const { ${name}: ${alias} } = await import('${from}');\n`;
    }

    return imports;
  }

  generateModule(functionName: string): string {
    return `
${this.#importStatements()}

export ${this.#fn(functionName)};
`;
  }

  #importStatements(): string {
    let imports = '';

    for (const [from, name, alias] of this.#imports) {
      imports += `import { ${name} as ${alias} } from '${from}';\n`;
    }

    return imports;
  }

  #fn(name: string): string {
    this.#write();

    return `
async function ${name}(value, writer) {
${this.#declarations}
${this.#code}
}
`;
  }

  #write(): void {
    if (!this.#written) {
      this.#written = true;
      this.serialize(this.#schema, 'value');
    }
  }

}
