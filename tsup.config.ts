import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'], // 🚨 Magic: Builds both CommonJS and ES Modules
    dts: true,              // Generates TypeScript declaration files
    splitting: false,
    sourcemap: true,        // Helps users debug errors in their own console
    clean: true,            // Empties the dist folder before every build
    minify: true,           // Shrinks the file size for faster downloads
});