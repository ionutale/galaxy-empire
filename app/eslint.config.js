// Storybook linting removed

import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default [
	{
		ignores: [
			'build/**',
			'.svelte-kit/**',
			'node_modules/**',
			'eslint.config.js',
			'svelte.config.js',
			'verify_api.js',
			'.storybook/**',
			'drizzle.config.ts',
			'playwright.config.ts',
			'vitest-setup-client.ts',
			'e2e/**'
		]
	},
	{
		files: ['**/*.js', '**/*.ts'],
		...js.configs.recommended,
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		languageOptions: {
			parser: tsParser,
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				project: './tsconfig.json'
			}
		},
		rules: {
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte'],
		...sveltePlugin.configs.recommended[0],
		plugins: {
			'@typescript-eslint': tsPlugin,
			svelte: sveltePlugin
		},
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: ['.svelte']
			},
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'no-undef': 'off'
		}
	},
	prettier
];
