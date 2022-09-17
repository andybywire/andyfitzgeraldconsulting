const urlFor = require('../../utils/imageUrl');

// Build selectable support for square, portrait (3:4 – 1.33), landscape (4:3 — .75), and wide (16:9 – 0.5625)

module.exports = (image, aspect=0.5625, srcs="320,640,900", sizes="100vw", classList="") => {
  const sizeArray = srcs.split(',');
  const firstSize = sizeArray[0];
  const lastSize = sizeArray[sizeArray.length - 1];
  const lastHeight = (lastSize * aspect);
  const altText = image.altText;
  const srcSetContent = sizeArray.map((size) => {
    const height = Math.floor(size * aspect); // default is 16:9
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
        width="${lastSize.trim()}"
        height="${lastHeight}"
        loading="lazy"
        alt="${altText}"
      >`
      // height included to avoid layout shift: lets the browser know what the aspect ratio is
      // set loading to "eager" if above the fold
  )
};