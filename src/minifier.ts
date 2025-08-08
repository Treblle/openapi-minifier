import { parseOpenAPI, serializeOpenAPI } from './parser.js';
import { countNestedKey, deepClone, isObject } from './utils.js';
import type { MinificationOptions, MinificationResult } from './types.js';

export interface MinifyResult {
  minifiedContent: string;
  stats: MinificationResult;
}

export async function minifyOpenAPI(
  content: string, 
  inputFormat: 'json' | 'yaml', 
  options: MinificationOptions,
  outputFormat?: 'json' | 'yaml'
): Promise<MinifyResult> {
  
  // Parse the OpenAPI specification
  const originalSpec = parseOpenAPI(content, inputFormat);
  const spec = deepClone(originalSpec);
  
  // Track removed elements
  const removedElements = {
    examples: 0,
    descriptions: 0,
    summaries: 0,
    tags: 0,
  };
  
  // Count original elements
  const originalCounts = {
    examples: countNestedKey(originalSpec, 'examples'),
    descriptions: countNestedKey(originalSpec, 'description'),
    summaries: countNestedKey(originalSpec, 'summary'),
    tags: countNestedKey(originalSpec, 'tags'),
  };
  
  // Apply minification rules
  minifyObject(spec, options, removedElements);
  
  // Remove unused components (for max and balanced presets)
  if (options.preset === 'max' || options.preset === 'balanced') {
    removeUnusedComponents(spec);
  }
  
  // Ensure we keep essential OpenAPI structure
  if (!spec.openapi) spec.openapi = originalSpec.openapi;
  if (!spec.info) spec.info = originalSpec.info;
  if (!spec.paths) spec.paths = originalSpec.paths;
  
  // Calculate final counts
  const finalCounts = {
    examples: countNestedKey(spec, 'examples'),
    descriptions: countNestedKey(spec, 'description'),
    summaries: countNestedKey(spec, 'summary'),
    tags: countNestedKey(spec, 'tags'),
  };
  
  // Calculate actual removals
  removedElements.examples = originalCounts.examples - finalCounts.examples;
  removedElements.descriptions = originalCounts.descriptions - finalCounts.descriptions;
  removedElements.summaries = originalCounts.summaries - finalCounts.summaries;
  removedElements.tags = originalCounts.tags - finalCounts.tags;
  
  // Serialize the minified specification
  const finalFormat = outputFormat || inputFormat;
  const minifiedContent = serializeOpenAPI(spec, finalFormat);
  
  // Calculate size statistics
  const originalSize = Buffer.byteLength(content, 'utf-8');
  const minifiedSize = Buffer.byteLength(minifiedContent, 'utf-8');
  const reductionPercentage = ((originalSize - minifiedSize) / originalSize) * 100;
  
  return {
    minifiedContent,
    stats: {
      originalSize,
      minifiedSize,
      reductionPercentage,
      removedElements,
    },
  };
}

function minifyObject(
  obj: unknown, 
  options: MinificationOptions, 
  removedElements: { examples: number; descriptions: number; summaries: number; tags: number },
  path: string[] = []
): void {
  if (!isObject(obj)) return;
  
  const keys = Object.keys(obj);
  
  // Skip essential root level fields
  if (path.length === 0) {
    const protectedFields = ['openapi', 'info', 'paths'];
    if (keys.some(key => protectedFields.includes(key))) {
      // Process each key individually but don't remove protected ones
      for (const key of keys) {
        if (protectedFields.includes(key)) {
          const currentPath = [...path, key];
          const value = obj[key];
          if (isObject(value) || Array.isArray(value)) {
            minifyObject(value, options, removedElements, currentPath);
          }
        } else {
          // Process non-protected fields normally
          const currentPath = [...path, key];
          const value = obj[key];
          processField(obj, key, value, options, removedElements, currentPath);
        }
      }
      return;
    }
  }
  
  for (const key of keys) {
    const currentPath = [...path, key];
    const value = obj[key];
    processField(obj, key, value, options, removedElements, currentPath);
  }
}

