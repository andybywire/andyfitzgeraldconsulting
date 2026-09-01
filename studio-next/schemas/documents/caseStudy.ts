import {GrBriefcase} from 'react-icons/gr'
import {
  schemeFilter,
  ReferenceHierarchyInput,
  ArrayHierarchyInput,
} from 'sanity-plugin-taxonomy-manager'
import {BODY_STYLES, MARKS} from '../portableText'
import {defineType, defineField, type ObjectItem} from 'sanity'
import {slugField} from '../slug'

export default defineType({
  name: 'caseStudy',
  type: 'document',
  title: 'Case Studies',
  icon: GrBriefcase,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    defineField({
      name: 'genre',
      title: 'Genre',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      initialValue: {_ref: '89d6c3022255ade8c6f5867ca3b2354a'},
      options: {
        filter: schemeFilter({schemeId: 'sjEhF9', expanded: true}),
        disableNew: true,
      },
      components: {field: ReferenceHierarchyInput},
    }),
    defineField({
      name: 'insightType',
      deprecated: {
        reason: 'Use "Genre" for the 2026 rebuild instead.',
      },
      title: 'Insight Type',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: schemeFilter({schemeId: 'c88ca3'}),
        disableNew: true,
      },
      components: {field: ReferenceHierarchyInput},
    }),
    slugField(),
    defineField({
      title: 'Date Published',
      name: 'pubDate',
      type: 'date',
    }),
    defineField({
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
          /* `initialValue`, not `default` — Sanity has no `default` property, so the
             value this carried was silently ignored until defineField() flagged it
             (2026-08-26). Harmless in practice, since undefined and false are both
             falsy to every consumer, but it read as live configuration. */
          initialValue: false,
        },
      ],
    }),
    // {
    //   name: 'genre',
    //   title: 'Genre',
    //   type: 'reference',
    //   to: [{type: 'skosConcept'}],
    //   initialValue: {_ref: '89d6c3022255ade8c6f5867ca3b2354a'},
    //   options: {
    //     filter: schemeFilter({schemeId: 'sjEhF9', expanded: true}),
    //     disableNew: true,
    //   },
    //   components: {field: ReferenceHierarchyInput},
    // },
    defineField({
      name: 'topic',
      title: 'Topics',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {
            filter: schemeFilter({schemeId: '2e73674', expanded: true}),
            disableNew: true,
          },
        },
      ],
      components: {field: ArrayHierarchyInput},
    }),
    defineField({
      name: 'client',
      type: 'reference',
      title: 'Client',
      to: [{type: 'client'}],
    }),
    defineField({
      name: 'shortDescription',
      type: 'text',
      title: 'Short Description',
      description: 'Used for related resources list item descriptions. Character count TBD.',
      rows: 3,
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Meta Description',
      description: 'Used for description meta tag. Up to 150 char, likely truncation @ 70',
      rows: 3,
    }),
    defineField({
      name: 'review',
      title: 'Project Review',
      type: 'reference',
      to: [{type: 'review'}],
    }),
    defineField({
      title: 'At a Glance',
      name: 'atGlance',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
      ],
    }),
    defineField({
      title: 'What I Did',
      name: 'whatDid',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
      ],
    }),
    defineField({
      title: 'Project Goal',
      name: 'projectGoal',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
      ],
    }),
    defineField({
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
    }),
    defineField({
      title: 'Project Approach',
      name: 'projectApproach',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
        /* A bare inline `image` sat beside this and was removed 2026-08-26 — see
           the note in article.tsx. Free here: no case study ever used one, so
           `figure` was already carrying every image in these two fields. */
        {type: 'figure'},
      ],
    }),
    defineField({
      title: 'Project Outcome',
      name: 'projectOutcome',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
        /* A bare inline `image` sat beside this and was removed 2026-08-26 — see
           the note in article.tsx. Free here: no case study ever used one, so
           `figure` was already carrying every image in these two fields. */
        {type: 'figure'},
      ],
    }),
    defineField({
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
    }),
    defineField({
      name: 'bands',
      title: 'Custom Bands',
      description:
        'Custom bands provide category-specific overrides for default bands defined in Settings.',
      type: 'array',
      of: [{type: 'bandWorkWithMe'}],
      validation: (rule) =>
        rule.custom((items: ObjectItem[] | undefined) => {
          if (!items) return true

          const typesToCheck = ['bandRss', 'bandWorkWithMe', 'bandGetInTouch']
          const invalidPaths: {_key: string}[][] = []

          for (const typeName of typesToCheck) {
            const matches = items.filter((item) => item._type === typeName && item._key)
            if (matches.length > 1) {
              matches.forEach((item) => {
                invalidPaths.push([{_key: item._key}])
              })
            }
          }

          if (invalidPaths.length > 0) {
            return {
              paths: invalidPaths,
              message: 'Each type may only appear once in this array',
            }
          }

          return true
        }),
    }),
  ],
})
