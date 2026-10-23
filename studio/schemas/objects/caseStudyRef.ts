import {GrBriefcase} from 'react-icons/gr'
import {defineType, defineField} from 'sanity'

/**
 * A case study, linked from Portable Text and titled for the page it sits in. The
 * front end renders it as the Figma "study card" (Components → Cards, 2914:3340).
 *
 * ── NAMED FOR THE CONTENT, NOT THE CARD ──────────────────────────────────────
 *
 * `caseStudyRef` rather than `studyCard` (Andy, 2026-10-23), after `clipRef` and
 * `bookRef` on `note`: what is stored is a case study plus a title framed for one
 * reading context. A card is how a `page` body happens to render that today, and a
 * name that describes the rendering is wrong the first time something renders it
 * differently — a feed, say, which would want a plain link.
 *
 * ── IT CARRIES NO IMAGE, ON PURPOSE ──────────────────────────────────────────
 *
 * The picture comes from the case study's CLIENT — the square `logo` from md up, the
 * `tile` below it. Nothing here asks an editor to choose one, so there is nothing to
 * choose wrongly, and a client whose logo changes changes on every card at once.
 *
 * ── THE FALLBACK TITLE IS RESOLVED IN GROQ, NOT HERE ─────────────────────────
 *
 * `coalesce(title, caseStudy->title)` in PAGE_QUERY, so the component receives one
 * title and the rule lives in one place. The preview below repeats it only so the
 * editor sees what will render; it decides nothing.
 *
 * Offered in `page.bodyText` only, for now.
 */
export default defineType({
  type: 'object',
  name: 'caseStudyRef',
  title: 'Case Study Card',
  icon: GrBriefcase,
  fields: [
    /**
     * REQUIRED, AND STRONG — the default, kept deliberately. A card with no case study
     * has nowhere to link and nothing to show. A strong reference also means Content
     * Lake refuses to delete or unpublish a case study that a published page still
     * points at, so the Studio lists the page instead of breaking it.
     *
     * ONE ROUTE AROUND IT: "Unpublish when releasing" in a content release turns strong
     * references to that document WEAK (Sanity's docs, read 2026-10-23). So the front
     * end still degrades when a case study does not resolve, rather than trusting this.
     */
    defineField({
      name: 'caseStudy',
      title: 'Case Study',
      type: 'reference',
      to: [{type: 'caseStudy'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Custom Title',
      type: 'string',
      description:
        "Optional. Frames the case study for this page — shown in place of the case study's own title. Leave empty to use that title.",
    }),
  ],
  preview: {
    select: {
      title: 'title',
      caseStudyTitle: 'caseStudy.title',
      media: 'caseStudy.client.logo',
    },
    prepare({title, caseStudyTitle, media}) {
      return {
        title: title || caseStudyTitle || 'No case study selected',
        subtitle: 'Case Study',
        media,
      }
    },
  },
})