function processField(
  obj: Record<string, unknown>,
  key: string,
  value: unknown,
  options: MinificationOptions,
  removedElements: { examples: number; descriptions: number; summaries: number; tags: number },
  currentPath: string[]
): void {
  // Remove examples if not keeping them
  if (key === 'examples' && !options.keepExamples) {
    delete obj[key];
    return;
  }
  
  // Handle descriptions based on options
  if (key === 'description' && options.keepDescriptions !== 'all') {
    // Never remove required description fields in OpenAPI spec
    const isRequiredDescription = isRequiredDescriptionField(currentPath);
    
    if (!isRequiredDescription) {
      if (options.keepDescriptions === 'none') {
        delete obj[key];
        return;
      } else if (options.keepDescriptions === 'schema-only') {
        // Keep descriptions only in schema definitions and component schemas
        const isInSchema = currentPath.some(segment => 
          segment === 'schemas' || 
          segment === 'properties' ||
          (segment === 'components' && currentPath.includes('schemas'))
        );
        
        if (!isInSchema) {
          delete obj[key];
          return;
        }
      }
    }
  }
  
  // Remove summaries if not keeping them (but preserve if required)
  if (key === 'summary' && !options.keepSummaries) {
    // Check if this is in a context where summary might be required
    const isRequiredSummary = isRequiredSummaryField(currentPath);
    if (!isRequiredSummary) {
      delete obj[key];
      return;
    }
  }
  
  // Handle tags - remove descriptions but keep the tag array structure
  if (key === 'tags' && !options.keepTags && Array.isArray(value)) {
    // If it's the global tags array, remove descriptions
    if (currentPath.length === 1) {
      const cleanedTags = value.map(tag => {
        if (isObject(tag) && 'name' in tag) {
          return { name: tag.name };
        }
        return tag;
      });
      obj[key] = cleanedTags;
    }
    // For operation tags (array of strings), keep as is
  }
  
  // Clean up info section - keep essential fields only
  if (currentPath[0] === 'info' && isObject(value)) {
    cleanInfoSection(obj as Record<string, unknown>, options);
  }
  
  // Clean up servers - remove descriptions
  if (key === 'servers' && Array.isArray(value)) {
    const cleanedServers = value.map(server => {
      if (isObject(server)) {
        const cleaned = { ...server };
        if (!options.keepDescriptions || options.keepDescriptions === 'none') {
          delete cleaned.description;
        }
        return cleaned;
      }
      return server;
    });
    obj[key] = cleanedServers;
  }
  
  // Remove verbose error responses - keep essential ones only
  if (key === 'responses' && isObject(value)) {
    cleanResponses(value, options);
  }
  
  // Remove parameter examples
  if (key === 'parameters' && Array.isArray(value)) {
    const cleanedParams = value.map(param => {
      if (isObject(param)) {
        const cleaned = { ...param };
        if (!options.keepExamples) {
          delete cleaned.examples;
          delete cleaned.example;
        }
        return cleaned;
      }
      return param;
    });
    obj[key] = cleanedParams;
  }
  
  // Clean up schema properties if we're in a schema
  if (isInSchema(currentPath)) {
    cleanSchemaProperties(obj, key, value, options);
  }
  
  // Recursively minify nested objects and arrays
  if (isObject(value)) {
    minifyObject(value, options, removedElements, currentPath);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => {
      minifyObject(item, options, removedElements, [...currentPath, index.toString()]);
    });
  }
}

