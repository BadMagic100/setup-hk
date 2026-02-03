import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

/** @see {@link https://github.com/rollup/plugins/issues/1541} */
const fix = <T>(f: { default: T }): T => f as unknown as T;

const config = defineConfig({
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    fix(typescript)(),
    fix(nodeResolve)({ preferBuiltins: true }),
    fix(commonjs)(),
  ],
});

export default config;
