module.exports = (api) => {
  api.cache(true);

  return {
    presets: [
      [
        require("@babel/preset-env"),
        {
          targets: { node: 10 },
          modules: false,
          loose: true,
        },
      ],
    ],
    plugins: [
      require("babel-plugin-annotate-pure-calls"),
      [
        require("babel-plugin-polyfill-regenerator"),
        // don't pollute global env as this is being used in a library
        { method: "usage-pure" },
      ],
    ],
  };
};
