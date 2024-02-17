export default function (eleventyConfig) {
  // Assets to pass through to _site
  eleventyConfig.addPassthroughCopy(".htaccess");

  return {
    htmlTemplateEngine: "njk",
    dir: {
      data: "../_data",
      input: "_src",
      includes: "../_includes",
      layouts: "../_includes",
    },
  };
}
