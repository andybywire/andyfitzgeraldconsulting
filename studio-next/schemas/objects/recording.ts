import {defineType, defineField} from 'sanity'

/**
 * A recording of a delivery — a podcast episode, a conference video, anything that
 * captured a presentation being given.
 *
 * ── ONE TYPE FOR AUDIO AND VIDEO, AND THAT IS THE POINT ──────────────────────
 *
 * Audio and video are the same fact: "this delivery was recorded, and it lives here."
 * What differs between them is how it is PLAYED — a podcast enclosure can drive a
 * native <audio> element, a YouTube video cannot — and that is a rendering concern.
 * Splitting the model on it would put a front-end distinction into the content model,
 * which is the mistake the field this replaces already made.
 *
 * `kind` therefore drives three things downstream and is required: the section heading
 * ("Listen to…" against "Watch…"), the player treatment, and which schema.org type the
 * JSON-LD emits (PodcastEpisode against VideoObject).
 *
 * ── WHAT IT REPLACES, AND WHY ────────────────────────────────────────────────
 *
 * `article.podcastId` holds a string like
 * `andy-fitzgerald-on-structured-content/id1450117117?i=1000608078120` — a decorative
 * slug, a show id and an episode id, concatenated in one directory's URL grammar. That
 * stores a rendering instruction rather than a fact, which is why it can only ever
 * build an Apple embed.
 *
 * Podcasts are an open, RSS-based medium; Apple is a directory, not a source. So the
 * durable identifier is the episode's own page, and anything platform-shaped is
 * derived from it at render time rather than stored.
 *
 * THE SAME RULE COVERS VIDEO: `url` holds the watch URL and the front end parses the
 * video id out of it for the embed. Storing the id instead would be `podcastId` again
 * under a new name.
 *
 * ── ONE PLACE PER RECORDING, DELIBERATELY ────────────────────────────────────
 *
 * A recording available on several platforms would want its own `alsoAt[]` list, and
 * that is NOT built: in practice there is one recording per presentation and one home
 * per recording (Andy, 2026-09-08). Same rule that keeps the `table` serializer
 * unwritten — a field written against no content is a guess at what the content would
 * have looked like. If a second platform ever matters, it nests here.
 *
 * ── WHERE THIS HANGS ─────────────────────────────────────────────────────────
 *
 * Intended as an array field on `event`, not on `presentation`: a recording is a
 * property of a DELIVERY, not of the work. One talk given at three conferences can
 * have three recordings; an interview has one, so the interview case is unaffected
 * either way. `event` already carries `type: 'podcast'` among its options.
 *
 *     defineField({
 *       name: 'recordings',
 *       title: 'Recordings',
 *       type: 'array',
 *       of: [{type: 'recording'}],
 *     })
 *
 * Add `recording` to `schemaTypes` in schemas/index.ts alongside the other objects.
 */
