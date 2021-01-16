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
  // Tell Rollup which packages to ignore
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
    freeze: false,
    sourcemap: true,
    exports: "named",
  },
  plugins: [
    resolve(),
    // all bundled external modules need to be converted from CJS to ESM
    commonjs({
      // use a regex to make sure to include eventual hoisted packages
      include: /\/regenerator-runtime\//,
    }),
    json(),
    typescript({
      typescript: ts,
      tsconfigDefaults: {
        exclude: [
          // all TS test files, regardless whether co-located or in test/ etc
          "**/*.spec.ts",
          "**/*.test.ts",
          "**/*.spec.tsx",
          "**/*.test.tsx",
          // TS defaults below
          "node_modules",
          "bower_components",
          "jspm_packages",
          "dist",
        ],
      },
      tsconfigOverride: {
        compilerOptions: {
          // TS -> esnext, then leave the rest to babel-preset-env
          target: "esnext",
          // don't output declarations more than once
          ...(index > 0 && {
            declaration: false,
            declarationMap: false,
          }),
        },
      },
      check: index === 0,
    }),
    babel({
      exclude: "node_modules/**",
      extensions: [...DEFAULT_BABEL_EXTENSIONS, "ts", "tsx"],
      babelHelpers: "bundled",
    }),
    sourceMaps(),
  ],
}));
