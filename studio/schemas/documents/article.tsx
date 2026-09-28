import {GrArticle} from 'react-icons/gr'
import {
  schemeFilter,
  ReferenceHierarchyInput,
  ArrayHierarchyInput,
} from 'sanity-plugin-taxonomy-manager'
import {BODY_STYLES, PLAIN_STYLES, MARKS} from '../portableText'
import {defineType, defineField} from 'sanity'
import {uniqueBandTypes} from '../validation'
import {slugField} from '../slug'

export default defineType({
  name: 'article',
  type: 'document',
  icon: GrArticle,
  title: 'Articles',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
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
    defineField({
      name: 'podcastId',
      title: 'Podcast Id',
      description:
        'Embed link ID for podcast interviews. Currently supports Apple podcasts links. Grab the url after `/us/podcast/`.',
      type: 'string',
    }),
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
          },
        },
      ],
      components: {field: ArrayHierarchyInput},
    }),
    defineField({
      name: 'genre',
      title: 'Genre',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: schemeFilter({schemeId: 'sjEhF9'}),
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
      },
      components: {field: ReferenceHierarchyInput},
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
      name: 'lede',
      title: 'Lede',
      type: 'array',
      description: 'Used for article teaser paragraph.',
      of: [
        {
          type: 'block',
          styles: PLAIN_STYLES,
          marks: MARKS,
        },
      ],
    }),
    defineField({
      title: 'Body',
      name: 'bodyText',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
        /**
         * A bare inline `image` used to sit here too, carrying a `floatLeft`
         * boolean. Removed 2026-08-26: `figure` now has a `thumbnail` flag that
         * does that job, so there is one image type in a body and one serializer
         * rather than two near-identical ones — and a book cover gains the
         * `caption` field the bare image never had.
         *
         * Safe to remove because the data went first. The one document using it —
         * cognitive-science-for-designers, 11 book covers — was converted by hand,
         * and a scan of every Portable Text field on every type, drafts included,
         * found zero remaining `image` blocks. Removing a type from an array does
         * NOT remove it from stored documents; had any survived they would have
         * become unknown blocks in the editor.
         */
        {type: 'figure'},
        /**
         * NO `name`, DELIBERATELY. This was `{name: 'pre', title: 'Pre', type:
         * 'code'}` until 2026-08-26, and dropping the name is the whole fix:
         * Sanity stores an array member's NAME as its `_type`, so `name: 'pre'`
         * made the data say `pre` while the type said `code`.
         *
         * `pre` was the wrong name twice over. It named the HTML element the block
         * renders to rather than the thing it is — a presentational leak into the
         * content model — and it did not even name it accurately, since the output
         * is `<pre><code>`. The fields are `code`, `language`, `filename` and
         * `highlightedLines`; it is a code block.
         *
         * It also explains a discrepancy recorded elsewhere as a TypeGen fault.
         * TypeGen reported `code` because the TYPE is code; the `name` override is
         * what made the stored `_type` disagree. TypeGen was right and the schema
         * was inconsistent, so this rename aligns data, schema and generated types
         * at once — see the comment in web-next/src/components/prose/Code.astro.
         *
         * The 25 existing blocks were migrated first, by setting `_type` on each
         * keyed path so the `code` payloads were never rewritten: 5715 characters
         * before, 5715 after.
         */
        {type: 'code'},
        {type: 'table'},
      ],
      components: {
        portableText: {
          plugins: (props: any) => {
            return props.renderDefault({
              ...props,
              plugins: {
                ...props.plugins,
                table: {
                  enabled: true,
                },
              },
            })
          },
        },
      },
    }),
    defineField({
      name: 'canonical',
      title: 'Canonical URL',
      type: 'url',
      description: 'External site URL if article was first published elsewhere.',
    }),
    defineField({
      name: 'customBands',
      title: 'Custom Bands',
      description:
        'Custom bands provide category-specific overrides for default bands defined in Settings.',
      type: 'array',
      of: [{type: 'bandRss'}],
      validation: (rule) => rule.custom(uniqueBandTypes),
    }),
  ],
})
