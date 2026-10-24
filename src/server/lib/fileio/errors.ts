export class FileNotFoundError extends Error {
  constructor(public readonly filePath: string) {
    super(`File not found: ${filePath}`);
    this.name = 'FileNotFoundError';
  }
}

export class YamlParseError extends Error {
  constructor(public readonly filePath: string, cause: unknown) {
    super(`Failed to parse YAML in ${filePath}: ${String(cause)}`);
    this.name = 'YamlParseError';
  }
}

export class JsonParseError extends Error {
  constructor(public readonly filePath: string, cause: unknown) {
    super(`Failed to parse JSON in ${filePath}: ${String(cause)}`);
    this.name = 'JsonParseError';
  }
}

export class BlockNotFoundError extends Error {
  constructor(public readonly heading: string, filePath: string) {
    super(`Heading '${heading}' not found in file: ${filePath}`);
    this.name = 'BlockNotFoundError';
  }
}
