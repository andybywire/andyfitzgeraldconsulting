/**
 * @todo Add Content Pillar boolean and conditional prioritization field for promoting content pillars to the home page.
 */

import React from 'react'
import {GrArticle} from 'react-icons/gr'

const Preformatted = props => (
  <pre style={{whiteSpace: 'pre-wrap',
    backgroundColor: '#f2f3f5'}}>{props.children}</pre>
)

export default {
  name: 'article',
  type: 'document',
  icon: GrArticle,
  title: "Articles",
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        slugify: input => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200)
      }
    },
    {
      title: 'Date Published',
      name: 'pubDate',
      type: 'date'
    },
    {
      title: 'Hero Image',
      name: 'heroImage',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'altText',
          type: 'string',
          title: 'Alt Text'
        }
      ]
    },
    {
      name: 'banner',
      title: 'Banner',
      type: 'banner'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: '_type == $type && (scheme->title == $scheme)',
        filterParams: {
          type: 'skosConcept',
          scheme: 'Category'
        }
      }
    },
    {
      name: 'topic',
      title: 'Topics',
      type: 'array',
      of: [
        {type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {
            filter: '_type == $type && (scheme->title == $scheme)',
            filterParams: {
              type: 'skosConcept',
              scheme: 'Topic'
            }
          }
        }
      ]
    },
    {
      name: 'shortDescription',
      type: 'text',
      title: 'Short Description',
      description: 'approx. 125 char',
      rows: 3
    },
    {
      name: 'description',
      type: 'text',
      title: 'Description',
      description: 'up to 150 char, likely truncation @ 70',
      rows: 3
    },
    {
      name: 'lede',
      title: 'Lede',
      type: 'array',
      of: [{type: 'block'}]
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
            {title: 'H4', value: 'h4'},
            {title: 'H5', value: 'h5'},
            {title: 'Quote', value: 'blockquote'}
          ]
        },
        {
          name: 'pre',
          title: 'Pre',
          type: 'code',
        },
        {
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'altText',
              type: 'string',
              title: 'Alt Text',
              options: {
                isHighlighted: true
              }
            },
            {
              name: 'floatLeft',
              type: 'boolean',
              title: 'Float Left',
              initialValue: false,
              options: {
                layout: 'checkbox',
                isHighlighted: true
              }
            }
          ]
        },
        {type: 'figure'}
      ]
    },
    {
      name: 'cta',
      title: 'Call to Action',
      type: 'cta'
    },
    {
      name: 'canonical',
      title: 'Canonical URL',
      type: 'url'
    }
  ]
}