import ts from 'typescript';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import process from 'node:process';

const norm = path => path.replaceAll('\\', '/');
const sha = data => createHash('sha256').update(data).digest('hex');
const manifest = JSON.parse(readFileSync('tests/historical/manifest.json', 'utf8'));
for (const file of manifest.files) {
    if (sha(readFileSync(file.archived)) !== file.archivedSHA256) throw new Error(`Historical source/fixture changed: ${file.archived}`);
    if (file.archived.endsWith('.json') && file.archivedSHA256 !== file.originalSHA256) throw new Error(`Golden fixture changed: ${file.archived}`);
}
function files(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = `${directory}/${entry.name}`;
        return entry.isDirectory() ? files(path) : [path];
    });
}
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
if (parsed.errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
    getCanonicalFileName: name => name, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n',
}));
if (!parsed.options.strict || !parsed.options.noUnusedLocals || !parsed.options.noUnusedParameters) throw new Error('Active TypeScript must remain strict.');
const included = new Set(parsed.fileNames.map(path => norm(resolve(path)).toLowerCase()));
const active = ['game', 'resources/js', 'tests/unit', 'tests/helpers', 'tests/browser', 'tests/e2e'].flatMap(files).filter(path => /\.(ts|tsx|vue)$/.test(path));
for (const path of active) if (!included.has(norm(resolve(path)).toLowerCase()) && !path.endsWith('.vue')) throw new Error(`Active source/test excluded from TypeScript: ${path}`);
// TypeScript includes .vue via vue-tsc; ensure whole source roots have no exclusions.
if (config.config.exclude?.length) throw new Error('Do not hide active source or tests with TypeScript exclusions.');
const program = ts.createProgram(parsed.fileNames, parsed.options);
for (const source of program.getSourceFiles()) {
    const path = norm(relative(process.cwd(), source.fileName));
    if (path.startsWith('tests/historical/') || path.startsWith('art/')) throw new Error(`Active TypeScript imports a historical dependency: ${path}`);
}
globalThis.console.log(`Suite integrity: ${manifest.files.length} immutable archived files; ${active.length} active TypeScript/Vue files covered.`);
