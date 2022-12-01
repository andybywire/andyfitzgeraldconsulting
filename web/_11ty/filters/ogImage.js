/**
 * Open Graph Image Filter
 * Convert a resource hero image to a 1.91:1 ratio and minimum recommended dimensions of 1200x630.
 * @param   {object}  hero  Sanity image store data for hero image
 * @return  {string}        URL for the sized OG image.           
 */

const urlFor = require('../../utils/imageUrl')

// Need to export just the properly sized URL

module.exports = (hero) => {
  return urlFor(hero).width(1200).height(630).url()
}
