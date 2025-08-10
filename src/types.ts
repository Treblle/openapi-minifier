export interface MinificationOptions {
  keepExamples: boolean;
  keepDescriptions: 'all' | 'schema-only' | 'none';
  keepSummaries: boolean;
  keepTags: boolean;
  removeDeprecated: boolean;
  extractCommonResponses: boolean;
  extractCommonSchemas: boolean;
  validate: boolean;
  preset?: 'max' | 'balanced' | 'min';
}

export interface MinificationResult {
  originalSize: number;
  minifiedSize: number;
  reductionPercentage: number;
  removedElements: {
    examples: number;
    descriptions: number;
    summaries: number;
    tags: number;
    deprecatedPaths: number;
    extractedResponses: number;
    extractedSchemas: number;
  };
}

export interface OpenAPISpec {
  openapi: string;
  info: Record<string, unknown>;
  servers?: Array<Record<string, unknown>>;
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}