import {GrArticle} from 'react-icons/gr'
import {schemeFilter, ReferenceHierarchyInput} from 'sanity-plugin-taxonomy-manager'

export default {
  name: 'article',
  type: 'document',
  icon: GrArticle,
  title: 'Articles',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
      },
    },
    {
      title: 'Date Published',
      name: 'pubDate',
      type: 'date',
    },
    {
      title: 'Hero Image',
      name: 'heroImage',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
        },
        {
          name: 'altText',
          type: 'string',
          title: 'Alt Text',
        },
        {
          name: 'adjBright',
          title: 'Adjust Brightness',
          description:
            'Lower the brightness on this image by .05% so that it displays more distinctly on a white background.',
          type: 'boolean',
          default: false,
        },
      ],
    },
    {
      name: 'podcastId',
      title: 'Podcast Id',
      description:
        'Embed link ID for podcast interviews. Currently supports Apple podcasts links. Grab the url after `/us/podcast/`.',
      type: 'string',
    },
    {
      name: 'insightType',
      title: 'Insight Type',
      type: 'reference',
      to: [
        {type: 'skosConcept'}, 
        {type: 'skosConceptScheme'}
      ],
      options: {
        // filter: () => schemeFilter({schemeId: 'c88ca3'}),
        // filter: () => {
        //   return {
        //     filter: `!(_originalId in path("drafts.**"))
        //         && _id in *[_type=="skosConceptScheme" && schemeId == $schemeId].concepts[]._ref
        //         || _id in *[_type=="skosConceptScheme" && schemeId == $schemeId].topConcepts[]._ref`,
        //     params: {
        //       schemeId: 'c88ca3',
        //     },
        //   }
        // },
        // filter: async ({getClient}) => {
        //   const client = getClient({apiVersion: '2023-01-01'})
        //   const latestPersonId = await client.fetch(
        //     '*[title in ["director", "actor", "producer"] && _id in path("*")] | order(_createdAt desc) [0]._id'
        //   )
        //   return {
        //     filter: '_id != $latestPersonId',
        //     params: {latestPersonId: latestPersonId},
        //   }
        // },
        // Works as a filter, throws "Reference is not allowed in reference field according to filter" error on field paste:
        filter: async ({getClient}: {getClient: (options: {apiVersion: string}) => any}, options:any, ) => {
          const client = getClient({apiVersion: '2023-01-01'})
          // const {schemeId} = options || {}
          const schemeId = "c88ca3"
          const {concepts, topConcepts} = await client.fetch(
            `{
              "concepts": *[_type=="skosConceptScheme" && schemeId == "${schemeId}"].concepts[]._ref,
              "topConcepts": *[_type=="skosConceptScheme" && schemeId == "${schemeId}"].topConcepts[]._ref
            }`
          )
          return {
            filter: `!(_id in path("drafts.**"))
            && _id in $concepts
            || _id in topConcepts`,
            params : {concepts, topConcepts},
          }
        },
        // Works as a filter; works with field copy feature:
        // filter: () => {
        //   return {
        //     filter: `!(_id in path("drafts.**"))`,
        //   }
        // },
        // Works as a filter, throws "Reference is not allowed in reference field according to filter" error on field paste:
        // filter: () => {
        //   return {
        //     filter: `!(_originalId in path("drafts.**"))`,
        //   }
        // },
        disableNew: true,
      },
      // components: {field: ReferenceHierarchyInput},
    },
    {
      name: 'topic',
      title: 'Topics',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {
            filter: () => schemeFilter({schemeId: '0e0d68'}),
          },
          // components: { field: ReferenceHierarchyInput }, // does not yet support arrays
        },
      ],
    },
    {
      name: 'shortDescription',
      type: 'text',
      title: 'Short Description',
      description: 'Used for related resources list item descriptions. Character count TBD.',
      rows: 3,
    },
    {
      name: 'description',
      type: 'text',
      title: 'Meta Description',
      description: 'Used for description meta tag. Up to 150 char, likely truncation @ 70',
      rows: 3,
    },
    {
      name: 'lede',
      title: 'Lede',
      type: 'array',
      description: 'Used for article teaser paragraph.',
      of: [{type: 'block'}],
    },
    {
      title: 'Body',
      name: 'bodyText',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'H5', value: 'h5'},
            {title: 'Quote', value: 'blockquote'},
          ],
        },
        {type: 'figure'},
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'altText',
              type: 'string',
              title: 'Alt Text',
            },
            {
              name: 'floatLeft',
              type: 'boolean',
              title: 'Float Left',
              initialValue: false,
              options: {
                layout: 'checkbox',
              },
            },
          ],
        },
        {
          name: 'pre',
          title: 'Pre',
          type: 'code',
        },
      ],
    },
    {
      name: 'canonical',
      title: 'Canonical URL',
      type: 'url',
      description: 'External site URL if article was first published elsewhere.',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: () => schemeFilter({schemeId: '415dcc'}),
      },
      components: {field: ReferenceHierarchyInput},
      deprecated: {reason: 'No longer used in 2024 refresh'},
    },
    {
      name: 'banner',
      title: 'Banner',
      type: 'banner',
    },
    {
      name: 'cta',
      title: 'Call to Action',
      type: 'cta',
      deprecated: {reason: 'Article-specific CTAs are no longer used.'},
    },
  ],
}
