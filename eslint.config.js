import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
export default ts.config(
    { ignores: ['.tmp/**', 'node_modules/**', 'vendor/**', 'bootstrap/ssr/**', 'public/**', 'storage/**', 'dist/**', '.npm-cache/**', '.browsers/**', 'test-results/**', 'playwright-report/**', 'resources/js/actions/**', 'resources/js/routes/**', 'resources/js/wayfinder/**', 'resources/js/components/ui/**'] },
    js.configs.recommended, ...ts.configs.recommended, ...vue.configs['flat/essential'],
    { files: ['**/*.vue'], extends: [...ts.configs.recommended], languageOptions: { parser: vueParser, parserOptions: { parser: ts.parser }, globals: { navigator: 'readonly', Event: 'readonly' } } },
    { files: ['**/*.ts'], rules: { '@typescript-eslint/no-explicit-any': 'error' } },
    { files: ['art/generated/mage-phantom-cast-*/**/*.{js,mjs}'], languageOptions: { globals: Object.fromEntries(['URL','process','Buffer','console','fetch','FormData','Blob','window','document','HTMLImageElement','performance','requestAnimationFrame','cancelAnimationFrame','innerWidth','innerHeight','ImageDecoder','Image','AbortController','setTimeout','clearTimeout','addEventListener','structuredClone'].map(name => [name, 'readonly'])) } },
);
