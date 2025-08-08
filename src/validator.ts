import SwaggerParser from '@apidevtools/swagger-parser';
import yaml from 'js-yaml';

export async function validateOpenAPI(content: string, format: 'json' | 'yaml'): Promise<void> {
  try {
    let spec: unknown;
    
    if (format === 'yaml') {
      spec = yaml.load(content);
    } else {
      spec = JSON.parse(content);
    }
    
    // Validate the OpenAPI specification
    await SwaggerParser.validate(spec as any);
    
    // Check if it's OpenAPI v3
    if (typeof spec === 'object' && spec !== null && 'openapi' in spec) {
      const version = (spec as any).openapi;
      if (!version || !version.startsWith('3.')) {
        throw new Error(`Unsupported OpenAPI version: ${version}. Only OpenAPI v3.x is supported.`);
      }
    } else {
      throw new Error('Invalid OpenAPI specification: missing "openapi" field');
    }
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAPI validation failed: ${error.message}`);
    }
    throw new Error('OpenAPI validation failed: Unknown error');
  }
}