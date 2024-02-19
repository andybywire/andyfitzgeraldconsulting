export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy('.htaccess');
	eleventyConfig.addPassthroughCopy('style');
	eleventyConfig.addPassthroughCopy('assets');
	// eleventyConfig.addPassthroughCopy({ 'assets/js': 'js' });
	// eleventyConfig.addPassthroughCopy({ 'assets/icons': 'icons' });
	// eleventyConfig.addPassthroughCopy('manifest.json');
	// eleventyConfig.addPassthroughCopy('serviceworker.js');
	// eleventyConfig.addPassthroughCopy('robots.txt');

	eleventyConfig.setServerOptions({
		watch: ['style/**/*.css'],
		showAllHosts: true,
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
