const client = require("../utils/sanityClient");

async function getTaxonomies() {
  const query = `
  *[_type == "skosConcept" && !(_id in path("drafts.**"))]| order(prefLabel) {
    prefLabel,
    "scheme": *[_type == "skosConceptScheme" && references(^._id)].title
  }
  `;

  const data = await client.fetch(query).then((concepts) => {
    return concepts;
  });
  return data;
}

module.exports = getTaxonomies;
