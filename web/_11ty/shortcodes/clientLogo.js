import urlFor from '../../utils/imageUrl.js';

const sizeArray = ['375', '425', '768'];
const aspect = 0.5625; // 16:9 aspect ratio

export default function (image) {
	const firstSize = sizeArray[0];
	const lastSize = sizeArray[sizeArray.length - 1];
	const lastHeight = lastSize * aspect;
	const srcSetContent = sizeArray
		.map((size) => {
			const height = Math.floor(size * aspect);
			const url = urlFor(image).width(size).height(height).auto('format').url();

			return `${url} ${size}w`;
		})
		.join(',');
	const altText = image.altText;

	return `<img class="client-tile" src="${urlFor(image).width(firstSize)}"
        srcset="${srcSetContent}"
        sizes="(min-width: 40rem) calc((var(--max-width) - (1.5vw * 13)) / 12 * 8),
               100vw"
        width="${lastSize.trim()}"
        height="${lastHeight}"
        loading="lazy"
        alt="${altText}"
      >`;
}
