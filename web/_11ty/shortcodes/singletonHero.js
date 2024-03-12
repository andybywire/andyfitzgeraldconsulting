import urlFor from '../../utils/imageUrl.js';

// last size should be calculated from max-width & grid
// add in a sizes declaration?
const sizeArray = ["375", "425", "640", "896"];
const aspect = 1.25; // 16:9 aspect ratio

 /**
 * Singleton Page Hero Image
 */
export default function responsiveImage(image) {
	const firstSize = sizeArray[0];
	const lastSize = sizeArray[sizeArray.length - 1];
	const lastHeight = lastSize * aspect;
	const altText = image?.altText || "no alt";
	const srcSetContent = sizeArray
		.map((size) => {
			const height = Math.floor(size * aspect); // default is 4:3
			const url = urlFor(image).width(size).height(height).auto('format').url();

			return `${url} ${size}w`;
		})
		.join(',');

	return `<img src="${urlFor(image).width(firstSize)}"
        srcset="${srcSetContent}"
        sizes="100vw"
        width="${lastSize.trim()}"
        height="${lastHeight}"
        loading="lazy"
        alt="${altText}"
      >`;
}