function cleanInfoSection(obj: Record<string, unknown>, options: MinificationOptions): void {
  const essentialFields = ['title', 'version'];
  const optionalFields = ['description', 'contact', 'license', 'termsOfService'];
  
  // Always keep essential fields
  const cleaned: Record<string, unknown> = {};
  for (const field of essentialFields) {
    if (field in obj) {
      cleaned[field] = obj[field];
    }
  }
  
  // Handle optional fields based on options
  for (const field of optionalFields) {
    if (field in obj) {
      if (field === 'description' && options.keepDescriptions === 'none') {
        continue; // Skip description
      }
      if (field === 'contact' || field === 'license') {
        // Keep contact and license but clean them
        if (isObject(obj[field])) {
          if (field === 'contact') {
            const contact = obj[field] as Record<string, unknown>;
            const cleanedContact: Record<string, unknown> = {};
            if ('name' in contact) cleanedContact.name = contact.name;
            if ('url' in contact) cleanedContact.url = contact.url;
            if ('email' in contact) cleanedContact.email = contact.email;
            cleaned[field] = cleanedContact;
          } else if (field === 'license') {
            const license = obj[field] as Record<string, unknown>;
            const cleanedLicense: Record<string, unknown> = {};
            if ('name' in license) cleanedLicense.name = license.name;
            if ('url' in license) cleanedLicense.url = license.url;
            cleaned[field] = cleanedLicense;
          }
        }
      } else {
        cleaned[field] = obj[field];
      }
    }
  }
  
  // Replace the info object
  Object.keys(obj).forEach(key => delete obj[key]);
  Object.assign(obj, cleaned);
}

function cleanResponses(responses: Record<string, unknown>, options: MinificationOptions): void {
  for (const [statusCode, response] of Object.entries(responses)) {
    if (isObject(response)) {
      const cleaned: Record<string, unknown> = { ...response };
      
      // Description is required in OpenAPI responses - keep original or provide minimal one
      if (!cleaned.description) {
        cleaned.description = getMinimalResponseDescription(statusCode);
      } else if (options.keepDescriptions === 'none') {
        // Replace with minimal description but don't remove it completely
        cleaned.description = getMinimalResponseDescription(statusCode);
      }
      
      if (!options.keepExamples) {
        if (isObject(cleaned.content)) {
          for (const [, mediaTypeObj] of Object.entries(cleaned.content)) {
            if (isObject(mediaTypeObj)) {
              delete (mediaTypeObj as Record<string, unknown>).examples;
              delete (mediaTypeObj as Record<string, unknown>).example;
            }
          }
        }
      }
      responses[statusCode] = cleaned;
    }
  }
}

function getMinimalResponseDescription(statusCode: string): string {
  const descriptions: Record<string, string> = {
    '200': 'Success',
    '201': 'Created', 
    '204': 'No Content',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '412': 'Precondition Failed',
    '429': 'Too Many Requests',
    '500': 'Internal Server Error',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
  };
  return descriptions[statusCode] || 'Response';
}

function isRequiredDescriptionField(path: string[]): boolean {
  // Description is required in these OpenAPI contexts:
  // - responses (all response objects must have description)
  // - info object (description is optional but commonly expected)
  // - tag objects (description is required)
  // - parameter objects (description is optional but recommended)
  
  // Check if we're in a response object
  if (path.includes('responses') && path[path.length - 1] === 'description') {
    return true;
  }
  
  // Check if we're in a tag object
  if (path.includes('tags') && path[path.length - 1] === 'description') {
    return true;
  }
  
  return false;
}

function isRequiredSummaryField(_path: string[]): boolean {
  // Summary is generally not required in OpenAPI, but some tools expect it
  // For now, we'll be conservative and not mark any as required
  // Operation summaries are recommended but not required
  return false;
}

function isInSchema(path: string[]): boolean {
  return path.includes('schemas') || 
         path.includes('properties') || 
         path.some(segment => segment === 'schema') ||
         (path.includes('components') && path.includes('schemas'));
}

