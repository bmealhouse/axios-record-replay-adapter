import path from "path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "rollup-plugin-typescript2";
import babel from "@rollup/plugin-babel";
import sourceMaps from "rollup-plugin-sourcemaps";
import ts from "typescript";
import { DEFAULT_EXTENSIONS as DEFAULT_BABEL_EXTENSIONS } from "@babel/core";

export default ["cjs", "esm"].map((format, index) => ({
  input: "src/index.ts",
  external: (id) => {
    // bundle in polyfills as TSDX can't (yet) ensure they're installed as deps
    if (id.startsWith("regenerator-runtime")) {
      return false;
    }

    return !id.startsWith(".") && !path.isAbsolute(id);
  },
  treeshake: {
    propertyReadSideEffects: false,
  },
  output: {
    file: `dist/axios-record-replay-adapter.${format}.js`,
    format,
    sourcemap: true,
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs({
      // use a regex to make sure to include eventual hoisted packages
      include: /\/regenerator-runtime\//,
    }),
    json(),
    typescript({
      typescript: ts,
      tsconfigDefaults: {
        exclude: ["dist", "node_modules", "**/*.test.ts"],
        target: "esnext",
      },
      check: index === 0,
    }),
    babel({
      exclude: "node_modules/**",
      extensions: [...DEFAULT_BABEL_EXTENSIONS, "ts"],
      babelHelpers: "bundled",
    }),
    sourceMaps(),
  ],
}));
