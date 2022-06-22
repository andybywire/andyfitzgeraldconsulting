const sass = require("sass");

module.exports = function(eleventyConfig) {
  eleventyConfig.addTemplateFormats("scss");

  // Creates the extension for use
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css", // optional, default: "html"

    // `compile` is called once per .scss file in the input directory
    compile: async function(inputContent) {
      let result = sass.compileString(inputContent);
      // Consider adding options to render SASS paths in dev env.
      // cf. https://github.com/sass/dart-sass/issues/1594

      // This is the render function, `data` is the full data cascade; not used yet here.
      return async (data) => {
        return result.css;
      };
    }
  });
};
