/**
 * @todo make main image responsive
 * @todo make figure responsive
 * @todo make image responsive
 */

const imageUrl = require('./imageUrl')

module.exports = {
  types: {
    pre: ({node}) => `<pre>${node.code}</pre>`,
    mainImage: ({node}) => `![${node.alt}](${imageUrl(node).url()})`,
    image: ({node}) => `<img src="${imageUrl(node).url()}" alt="${node.altText || ''}" ${node.floatLeft ? 'class="left-float"' : ''}>`,
    figure: ({node}) => {
      return `<figure>
                <img src="${imageUrl(node).url()}" alt="${node.altText || ''}" ${node.outline ? 'class="outline"' : ''}>
                ${node.caption ? `<figcaption> ${node.caption} </figcaption>` : '' }</figure>`
    }
  }
}