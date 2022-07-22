const sass = require("sass");
const urlFor = require('./utils/imageUrl');
// const util = require('util');

module.exports = function(eleventyConfig) {
  
  // Reload the browser when CSS is updated (SASS is compiled via a process to running parallel Eleventy)
	eleventyConfig.setBrowserSyncConfig({
		files: './_site/style/*.css'
	});
  // Need to change this for 2.0? https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

  eleventyConfig.addShortcode('imageUrlFor', (image, width="400") => {
    return urlFor(image)
      .width(width)
      .auto('format')
  });

  eleventyConfig.addShortcode('articleHero', (image,width="650",height="250") => {
    return urlFor(image)
      .width(width)
      .height(height)
      .auto('format')
  });

  let markdownIt = require("markdown-it");
  let markdownItAnchor = require("markdown-it-anchor");
  let options = {
    html: true,
    breaks: true,
    linkify: true
  };
  let opts = {
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "#"
  };

  eleventyConfig.setLibrary("md", markdownIt(options)
    .use(markdownItAnchor, opts)
  );

  eleventyConfig.addFilter("markdownify", function(value) {
    const md = new markdownIt(options)
    return md.render(value)
  })
  return {
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],

    pathPrefix: "/",

    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    passthroughFileCopy: true,
    dir: {
      input: "src",
      includes: "../_includes",
      data: "../_data",
      output: "_site"
    }
  };


};
