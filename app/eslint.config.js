// Storybook linting removed

import prettier from 'eslint-config-prettier';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default [
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	{
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		languageOptions: {
			parser: tsParser,
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				project: './tsconfig.json',
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			'no-undef': 'off'
		}
	},
	...(svelte.configs.recommended ? [svelte.configs.recommended] : []),
	prettier,
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: tsParser,
				svelteConfig
			}
		}
	}
];
