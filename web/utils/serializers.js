/**
 * @todo make main image responsive
 * @todo make figure responsive
 * @todo make image responsive
 */

const imageUrl = require('./imageUrl')

// Learn more on https://www.sanity.io/guides/introduction-to-portable-text
module.exports = {
  types: {
    code: ({node}) =>
      '```' + node.language + '\n' + node.code + '\n```',
    mainImage: ({node}) => `![${node.alt}](${imageUrl(node).url()})`,
    image: ({node}) => `<img src="${imageUrl(node).url()}" alt="${node.altText || ''}" ${node.floatLeft ? 'class="left-float"' : ''}>`,
    figure: ({node}) => {
      return `<figure>
                <img src="${imageUrl(node).url()}" alt="${node.altText || ''}">
                <figcaption>${node.caption}</figcaption>
              </figure>`
    }
  }
}