export default defineType({
  type: 'object',
  name: 'recording',
  title: 'Recording',
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      description:
        'Audio gets a “Listen to…” section, video a “Watch…” section. Also selects the JSON-LD type.',
      options: {
        list: [
          {title: 'Audio', value: 'audio'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'url',
      title: 'Canonical URL',
      type: 'url',
      description:
        'Where the recording lives: the episode page on the show’s own site, or the YouTube watch URL. The front end derives any embed from this — do not paste an embed URL.',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),

    /*
     * THE ENCLOSURE, WHICH ONLY AUDIO CAN HAVE. A podcast's RSS feed exposes the real
     * media file, so pointing a native <audio> at it costs no third-party script and no
     * tracking. YouTube has no legitimate equivalent — extracting the stream is against
     * their terms and the URLs are signed and expiring — so the field hides itself
     * rather than inviting a value that cannot work.
     *
     * Optional even for audio: without it the section falls back to a click-to-load
     * embed, and with it the player is native. One courtesy note, since this is usually
     * someone else's show: serving their file from this page spends their bandwidth.
     * Worth a word to the host rather than a silent decision.
     */
    defineField({
      name: 'mediaUrl',
      title: 'Audio File URL',
      type: 'url',
      description:
        'The episode’s enclosure URL from its RSS feed. Check https://podcastindex.org for easy access to the episode download link (mp3).',
      hidden: ({parent}) => parent?.kind !== 'audio',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    /*
     * THE POSTER DOES DOUBLE DUTY, which is why it takes a hotspot: it is the face of
     * the in-page player, and it is the SECOND RUNG of the card image ladder. Those are
     * different shapes, so the crop has to be steerable.
     *
     * ── THE LADDER, AND WHY ITS ORDER IS EDITORIAL ──────────────────────────
     *
     * A Presentations card takes `presentation.poster` if there is one; failing that,
     * the first recording that has a poster, walking events in order and recordings in
     * order within each event (Andy, 2026-09-08).
     *
     * BOTH ARRAYS ARE USER-SORTABLE AND THE SORT IS THE POINT. The same talk given at a
     * prestigious conference and then at a local meetup has two recordings, and which
     * one represents it on a card is a judgment about the work, not a fact about dates.
     * So the ladder must respect stored order and must NOT reorder by date — sorting it
     * "helpfully" in the query would quietly take that decision away.
     *
     * This is also why the Interview cards on the index board are unboxed: an interview
     * has a recording but no deck, so the presentation-level poster is empty, and unless
     * a recording carries one the card has no image and drops its box.
     *
     * ── THE GROQ FOR IT NEEDS PARENTHESES, AND SILENTLY LIES WITHOUT THEM ───
     *
     * The obvious form is wrong. `events[]->recordings[defined(poster)][0]` distributes
     * the filter and the index across EACH event rather than across the flattened list,
     * so it returns one poster per event instead of the first overall — an array where
     * a single value was wanted, which then reads as "no image" downstream rather than
     * as an error. Verified against an existing array-of-refs-holding-arrays on
     * `production-26` (2026-09-08): the unparenthesised form returned three results.
     *
     * Parenthesising the traversal forces the flatten before the filter:
     *
     *     "cardPoster": coalesce(
     *       poster,
     *       (events[]->recordings[])[defined(poster)][0].poster
     *     )
     *
     * Confirmed to return a single value, in reference order then inner-array order,
     * with no date sorting applied — which is what makes the editorial sort above
     * actually govern.
     *
     * Optional, and its absence is a designed state rather than a gap — see the note on
     * the player fallback in the front end. Deriving a thumbnail from YouTube instead
     * was rejected: it puts a request to Google on the page before anyone has asked for
     * the video, which is most of what the click-to-load pattern exists to avoid.
     */
    defineField({
      name: 'poster',
      title: 'Poster Image',
      type: 'image',
      description:
        'Optional. Shown before playback, and used on the Presentations card when the presentation itself has no poster. Poster image for YouTube is at `https://i3.ytimg.com/vi/{videoId}/maxresdefault.jpg`',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'altText',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),

    /*
     * The show or channel, displayed to users — "Listen on The Informed Life" reads
     * better than a bare link, and it is the only place the destination is named once
     * the URL stops being visible. Same job `clipRef.publisher` does for a web clip.
     */
    // This seems to repeat what's already in the Event title. Is it needed?
    defineField({
      name: 'sourceName',
      title: 'Source',
      type: 'string',
      description:
        'Optional. The show, series or channel this belongs to, e.g. “The Informed Life”. Leave blank for a one-off upload — the link falls back to the platform name.',
    }),

    /*
     * STORED AS THE EDITOR WOULD SAY IT, CONVERTED AT RENDER. schema.org wants ISO 8601
     * (`PT42M15S`) for both PodcastEpisode and VideoObject, which is unpleasant to type
     * and easy to get wrong by hand; `42:15` is not. The front end parses this once and
     * emits both the ISO form for JSON-LD and a human form for the UI.
     */
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'Optional. As m:ss or h:mm:ss, e.g. 42:15.',
      validation: (rule) =>
        rule.regex(/^(\d{1,2}:)?\d{1,2}:\d{2}$/, {name: 'm:ss or h:mm:ss'}).warning(),
    }),
  ],

  preview: {
    select: {kind: 'kind', sourceName: 'sourceName', url: 'url', media: 'poster'},
    prepare({kind, sourceName, url, media}) {
      return {
        title: sourceName || url || 'Recording',
        subtitle: kind === 'video' ? 'Video' : kind === 'audio' ? 'Audio' : 'Recording',
        media,
      }
    },
  },
})
