import urlFor from '../../utils/imageUrl.js';

const sizeArray = ["375", "425", "768", "1024", "1200", "1440"];
const aspect = 0.5625; // 16:9 aspect ratio

/**
 * Banner Image Shortcode
 *
 * Returns a 16:9 image at the appropriate resolution
 * based on screen width.
 * - height included to avoid layout shift: lets the
 *   browser know what the aspect ratio is
 * - max height is 390px to create panorama aspect ratio
 *   for wide view ports
 * - set loading to "eager" if above the fold
 */
export default function bannerImage(image) {
	const firstSize = sizeArray[0];
	const lastSize = sizeArray[sizeArray.length - 1];
	const lastHeight = lastSize * aspect;
	const altText = image.altText;
	const srcSetContent = sizeArray
		.map((size) => {
			const height = Math.floor(size * aspect);
			const url = urlFor(image).width(size).height(height > 390 ? 390 : height).auto('format').url();

			return `${url} ${size}w`;
		})
		.join(',');
	const classes = image.adjBright ? 'dim' : '';

	return `<img src="${urlFor(image).width(firstSize)}"
        class="${classes}"
				srcset="${srcSetContent}"
        sizes="100vw"
        width="${lastSize.trim()}"
        height="${lastHeight}"
        loading="lazy"
        alt="${altText}"
      >`;
}
