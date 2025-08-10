# Treblle - API Intelligence Platform

[![Treblle API Intelligence](https://github.com/user-attachments/assets/b268ae9e-7c8a-4ade-95da-b4ac6fce6eea)](https://treblle.com)

[Website](http://treblle.com/) • [Documentation](https://docs.treblle.com/) • [Pricing](https://treblle.com/pricing)


Treblle is an API intelligence platfom that helps developers, teams and organizations understand their APIs from a single integration point.

***

## OpenAPI Minifier CLI

🧹 A CLI tool that compresses OpenAPI Specification files by up to 80% while preserving all essential details for understanding and integrating the API. Perfect for AI agents and LLMs as it drastically reduces token usage without sacrificing functionality.

## Requirements
- OpenAPI Specification Version 3.X 

## Features

- ✅ **JSON & YAML**: Supports both input and output formats
- ✅ **Large File Support**: Efficiently handles multi-MB specification files
- ✅ **Easy To Use Presets**: Choose from `max`, `balanced`, or `min` presets
- ✅ **Deprecated Path Removal**: Remove unused and deprecated endpoints
- ✅ **Schema Extraction**: Extract inlined schemas into reusable components
- ✅ **Smart Minification**: Removes verbose elements while preserving API functionality
- ✅ **Advanced Optimizations**: Schema cleanup, unused component removal, and JSON minification
- ✅ **Developer Friendly**: Detailed statistics and CLI friendly UI

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
  --keep-examples \
  --keep-descriptions schema-only \
  --remove-deprecated \
  --extract-common-responses \
  --validate \
  --format json
```

## CLI Options

```
Options:
  -V, --version                        output the version number
  -o, --output <file>                  Output file path
  --preset <preset>                    Minification preset: max, balanced, min (default: "balanced")
  --keep-examples                      Keep example values (default: false)
  --keep-descriptions <mode>           Description handling: all, schema-only, none (default: "schema-only")
  --keep-summaries                     Keep summary fields (default: false)
  --keep-tags                          Keep tag descriptions (default: false)
  --remove-deprecated                  Remove deprecated paths and operations (default: false)
  --extract-common-responses           Extract common responses to components/responses (default: false)
  --extract-common-schemas             Extract common schemas to components/schemas (default: false)
  --validate                           Enable OpenAPI validation (default: false)
  --format <format>                    Output format: json, yaml (default: "json")
  -h, --help                           display help for command
```

## Presets

| Preset | Examples | Descriptions | Schema Cleanup | Remove Deprecated | Extract Components | Size Reduction | Use Case |
|--------|----------|-------------|----------------|-------------------|-------------------|----------------|----------|
| `max` | ❌ Remove | ❌ Remove all | ✅ Aggressive | ✅ Remove | ✅ Extract | **🔥 ~78%** | **Best for AI/LLMs** |
| `balanced` | ❌ Remove | 📄 Schema only | ✅ Conservative | ✅ Remove | ✅ Extract | **🔥 ~67%** | **Recommended default** |
| `min` | ✅ Keep | ✅ Keep all | ❌ None | ❌ Keep | ❌ No extraction | ~0% | Preserve documentation |

## What Gets Removed

- **JSON minification**: Remove all whitespace from JSON output
- **Unused schemas**: Remove unreferenced component schemas
- **Schema properties**: Remove validation constraints (`format`, `pattern`, `minLength`, etc.)
- **Examples**: All request/response example bodies
- **Descriptions**: Verbose operation and parameter descriptions  
- **Summaries**: Operation summary fields
- **Tag descriptions**: Keep tag names, remove descriptions


## Example Results

Test results using sample OpenAPI specifications included in this repository:

### Jira API (2.5 MB)

| Preset | Output Size | Reduction | Examples | Descriptions | Summaries | Tags | Deprecated | Extracted |
|--------|-------------|-----------|----------|-------------|-----------|------|------------|-----------|
| **max** | **767 KB** | **69.4%** | 0 removed | 3,116 removed | 498 removed | 13 removed | 4 removed | 1,262 total |
| balanced | 1,021 KB | 59.3% | 0 removed | 725 removed | 498 removed | 13 removed | 4 removed | 1,262 total |
| min | 1.6 MB | 35.0% | 0 removed | 0 removed | 0 removed | 0 removed | 0 removed | 0 total |

### Stripe API (6.7 MB)

| Preset | Output Size | Reduction | Examples | Descriptions | Summaries | Tags | Deprecated | Extracted |
|--------|-------------|-----------|----------|-------------|-----------|------|------------|-----------|
| **max** | **1.8 MB** | **72.4%** | 0 removed | 8,315 removed | 546 removed | 0 removed | 2 removed | 993 total |
| balanced | 2.8 MB | 57.6% | 0 removed | 862 removed | 546 removed | 0 removed | 2 removed | 993 total |
| min | 3.2 MB | 51.8% | 0 removed | 0 removed | 0 removed | 0 removed | 0 removed | 0 total |

### OpenAPI Sample (1.9 MB)

| Preset | Output Size | Reduction | Examples | Descriptions | Summaries | Tags | Deprecated | Extracted |
|--------|-------------|-----------|----------|-------------|-----------|------|------------|-----------|
| **max** | **446 KB** | **77.2%** | 162 removed | 3,328 removed | 164 removed | 0 removed | 0 removed | 99 total |
| balanced | 686 KB | 64.9% | 162 removed | 844 removed | 164 removed | 0 removed | 0 removed | 99 total |
| min | 1.4 MB | 25.6% | 0 removed | 0 removed | 0 removed | 0 removed | 0 removed | 0 total |

## Support

If you have problems of any kind feel free to reach out via <https://treblle.com> or email support@treblle.com and we'll do our best to help you out.

## License

Copyright 2025, Treblle Inc. Licensed under the MIT license:
http://www.opensource.org/licenses/mit-license.php