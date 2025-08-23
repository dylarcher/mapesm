#!/usr/bin/env node

/**
 * @fileoverview Generate examples of every possible chart variation
 * Creates comprehensive examples using all available parameters and arguments
 * across all test models and styles.
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

// Configuration
const LAYOUT_STYLES = ['circular', 'diagonal', 'linear', 'tree', 'grid'];
const DIRECTION_MODES = ['horizontal']; // vertical temporarily disabled
const THEME_MODES = ['light', 'dark'];
const DEPTH_LEVELS = [1, 2, 3, 4, 'infinite'];
// const HIDDEN_OPTIONS = [false, true]; // hidden temporarily disabled

// Focus on size-based test models only
const TEST_MODELS_DIR = './test/models';
const TARGETED_MODELS = ['small-size-project', 'medium-size-project', 'large-size-project'];

// Create output directory
const OUTPUT_DIR = './examples';
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate timestamp for unique filenames
const now = new Date();
const timestamp = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

console.log(chalk.cyan('🎨 Generating comprehensive chart examples...'));
console.log(chalk.yellow(`📊 Targeting ${TARGETED_MODELS.length} size-based test models: ${TARGETED_MODELS.join(', ')}`));
console.log(chalk.yellow(`🎯 Will generate ${LAYOUT_STYLES.length * DIRECTION_MODES.length * THEME_MODES.length * TARGETED_MODELS.length} layout+direction+theme combinations`));
console.log(chalk.yellow(`⚙️  Plus ${TARGETED_MODELS.length * DEPTH_LEVELS.length} depth parameter variations`));

const totalEstimated = (LAYOUT_STYLES.length * DIRECTION_MODES.length * THEME_MODES.length * TARGETED_MODELS.length) +
  (TARGETED_MODELS.length * DEPTH_LEVELS.length) + 6; // combination examples
console.log(chalk.yellow(`📈 Total estimated examples: ${totalEstimated}`));
console.log(chalk.gray(`Note: vertical direction and --hidden option are temporarily disabled`));

let totalGenerated = 0;
let errors = 0;

// Generate examples for each targeted model
for (const model of TARGETED_MODELS) {
  console.log(chalk.blue(`\n🔄 Processing model: ${model}`));

  for (const layout of LAYOUT_STYLES) {
    for (const direction of DIRECTION_MODES) {
      for (const theme of THEME_MODES) {
        const outputFileName = `${model}-${layout}-${direction}-${theme}-${timestamp}.svg`;
        const modelPath = `${TEST_MODELS_DIR}/${model}`;

        try {
          const command = `node bin/cli.js "${modelPath}" -l ${layout} --direction ${direction} -m ${theme} -o "${outputFileName}"`;
          console.log(chalk.gray(`  ⚡ ${layout} + ${direction} + ${theme}`));

          execSync(command, { stdio: 'pipe' });
          totalGenerated++;

          // Add a small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.log(chalk.red(`  ❌ Failed: ${layout} + ${direction} + ${theme} - ${error.message.split('\n')[0]}`));
          errors++;
        }
      }
    }
  }
}

console.log(chalk.green(`\n✅ Generation complete!`));
console.log(chalk.cyan(`📈 Total examples generated: ${totalGenerated}`));
if (errors > 0) {
  console.log(chalk.red(`❌ Errors encountered: ${errors}`));
}

// Generate additional examples with different parameters
console.log(chalk.cyan('\n🎨 Generating parameter variation examples...'));

// Test all targeted models for parameter variations
for (const model of TARGETED_MODELS) {
  console.log(chalk.blue(`\n🔄 Parameter variations for: ${model}`));
  const modelPath = `${TEST_MODELS_DIR}/${model}`;

  // Test different depth levels
  for (const depth of DEPTH_LEVELS) {
    const depthArg = depth === 'infinite' ? '' : `-d ${depth}`;
    const outputFileName = `${model}-depth${depth}-${timestamp}.svg`;

    try {
      const command = `node bin/cli.js "${modelPath}" ${depthArg} -o "${outputFileName}"`;
      console.log(chalk.gray(`  📏 Depth: ${depth}`));
      execSync(command, { stdio: 'pipe' });
      totalGenerated++;

      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.log(chalk.red(`  ❌ Failed depth ${depth} - ${error.message.split('\n')[0]}`));
      errors++;
    }
  }

  // Test hidden files option - TEMPORARILY DISABLED
  // for (const hidden of HIDDEN_OPTIONS) {
  //   const hiddenArg = hidden ? '--hidden' : '';
  //   const outputFileName = `${model}-hidden${hidden}-${timestamp}.svg`;

  //   try {
  //     const command = `node bin/cli.js "${modelPath}" ${hiddenArg} -o "${outputFileName}"`;
  //     console.log(chalk.gray(`  👁️  Hidden: ${hidden}`));
  //     execSync(command, { stdio: 'pipe' });
  //     totalGenerated++;

  //     await new Promise(resolve => setTimeout(resolve, 50));
  //   } catch (error) {
  //     console.log(chalk.red(`  ❌ Failed hidden ${hidden} - ${error.message.split('\n')[0]}`));
  //     errors++;
  //   }
  // }
}

// Generate combination examples (layout + theme + depth + hidden)
console.log(chalk.cyan('\n🎨 Generating advanced combination examples...'));

// Use medium-size-project for combination testing (good balance of complexity)
const combinationModel = 'medium-size-project';
const modelPath = `${TEST_MODELS_DIR}/${combinationModel}`;

// Generate a selection of interesting combinations across all parameters
const combinations = [
  { layout: 'circular', theme: 'dark', depth: 2, hidden: false },
  { layout: 'horizontal', theme: 'light', depth: 3, hidden: true },
  { layout: 'vertical', theme: 'system', depth: 1, hidden: false },
  { layout: 'tree', theme: 'auto', depth: 'infinite', hidden: true },
  { layout: 'grid', theme: 'dark', depth: 2, hidden: false },
  { layout: 'diagonal', theme: 'light', depth: 'infinite', hidden: true },
];

for (let i = 0; i < combinations.length; i++) {
  const combo = combinations[i];
  const { layout, theme, depth, hidden } = combo;
  const depthArg = depth === 'infinite' ? '' : `-d ${depth}`;
  const hiddenArg = hidden ? '--hidden' : '';
  const outputFileName = `combo${i + 1}-${layout}-${theme}-d${depth}-h${hidden}-${timestamp}.svg`;

  try {
    const command = `node bin/cli.js "${modelPath}" -l ${layout} -m ${theme} ${depthArg} ${hiddenArg} -o "${outputFileName}"`;
    console.log(chalk.gray(`  🎯 Combo ${i + 1}: ${layout} + ${theme} + depth${depth} + hidden${hidden}`));
    execSync(command, { stdio: 'pipe' });
    totalGenerated++;

    await new Promise(resolve => setTimeout(resolve, 50));
  } catch (error) {
    console.log(chalk.red(`  ❌ Failed combo ${i + 1} - ${error.message.split('\n')[0]}`));
    errors++;
  }
}

console.log(chalk.green(`\n🎉 All examples generated!`));
console.log(chalk.cyan(`📊 Successfully created: ${totalGenerated} examples`));
if (errors > 0) {
  console.log(chalk.red(`❌ Failed to generate: ${errors} examples`));
}
console.log(chalk.yellow(`📁 All outputs saved to .tmp/ directory with timestamp: ${timestamp}`));

// Generate detailed summary report
console.log(chalk.cyan('\n📋 Generation Summary:'));
console.log(chalk.white(`• Target models: ${TARGETED_MODELS.join(', ')}`));
console.log(chalk.white(`• Layout styles tested: ${LAYOUT_STYLES.join(', ')}`));
console.log(chalk.white(`• Direction modes tested: ${DIRECTION_MODES.join(', ')}`));
console.log(chalk.white(`• Theme modes tested: ${THEME_MODES.join(', ')}`));
console.log(chalk.white(`• Depth levels tested: ${DEPTH_LEVELS.join(', ')}`));
// console.log(chalk.white(`• Hidden files options: ${HIDDEN_OPTIONS.join(', ')}`)); // TEMPORARILY DISABLED
console.log(chalk.white(`• Advanced combinations: ${combinations.length} parameter combinations`));

console.log(chalk.cyan('\n📈 Example Breakdown:'));
console.log(chalk.gray(`  • Layout + Direction + Theme combinations: ${LAYOUT_STYLES.length * DIRECTION_MODES.length * THEME_MODES.length * TARGETED_MODELS.length}`));
console.log(chalk.gray(`  • Depth variations: ${DEPTH_LEVELS.length * TARGETED_MODELS.length}`));
// console.log(chalk.gray(`  • Hidden file variations: ${HIDDEN_OPTIONS.length * TARGETED_MODELS.length}`)); // TEMPORARILY DISABLED
console.log(chalk.gray(`  • Advanced combinations: ${combinations.length}`));

console.log(chalk.green(`\n✨ Complete size-based project demonstration generated!`));
console.log(chalk.yellow(`🎯 ${timestamp} - Ready for review and analysis`));
