const imageUrl = require('./imageUrl')

// Learn more on https://www.sanity.io/guides/introduction-to-portable-text
module.exports = {
  types: {
    authorReference: ({node}) => `[${node.name}](/authors/${node.slug.current})`,
    code: ({node}) =>
      '```' + node.language + '\n' + node.code + '\n```',
    mainImage: ({node}) => `![${node.alt}](${imageUrl(node).width(600).url()})`,
    // image: ({node}) => `![${node.alt}](${imageUrl(node).width(100).url()})`,
    image: ({node}) => `<img src="${imageUrl(node).url()}" alt="${node.altText || ''}" class="${node.floatLeft ? 'left-float' : ''}">`
  }
}


// serializer in block-content-to-markdown:
// function image(props) {
//   const {title, alt} = props
//   const url = getImageUrl(props)
//   const imgTitle = title ? ` ${JSON.stringify(title)}` : ''
//   return `![${alt || ''}](${url}${imgTitle})`
// }