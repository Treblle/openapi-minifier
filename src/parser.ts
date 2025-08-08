import yaml from 'js-yaml';
import type { OpenAPISpec } from './types.js';

export function parseOpenAPI(content: string, format: 'json' | 'yaml'): OpenAPISpec {
  try {
    let spec: unknown;
    
    if (format === 'yaml') {
      spec = yaml.load(content, { 
        schema: yaml.JSON_SCHEMA,
        onWarning: (warning: any) => {
          console.warn('YAML parsing warning:', warning);
        }
      });
    } else {
      spec = JSON.parse(content);
    }
    
    if (!spec || typeof spec !== 'object') {
      throw new Error('Invalid OpenAPI specification: not an object');
    }
    
    const openApiSpec = spec as OpenAPISpec;
    
    // Basic structure validation
    if (!openApiSpec.openapi) {
      throw new Error('Missing "openapi" field');
    }
    
    if (!openApiSpec.info) {
      throw new Error('Missing "info" field');
    }
    
    if (!openApiSpec.paths) {
      throw new Error('Missing "paths" field');
    }
    
    return openApiSpec;
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse OpenAPI specification: ${error.message}`);
    }
    throw new Error('Failed to parse OpenAPI specification: Unknown error');
  }
}

export function serializeOpenAPI(spec: OpenAPISpec, format: 'json' | 'yaml'): string {
  try {
    if (format === 'yaml') {
      return yaml.dump(spec, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });
    } else {
      // Use compact JSON formatting (no whitespace) for maximum size reduction
      return JSON.stringify(spec);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to serialize OpenAPI specification: ${error.message}`);
    }
    throw new Error('Failed to serialize OpenAPI specification: Unknown error');
  }
}