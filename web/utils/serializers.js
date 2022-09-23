const client = require('../utils/sanityClient.js')
const imageUrl = require('./imageUrl')
const BlocksToMarkdown = require('@sanity/block-content-to-markdown')
// will actually need BlocksToHtml

// Learn more on https://www.sanity.io/guides/introduction-to-portable-text
module.exports = {
  types: {
    authorReference: ({node}) => `[${node.name}](/authors/${node.slug.current})`,
    code: ({node}) =>
      '```' + node.language + '\n' + node.code + '\n```',
    mainImage: ({node}) => `![${node.alt}](${imageUrl(node).url()})`,
    // image: ({node}) => `![${node.alt}](${imageUrl(node).width(100).url()})`,
    // image: ({node}) => `<img src="${imageUrl(node).url()}" alt="${node.altText || ''}" class="${node.floatLeft ? 'left-float' : ''}">`,
    image: ({node}) => `<img src="${imageUrl(node).url()}" alt="${node.altText || ''}" ${node.floatLeft ? 'class="left-float"' : ''}>`,
    figure: ({node}) => {
      return `<figure>
                <img src="${imageUrl(node).url()}" alt="${node.altText || ''}">
                <figcaption>${node.caption}</figcaption>
              </figure>`
    }
  }
}



{/* <figure>
    <img src="/media/cc0-images/elephant-660-480.jpg"
         alt="Elephant at sunset">
    <figcaption>An elephant at sunset</figcaption>
</figure> */}

// figure: 
// image
// title (block content)
// altText

// body: BlocksToMarkdown(article.bodyText, { serializers, ...client.config() }),

// serializer in block-content-to-markdown:
// function image(props) {
//   const {title, alt} = props
//   const url = getImageUrl(props)
//   const imgTitle = title ? ` ${JSON.stringify(title)}` : ''
//   return `![${alt || ''}](${url}${imgTitle})`
// }