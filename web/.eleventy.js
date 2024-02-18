export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy('.htaccess');
	eleventyConfig.addPassthroughCopy({ style: 'style' });
	eleventyConfig.addPassthroughCopy({ 'assets/fonts': 'fonts' });
	// eleventyConfig.addPassthroughCopy({ 'assets/js': 'js' });
	// eleventyConfig.addPassthroughCopy({ 'assets/icons': 'icons' });
	// eleventyConfig.addPassthroughCopy('manifest.json');
	// eleventyConfig.addPassthroughCopy('serviceworker.js');
	// eleventyConfig.addPassthroughCopy('robots.txt');

	eleventyConfig.setServerOptions({
		watch: ['style/**/*.css'],
	});

	return {
		htmlTemplateEngine: 'njk',
		dir: {
			data: '../_data',
			input: '_src',
			includes: '../_includes',
			layouts: '../_includes',
		},
	};
}