function cleanSchemaProperties(
  obj: Record<string, unknown>, 
  key: string, 
  value: unknown, 
  options: MinificationOptions
): void {
  // Remove validation constraints and formatting hints
  const schemaPropertiesToRemove = [
    'format',      // email, date-time, etc.
    'pattern',     // regex patterns
    'minLength',   // string constraints
    'maxLength',
    'minimum',     // number constraints  
    'maximum',
    'multipleOf',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'minItems',    // array constraints
    'maxItems',
    'uniqueItems',
    'minProperties', // object constraints
    'maxProperties',
    'additionalProperties', // unless it's a boolean true
    'title',       // schema titles
    'default',     // default values
    'readOnly',    // API metadata
    'writeOnly',
    'deprecated',
    'nullable',    // can be inferred from type
  ];
  
  // For max preset, be more aggressive
  if (options.preset === 'max') {
    if (schemaPropertiesToRemove.includes(key)) {
      delete obj[key];
      return;
    }
    
    // Special handling for additionalProperties
    if (key === 'additionalProperties' && value !== true) {
      delete obj[key];
      return;
    }
  }
  
  // For balanced preset, keep some essential ones
  if (options.preset === 'balanced') {
    const balancedRemovalList = [
      'format',
      'pattern', 
      'title',
      'default',
      'readOnly',
      'writeOnly',
      'deprecated',
      'nullable',
    ];
    
    if (balancedRemovalList.includes(key)) {
      delete obj[key];
      return;
    }
  }
}

function removeUnusedComponents(spec: any): void {
  if (!spec.components || !spec.components.schemas) {
    return;
  }
  
  // Find all $ref references in the spec (excluding components section)
  const referencedSchemas = new Set<string>();
  
  function findReferences(obj: any, currentPath: string[] = []): void {
    if (!obj || typeof obj !== 'object') return;
    
    // Skip the components section when looking for references
    if (currentPath[0] === 'components') return;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        findReferences(item, [...currentPath, index.toString()]);
      });
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (key === '$ref' && typeof value === 'string') {
          // Extract schema name from $ref like "#/components/schemas/SchemaName"
          const match = value.match(/#\/components\/schemas\/(.+)$/);
          if (match) {
            referencedSchemas.add(match[1]);
          }
        } else {
          findReferences(value, [...currentPath, key]);
        }
      }
    }
  }
  
  // Find all references starting from paths and other top-level sections
  findReferences({ 
    paths: spec.paths,
    ...(spec.webhooks && { webhooks: spec.webhooks }),
    ...(spec.callbacks && { callbacks: spec.callbacks })
  });
  
  // Also include schemas referenced by other schemas (transitive dependencies)
  function findTransitiveReferences(schemaName: string, visited = new Set<string>()): void {
    if (visited.has(schemaName)) return;
    visited.add(schemaName);
    
    const schema = spec.components.schemas[schemaName];
    if (schema) {
      // Find references within this schema and add them to referencedSchemas
      const tempRefs = new Set<string>();
      
      function findRefsInSchema(obj: any): void {
        if (!obj || typeof obj !== 'object') return;
        
        if (Array.isArray(obj)) {
          obj.forEach(item => findRefsInSchema(item));
        } else {
          for (const [key, value] of Object.entries(obj)) {
            if (key === '$ref' && typeof value === 'string') {
              const match = value.match(/#\/components\/schemas\/(.+)$/);
              if (match) {
                tempRefs.add(match[1]);
                referencedSchemas.add(match[1]); // Add to main set
              }
            } else {
              findRefsInSchema(value);
            }
          }
        }
      }
      
      findRefsInSchema(schema);
      
      // Recursively find references in newly found schemas
      for (const newRef of tempRefs) {
        findTransitiveReferences(newRef, visited);
      }
    }
  }
  
  // Find transitive references
  const initialRefs = new Set(referencedSchemas);
  for (const schemaName of initialRefs) {
    findTransitiveReferences(schemaName);
  }
  
  // Remove unused schemas
  const originalSchemaCount = Object.keys(spec.components.schemas).length;
  const usedSchemas: Record<string, any> = {};
  
  for (const schemaName of referencedSchemas) {
    if (spec.components.schemas[schemaName]) {
      usedSchemas[schemaName] = spec.components.schemas[schemaName];
    }
  }
  
  spec.components.schemas = usedSchemas;
  
  const removedSchemaCount = originalSchemaCount - Object.keys(usedSchemas).length;
  
  if (removedSchemaCount > 0) {
    console.log(`   Removed ${removedSchemaCount} unused schemas`);
  }
  
  // Clean up empty components
  if (Object.keys(spec.components.schemas).length === 0) {
    delete spec.components.schemas;
  }
  
  if (spec.components && Object.keys(spec.components).length === 0) {
    delete spec.components;
  }
}