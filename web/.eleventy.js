const sass = require("sass");
const urlFor = require('./utils/imageUrl');
// const util = require('util');

module.exports = function(eleventyConfig) {
  
  // Reload the browser when CSS is updated (SASS is compiled via a process to running parallel Eleventy)
	eleventyConfig.setBrowserSyncConfig({
		files: './_site/style/*.css'
	});
  // Need to change this for 2.0? https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("js");

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

  // need to fine tune this
  eleventyConfig.addShortcode('responsiveImage', (image, srcs="320,640,900", sizes="100vw", classList="") => {
    const sizeArray = srcs.split(',');
    const firstSize = sizeArray[0];
    const lastSize = sizeArray[sizeArray.length - 1];
    const srcSetContent = sizeArray.map((size) => {
        const height = Math.floor(size * 0.5625); // set to 16:9
        const url = urlFor(image)
          .width(size)
          .height(height)
          .auto('format')
          .url();

        return `${url} ${size}w`
    }).join(',')

    return (
        `<img src="${urlFor(image).width(firstSize)}"
            ${classList ? "class='" + classList + "'" : ""}
            srcset="${srcSetContent}"
            sizes="${sizes}"
            width="${lastSize.trim()}">`
    )
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
      input: "_src",
      includes: "../_includes",
      data: "../_data",
      output: "_site"
    }
  };


};
