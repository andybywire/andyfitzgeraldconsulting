const urlFor = require('./utils/imageUrl');
const dateFilter = require('nunjucks-date-filter');

// Add keys the keys and values defined in .env to process.env
require('dotenv').config();
// console.log(process.env)

// Filters & Shortcodes
const ogImage = require("./_11ty/filters/ogImage.js");
const bannerImage = require("./_11ty/shortcodes/bannerImage.js");
const responsiveImage = require("./_11ty/shortcodes/responsiveImage.js");

module.exports = function(eleventyConfig) {
  
  // Reload the browser when CSS is updated (SASS is compiled via a process to running parallel Eleventy)
	eleventyConfig.setBrowserSyncConfig({
		files: './_site/style/*.css'
	});

  // Assets to pass through to _site
  eleventyConfig.addPassthroughCopy({"assets/fonts": "fonts"});
  eleventyConfig.addPassthroughCopy({"assets/js": "js"});
  eleventyConfig.addPassthroughCopy({"assets/icons": "icons"});
  eleventyConfig.addPassthroughCopy({"assets/img": "img"});
  eleventyConfig.addPassthroughCopy("manifest.json");
  eleventyConfig.addPassthroughCopy(".htaccess");
  eleventyConfig.addPassthroughCopy("serviceworker.js");
  eleventyConfig.addPassthroughCopy("robots.txt");

  // Move these shortcodes to their own directory
  eleventyConfig.addShortcode('imageUrlFor', (image, width="300") => {
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

  // Filters
  eleventyConfig.addFilter('ogImage', ogImage);
  
  // Shortcodes
  eleventyConfig.addShortcode('responsiveImage', responsiveImage);
  eleventyConfig.addShortcode('bannerImage', bannerImage);

  // Not yet used, but plan to in the near future
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

  eleventyConfig.addFilter('date', dateFilter); // Moment.js

  eleventyConfig.addFilter("markdownify", function(value) {
    const md = new markdownIt(options)
    return md.render(value)
  })

  // Base config
  return {
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid",
      "json"
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
