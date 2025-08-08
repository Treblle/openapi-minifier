# OpenAPI Minifier

A CLI tool to minify OpenAPI v3 specifications by removing redundant information not relevant to AI Agents and LLMs.

## Features

- ✅ **OpenAPI v3 Support**: Validates and processes OpenAPI 3.x specifications
- ✅ **Smart Minification**: Removes verbose elements while preserving API functionality
- ✅ **Advanced Optimizations**: Schema cleanup, unused component removal, and JSON minification
- ✅ **Multiple Presets**: Choose from `max`, `balanced`, or `min` presets
- ✅ **JSON & YAML**: Supports both input and output formats
- ✅ **Large File Support**: Efficiently handles multi-MB specification files
- ✅ **Validation**: Built-in OpenAPI specification validation
- ✅ **Detailed Stats**: Shows size reduction and removed elements

## Installation

```bash
npm install -g openapi-minifier
```

Or use directly with npx:

```bash
npx openapi-minifier input.json
```

## Usage

### Basic Usage

```bash
openapi-minify input.json
openapi-minify input.yaml -o output.yaml
```

### Presets

```bash
# Maximum reduction (recommended for AI/LLMs)
openapi-minify input.json --preset max

# Balanced approach (keeps schema descriptions)
openapi-minify input.json --preset balanced

# Minimal reduction (preserves documentation)
openapi-minify input.json --preset min
```

### Advanced Options

```bash
openapi-minify input.json \
  --output output.json \
  --preset balanced \
  --keep-examples=false \
  --keep-descriptions=schema-only \
  --format=json
```

## Presets

| Preset | Examples | Descriptions | Schema Cleanup | Unused Components | Size Reduction | Use Case |
|--------|----------|-------------|----------------|-------------------|----------------|----------|
| `max` | ❌ Remove | ❌ Remove all | ✅ Aggressive | ✅ Remove unused | **🔥 ~78%** | **Best for AI/LLMs** |
| `balanced` | ❌ Remove | 📄 Schema only | ✅ Conservative | ✅ Remove unused | **🔥 ~67%** | **Recommended default** |
| `min` | ✅ Keep | ✅ Keep all | ❌ None | ❌ Keep all | ~0% | Preserve documentation |

## What Gets Removed

### High Impact (Major size reduction)
- **JSON minification**: Remove all whitespace from JSON output (🔥 **+20% extra reduction**)
- **Unused schemas**: Remove unreferenced component schemas (🔥 **BIGGEST IMPACT**)
- **Schema properties**: Remove validation constraints (`format`, `pattern`, `minLength`, etc.)
- **Examples**: All request/response example bodies
- **Descriptions**: Verbose operation and parameter descriptions  
- **Summaries**: Operation summary fields
- **Tag descriptions**: Keep tag names, remove descriptions

### Elements Preserved (Essential for API calls)
- Path definitions and HTTP methods
- Parameter names, types, and required flags
- Schema definitions and properties
- Response status codes and structure
- Authentication/security schemes
- Required headers and formats

## Example Results

### Max Preset (Recommended for AI/LLMs)
```
📊 Results:
   Original size: 287.4 KB
   Minified size: 61.7 KB  
   Size reduction: 78.5%

   Optimizations applied:
   • Examples: 62 removed
   • Descriptions: 923 removed  
   • Summaries: 19 removed
   • Unused schemas: 193 removed
   • Schema properties cleaned (format, pattern, constraints)
   • JSON minification (removes all whitespace)
```

### Balanced Preset
```
📊 Results:
   Original size: 287.4 KB
   Minified size: 93.6 KB
   Size reduction: 67.4%

   Optimizations applied:
   • Examples: 62 removed
   • Descriptions: 734 removed (kept schema descriptions)
   • Summaries: 19 removed  
   • Unused schemas: 193 removed
   • Schema properties cleaned (format, pattern)
   • JSON minification (removes all whitespace)
```

## CLI Options

```
Options:
  -V, --version                    output the version number
  -o, --output <file>              Output file path
  --preset <preset>                Minification preset: max, balanced, min (default: "balanced")
  --keep-examples                  Keep example values (default: false)
  --keep-descriptions <mode>       Description handling: all, schema-only, none (default: "schema-only")
  --keep-summaries                 Keep summary fields (default: false)
  --keep-tags                      Keep tag descriptions (default: false)
  --no-validate                   Skip OpenAPI validation
  --format <format>                Output format: json, yaml (default: "json")
  -h, --help                       display help for command
```

## Development

```bash
# Clone the repository
git clone <repository-url>
cd openapi-minifier

# Install dependencies
npm install

# Run development version
npm run dev -- example.json --preset balanced

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT