import {GrBriefcase} from 'react-icons/gr'
import {schemeFilter, ReferenceHierarchyInput, ArrayHierarchyInput} from 'sanity-plugin-taxonomy-manager'

export default {
  name: 'caseStudy',
  type: 'document',
  title: 'Case Studies',
  icon: GrBriefcase,
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
          description: 'Lower the brightness on this image by .05% so that it displays more distinctly on a white background.',
          type: 'boolean',
          default: false,
        }
      ],
    },
    {
      name: 'insightType',
      title: 'Insight Type',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      initialValue: {_ref: '89d6c3022255ade8c6f5867ca3b2354a'},
      options: {
        filter: schemeFilter({schemeId: 'c88ca3'}),
        disableNew: true,
      },
      components: {field: ReferenceHierarchyInput},
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
          components: { field: ArrayHierarchyInput },
        },
      ],
    },
    {
      name: 'client',
      type: 'reference',
      title: 'Client',
      to: [
        {type: 'client'}
      ]
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
      name: 'review',
      title: 'Project Review',
      type: 'reference',
      to: [{type: 'review'}],
    },
    {
      title: 'At a Glance',
      name: 'atGlance',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      title: 'What I Did',
      name: 'whatDid',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      title: 'Project Goal',
      name: 'projectGoal',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      title: 'Before Image',
      name: 'beforeImage',
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
      ],
    },
    {
      title: 'Project Approach',
      name: 'projectApproach',
      type: 'array',
      of: [
        {type: 'block'},
        {type: 'figure'},
        {
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
          ],
        },
      ],
    },
    {
      title: 'Project Outcome',
      name: 'projectOutcome',
      type: 'array',
      of: [
        {type: 'block'},
        {type: 'figure'},
        {
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
          ],
        },
      ],
    },
    {
      title: 'After Image',
      name: 'afterImage',
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
          name: 'outline',
          type: 'boolean',
          title: 'Outline',
          description:
            'Give images with white backgrounds a light outline to help them not disappear onto the page at the edges',
          initialValue: false,
          options: {
            layout: 'checkbox',
          },
        },
      ],
    },
  ],
}
