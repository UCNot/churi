export async function collectLines(lines: AsyncIterable<string>): Promise<string[]> {
  const result: string[] = [];

  for await (const line of lines) {
    result.push(line);
  }

  return result;
}
