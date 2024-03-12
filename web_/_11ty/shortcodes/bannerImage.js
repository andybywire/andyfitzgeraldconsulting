/**
 * AFC Banner Image Filter
 * Create responsive image srcset for banner images
 * @param   {object}  image     Sanity image store data for banner image
 * @param   {object}  position  
 * @return  {string}            <img> element with srcset for banner image
 */

const urlFor = require('../../utils/imageUrl');

module.exports = (image, position, srcs="320,640,900,1100,1400,1600,2000,2400,2800", sizes="100vw") => {
  const sizeArray = srcs.split(',');
  const firstSize = sizeArray[0];
  const lastSize = sizeArray[sizeArray.length - 1];
  // const lastHeight = (lastSize * aspect);
  // const altText = image.altText; 
  const srcSetContent = sizeArray.map((size) => {
    // const height = Math.floor(size * aspect); // default is 16:9
    const url = urlFor(image)
      .width(size)
      // .height(height)
      .auto('format') // uses webp if supported by the browser
      .url();

    return `${url} ${size}w`
  }).join(',')

  return (
      `<img src="${urlFor(image).width(firstSize)}"
        srcset="${srcSetContent}"
        sizes="${sizes}"
        loading="eager"
        alt=""
        ${position != ' ' ? `style="object-position: ${position};"` : ''}
        >`
        // width="${lastSize.trim()}"
        // height="${lastHeight}"

        // height included to avoid layout shift: lets the browser know what the aspect ratio is – do I need this as this image will not determine height of the containing element? TBD.
      // set loading to "eager" if above the fold
  )
};