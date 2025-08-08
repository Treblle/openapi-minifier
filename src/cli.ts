#!/usr/bin/env node

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { extname, resolve } from 'path';
import { minifyOpenAPI } from './minifier.js';
import { validateOpenAPI } from './validator.js';
import type { MinificationOptions } from './types.js';
import { colors, getTreblleAsciiArt } from './utils.js';

const program = new Command();

program
  .name('openapi-minify')
  .description('Minify OpenAPI v3 specifications by removing redundant information not relevant to AI Agents and LLMs')
  .version('1.0.0');

program
  .argument('<input>', 'Input OpenAPI file (JSON or YAML)')
  .option('-o, --output <file>', 'Output file path')
  .option('--preset <preset>', 'Minification preset: max, balanced, min', 'balanced')
  .option('--keep-examples', 'Keep example values', false)
  .option('--keep-descriptions <mode>', 'Description handling: all, schema-only, none', 'schema-only')
  .option('--keep-summaries', 'Keep summary fields', false)
  .option('--keep-tags', 'Keep tag descriptions', false)
  .option('--validate', 'Enable OpenAPI validation', false)
  .option('--format <format>', 'Output format: json, yaml', 'json')
  .action(async (input: string, options: any) => {
    try {
      // Display Treblle ASCII art
      console.log(getTreblleAsciiArt());
      console.log(colors.blue('🔍 OpenAPI Minifier v1.0.0\n'));
      
      // Resolve input file path
      const inputPath = resolve(input);
      console.log(colors.gray(`📁 Input: ${inputPath}`));
      
      // Determine output path
      const outputPath = options.output || getDefaultOutputPath(inputPath, options.format);
      console.log(colors.gray(`📁 Output: ${outputPath}\n`));
      
      // Read input file
      console.log(colors.yellow('📖 Reading input file...'));
      const inputContent = await readFile(inputPath, 'utf-8');
      const originalSize = Buffer.byteLength(inputContent, 'utf-8');
      
      // Validate OpenAPI spec if requested
      if (options.validate) {
        console.log(colors.yellow('✅ Validating OpenAPI specification...'));
        await validateOpenAPI(inputContent, getFileFormat(inputPath));
        console.log(colors.green('✅ OpenAPI specification is valid'));
      }
      
      // Build minification options
      const minificationOptions: MinificationOptions = {
        keepExamples: options.keepExamples,
        keepDescriptions: options.keepDescriptions,
        keepSummaries: options.keepSummaries,
        keepTags: options.keepTags,
        validate: options.validate,
        preset: options.preset,
      };
      
      // Apply preset overrides
      applyPreset(minificationOptions);
      
      console.log(colors.yellow('🔧 Minifying OpenAPI specification...'));
      console.log(colors.gray(`   Preset: ${minificationOptions.preset}`));
      console.log(colors.gray(`   Keep examples: ${minificationOptions.keepExamples}`));
      console.log(colors.gray(`   Keep descriptions: ${minificationOptions.keepDescriptions}`));
      
      // Minify the specification (use output format, not input format)
      const outputFormat = options.format === 'yaml' ? 'yaml' : 'json';
      const result = await minifyOpenAPI(inputContent, getFileFormat(inputPath), minificationOptions, outputFormat);
      
      // Write output file
      console.log(colors.yellow('💾 Writing minified specification...'));
      await writeFile(outputPath, result.minifiedContent);
      
      // Display results
      console.log(colors.green('\n🎉 Minification completed successfully!\n'));
      console.log(colors.bold('📊 Results:'));
      console.log(`   Original size: ${colors.cyan(formatBytes(originalSize))}`);
      console.log(`   Minified size: ${colors.cyan(formatBytes(result.stats.minifiedSize))}`);
      console.log(`   Size reduction: ${colors.green(result.stats.reductionPercentage.toFixed(1))}%`);
      console.log(`\n   Removed elements:`);
      console.log(`   • Examples: ${colors.yellow(result.stats.removedElements.examples.toString())}`);
      console.log(`   • Descriptions: ${colors.yellow(result.stats.removedElements.descriptions.toString())}`);
      console.log(`   • Summaries: ${colors.yellow(result.stats.removedElements.summaries.toString())}`);
      console.log(`   • Tags: ${colors.yellow(result.stats.removedElements.tags.toString())}`);
      
    } catch (error) {
      console.error(colors.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

function getDefaultOutputPath(inputPath: string, format: string): string {
  const ext = format === 'yaml' ? '.yaml' : '.json';
  const baseName = inputPath.replace(/\.(json|yaml|yml)$/i, '');
  return `${baseName}.minified${ext}`;
}

function getFileFormat(filePath: string): 'json' | 'yaml' {
  const ext = extname(filePath).toLowerCase();
  return ext === '.yaml' || ext === '.yml' ? 'yaml' : 'json';
}

function applyPreset(options: MinificationOptions): void {
  switch (options.preset) {
    case 'balanced':
      options.keepExamples = false;
      options.keepDescriptions = 'schema-only';
      options.keepSummaries = false;
      options.keepTags = false;
      break;
    case 'max':
      options.keepExamples = false;
      options.keepDescriptions = 'none';
      options.keepSummaries = false;
      options.keepTags = false;
      break;
    case 'min':
      options.keepExamples = true;
      options.keepDescriptions = 'all';
      options.keepSummaries = true;
      options.keepTags = true;
      break;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

program.parse();