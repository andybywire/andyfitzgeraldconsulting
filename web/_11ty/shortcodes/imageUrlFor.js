import urlFor from '../../utils/imageUrl.js';

export default function (image, width = '300') {
	return urlFor(image).width(width).auto('format');
}
