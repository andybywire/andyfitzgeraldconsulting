const groq = require('groq')
const client = require('../utils/sanityClient')
module.exports =  async function() {
  return await client.fetch(groq`
    *[_id == "settings"]{
      ...,
      "bannerCopy": defaultBanner.bannerCopy,
      "bannerImg": defaultBanner.bannerImg.asset._ref,
      "bannerPosition": coalesce(defaultBanner.horizontal, '') + ' ' + coalesce(defaultBanner.vertical, '')
    }[0]
  `)
}