# Related content: M1 and M2

Corpus fetched 2026-10-21T21:05:27.472Z from `production-26`, published perspective. 73 documents render a Related band.

Guard: the copied tier logic reproduced `rankRelated` on 73 of 73 pages.

## insights (44 pages)

- Related (not fallback): 43; "Recent" fallback: 1
- Cards shown under "Related": 123 — shared 110, nearer 7, sibling 6
- Cards reached ONLY through the hierarchy (no tag in common with the page): 13
- Pages by card count, hierarchy ranker: {"0":1,"1":2,"2":2,"3":39}
- Pages by card count, flat shared tags: {"0":4,"1":4,"2":2,"3":34}
- Pages where flat tags would show "Recent" (no shared tag with anything eligible): 4
- Intended cards that flat tags' top 3 (raw count) would drop: 59, which is two effects:
  - normalization (raw count -> shared/union ratio) changes 44 cards on 30 pages
  - hierarchy (ratio -> three tiers) changes 20 cards on 15 pages: 13 filling a slot flat tags left empty, 7 breaking a tie between equal shared ratios
  - pages whose top-3 ORDER the hierarchy changes (same cards or not): 21

## presentations (29 pages)

- Related (not fallback): 27; "Recent" fallback: 2
- Cards shown under "Related": 78 — shared 67, nearer 9, sibling 2
- Cards reached ONLY through the hierarchy (no tag in common with the page): 11
- Pages by card count, hierarchy ranker: {"0":2,"1":1,"2":1,"3":25}
- Pages by card count, flat shared tags: {"0":5,"1":2,"2":1,"3":21}
- Pages where flat tags would show "Recent" (no shared tag with anything eligible): 5
- Intended cards that flat tags' top 3 (raw count) would drop: 35, which is two effects:
  - normalization (raw count -> shared/union ratio) changes 19 cards on 13 pages
  - hierarchy (ratio -> three tiers) changes 17 cards on 12 pages: 11 filling a slot flat tags left empty, 6 breaking a tie between equal shared ratios
  - pages whose top-3 ORDER the hierarchy changes (same cards or not): 20

## M2: Dice vs Jaccard

- Full scored ordering identical on 73 of 73 pages; top 3 identical on 73 of 73.

## Precondition context

- Untagged documents: 2 — presentation:knowledge-graphs-and-ia, presentation:information-design
- Documents tagged at a top concept: 0
- Topic concepts with more than one parent: 0
- Documents with a duplicated topic reference: 0

## Per page

| page | type | topics | eligible | result | cards (tier) | vs raw count | vs ratio |
|---|---|---|---|---|---|---|---|
| designing-and-implementing-semantic-data-layers | note | 4 | 5 | Related 3 | shacl-for-the-practitioner (nearer, hierarchy only)<br>the-calm-before-the-storm (sibling, hierarchy only)<br>why-shortcuts-arent-the-road (sibling, hierarchy only) | 3 | 3 |
| site-updates-structure-semantics-standards | article | 6 | 37 | Related 3 | content-modeling-in-the-age-of-flying-cars (shared)<br>elemeno-health-structured-content (shared)<br>who-kap (shared) | 1 | 0 |
| the-calm-before-the-storm | note | 2 | 5 | Related 2 | why-shortcuts-arent-the-road (shared)<br>designing-and-implementing-semantic-data-layers (sibling, hierarchy only) | 1 | 1 |
| why-shortcuts-arent-the-road | note | 2 | 5 | Related 3 | the-calm-before-the-storm (shared)<br>proust-and-the-squid (nearer, hierarchy only)<br>designing-and-implementing-semantic-data-layers (sibling, hierarchy only) | 2 | 2 |
| graphcon-2026-themes-takeaways | article | 3 | 37 | Related 3 | sanity-studio-taxonomy-migration (shared)<br>taxonomy-boot-camp-2022-themes-takeaways (shared)<br>boutique-knowledge-graphs (shared) | 0 | 0 |
| structured-content-in-product-design | presentation | 4 | 28 | Related 3 | beyond-the-page-with-structured-content (shared)<br>information-architecture-for-digital-content (shared)<br>language-arts-for-the-lizard-brain (shared) | 2 | 1 |
| ai-assisted-content-operations-in-practice | presentation | 3 | 28 | Related 3 | conversations-with-robots-voice-ai-structured-content (shared)<br>information-architecture-for-digital-content (shared)<br>boutique-knowledge-graphs-building-smart-content-at-any-scale (shared) | 2 | 0 |
| shacl-for-the-practitioner | note | 1 | 5 | Related 1 | designing-and-implementing-semantic-data-layers (nearer, hierarchy only) | 1 | 1 |
| content-review-approval-workflow-integration | caseStudy | 9 | 37 | Related 3 | delivering-ia (shared)<br>boutique-knowledge-graphs (shared)<br>self-hosting-sanity-studio (shared) | 1 | 0 |
| sanity-everything-nyc-conference-themes-takeaways | article | 3 | 37 | Related 3 | deskilling-large-language-models (shared)<br>self-hosting-sanity-studio (shared)<br>sanity-studio-taxonomy-migration (shared) | 2 | 0 |
| ranked-lists-of-related-content-in-sanity-studio | presentation | 3 | 28 | Related 3 | improv-consulting-yes-and-experts-improvise-solutions-to-real-problems (shared)<br>taxonomy-management-and-use-in-sanity-studio (shared)<br>taxonomy-for-app-makers (shared) | 1 | 0 |
| content-modeling-in-the-age-of-flying-cars | article | 4 | 37 | Related 3 | structured-content-headless-cms (shared)<br>site-updates-structure-semantics-standards (shared)<br>conversations-with-robots (shared) | 1 | 0 |
| orchestrating-the-mundane-deskilling-language-models | presentation | 3 | 28 | Related 3 | prototyping-information-architecture (shared)<br>yes-and-information-architecture-in-the-age-of-artificial-intelligence (shared)<br>content-first-prototyping (shared) | 1 | 1 |
| taxonomy-management-and-use-in-sanity-studio | presentation | 2 | 28 | Related 3 | taxonomy-and-the-headless-cms (shared)<br>beyond-the-page-with-structured-content (shared)<br>information-architecture-for-digital-content (shared) | 1 | 0 |
| designing-content-authoring-experiences | note | 2 | 5 | Recent | — | — | — |
| ai-supported-auto-categorization | article | 3 | 37 | Related 3 | self-hosting-sanity-studio (shared)<br>designing-with-code (shared)<br>sanity-everything-nyc-conference-themes-takeaways (shared) | 2 | 1 |
| sanity-studio-taxonomy-migration | article | 2 | 37 | Related 3 | graphcon-2026-themes-takeaways (shared)<br>self-hosting-sanity-studio (shared)<br>purpose-driven-taxonomy-design (shared) | 2 | 0 |
| purpose-driven-taxonomy-design | article | 2 | 37 | Related 3 | sanity-studio-taxonomy-migration (shared)<br>graphcon-2026-themes-takeaways (shared)<br>ai-taxonomy-term-generation (shared) | 2 | 0 |
| ai-taxonomy-term-generation | article | 3 | 37 | Related 3 | taxonomy-boot-camp-2024-themes-takeaways (shared)<br>deskilling-large-language-models (shared)<br>site-updates-structure-semantics-standards (shared) | 0 | 0 |
| taxonomy-boot-camp-2024-themes-takeaways | article | 3 | 37 | Related 3 | ai-taxonomy-term-generation (shared)<br>site-updates-structure-semantics-standards (shared)<br>the-trouble-with-systems (shared) | 1 | 1 |
| deskilling-large-language-models | article | 4 | 37 | Related 3 | sanity-everything-nyc-conference-themes-takeaways (shared)<br>ai-taxonomy-term-generation (shared)<br>designing-with-code (shared) | 1 | 1 |
| yes-and-information-architecture-in-the-age-of-artificial-intelligence | presentation | 4 | 28 | Related 3 | orchestrating-the-mundane-deskilling-language-models (shared)<br>taxonomy-for-app-makers (shared)<br>ai-assisted-content-operations-in-practice (shared) | 1 | 0 |
| elemeno-health-structured-content | caseStudy | 5 | 37 | Related 3 | uw-medicine (shared)<br>site-updates-structure-semantics-standards (shared)<br>structured-content-headless-cms (shared) | 1 | 0 |
| beyond-the-page-with-structured-content | presentation | 4 | 28 | Related 3 | taxonomy-and-the-headless-cms (shared)<br>information-architecture-for-digital-content (shared)<br>taxonomy-management-and-use-in-sanity-studio (shared) | 1 | 0 |
| domain-modeling-for-digital-information-designers | presentation | 3 | 28 | Related 3 | language-arts-for-the-lizard-brain (shared)<br>design-for-the-human-scale (shared)<br>improv-consulting-yes-and-experts-improvise-solutions-to-real-problems (shared) | 2 | 0 |
| knowledge-graphs-and-ia | presentation | 0 | 28 | Recent | — | — | — |
| taxonomy-boot-camp-2022-themes-takeaways | article | 4 | 37 | Related 3 | graphcon-2026-themes-takeaways (shared)<br>domain-modeling (shared)<br>structured-content-design-22 (shared) | 2 | 0 |
| structured-content-headless-cms | article | 3 | 37 | Related 3 | content-modeling-in-the-age-of-flying-cars (shared)<br>structured-content-design (shared)<br>site-maps-connected-content (shared) | 2 | 1 |
| how-to-get-started-with-knowledge-graphs | presentation | 1 | 28 | Related 2 | boutique-knowledge-graphs-building-smart-content-at-any-scale (shared)<br>conversations-with-robots-voice-ai-structured-content (sibling, hierarchy only) | 1 | 1 |
| improv-consulting-yes-and-experts-improvise-solutions-to-real-problems | presentation | 3 | 28 | Related 3 | ranked-lists-of-related-content-in-sanity-studio (shared)<br>desiring-ecologies (shared)<br>beyond-the-page-with-structured-content (shared) | 0 | 0 |
| boutique-knowledge-graphs-building-smart-content-at-any-scale | presentation | 2 | 28 | Related 3 | how-to-get-started-with-knowledge-graphs (shared)<br>information-architecture-for-digital-content (shared)<br>taxonomy-and-the-headless-cms (shared) | 3 | 1 |
| domain-modeling | article | 4 | 37 | Related 3 | structured-content-design-22 (shared)<br>structured-content-headless-cms (shared)<br>structured-content-design (shared) | 2 | 0 |
| boutique-knowledge-graphs | article | 5 | 37 | Related 3 | self-hosting-sanity-studio (shared)<br>graphcon-2026-themes-takeaways (shared)<br>structured-content-headless-cms (shared) | 2 | 0 |
| structured-content-design-22 | article | 4 | 37 | Related 3 | structured-content-design (shared)<br>site-maps-connected-content (shared)<br>domain-modeling (shared) | 0 | 0 |
| self-hosting-sanity-studio | article | 2 | 37 | Related 3 | boutique-knowledge-graphs (shared)<br>sanity-studio-taxonomy-migration (shared)<br>ai-supported-auto-categorization (shared) | 2 | 1 |
| taxonomy-and-the-headless-cms | presentation | 3 | 28 | Related 3 | beyond-the-page-with-structured-content (shared)<br>information-architecture-for-digital-content (shared)<br>taxonomy-management-and-use-in-sanity-studio (shared) | 0 | 0 |
| browsability-with-dan-brown | presentation | 2 | 28 | Related 3 | responsive-information-architectures (shared)<br>desiring-ecologies (shared)<br>ia-the-current-and-the-future (nearer, hierarchy only) | 1 | 1 |
| who-ntd | caseStudy | 3 | 37 | Related 3 | working-with-an-ia (shared)<br>how-to-hire-an-ia (nearer, hierarchy only)<br>delivering-ia (nearer, hierarchy only) | 2 | 2 |
| ia-the-current-and-the-future | presentation | 1 | 28 | Related 3 | browsability-with-dan-brown (nearer, hierarchy only)<br>responsive-information-architectures (nearer, hierarchy only)<br>desiring-ecologies (nearer, hierarchy only) | 3 | 3 |
| choosing-card-sorting-topics | article | 2 | 37 | Related 3 | cognitive-science-for-designers (shared)<br>keyword-extraction-nlp (shared)<br>uw-medicine (shared) | 2 | 0 |
| uw-medicine | caseStudy | 3 | 37 | Related 3 | elemeno-health-structured-content (shared)<br>site-updates-structure-semantics-standards (shared)<br>sanity-studio-taxonomy-migration (shared) | 1 | 0 |
| who-kap | caseStudy | 2 | 37 | Related 3 | site-updates-structure-semantics-standards (shared)<br>purpose-driven-taxonomy-design (sibling, hierarchy only)<br>conversations-with-robots (sibling, hierarchy only) | 2 | 2 |
| information-architecture-for-digital-content | presentation | 2 | 28 | Related 3 | taxonomy-and-the-headless-cms (shared)<br>beyond-the-page-with-structured-content (shared)<br>conversations-with-robots-voice-ai-structured-content (shared) | 0 | 0 |
| delivering-ia | article | 3 | 37 | Related 3 | when-to-use-an-ia (shared)<br>what-is-information-architecture (shared)<br>content-review-approval-workflow-integration (shared) | 0 | 0 |
| web-writing | article | 3 | 37 | Related 3 | language-meaning-user-experience-architecture (shared)<br>working-with-an-ia (shared)<br>how-to-hire-an-ia (nearer, hierarchy only) | 1 | 1 |
| keyword-extraction-nlp | article | 2 | 37 | Related 3 | choosing-card-sorting-topics (shared)<br>ai-taxonomy-term-generation (shared)<br>uw-medicine (shared) | 2 | 0 |
| unexpected-path-different-backgrounds-to-ux | presentation | 1 | 28 | Related 1 | responsive-information-architectures (nearer, hierarchy only) | 1 | 1 |
| how-to-hire-an-ia | article | 2 | 37 | Related 3 | when-to-use-an-ia (shared)<br>what-is-information-architecture (shared)<br>delivering-ia (shared) | 1 | 0 |
| working-with-an-ia | article | 3 | 37 | Related 3 | language-meaning-user-experience-architecture (shared)<br>web-writing (shared)<br>what-is-information-architecture (shared) | 2 | 1 |
| when-to-use-an-ia | article | 3 | 37 | Related 3 | how-to-hire-an-ia (shared)<br>delivering-ia (shared)<br>what-is-information-architecture (shared) | 1 | 0 |
| what-is-information-architecture | article | 3 | 37 | Related 3 | delivering-ia (shared)<br>when-to-use-an-ia (shared)<br>how-to-hire-an-ia (shared) | 1 | 0 |
| conversations-with-robots | article | 3 | 37 | Related 3 | structured-content-headless-cms (shared)<br>content-modeling-in-the-age-of-flying-cars (shared)<br>boutique-knowledge-graphs (shared) | 1 | 0 |
| conversations-with-robots-voice-ai-structured-content | presentation | 4 | 28 | Related 3 | information-architecture-for-digital-content (shared)<br>taxonomy-and-the-headless-cms (shared)<br>ai-assisted-content-operations-in-practice (shared) | 1 | 0 |
| practical-large-scale-content-analysis | presentation | 4 | 28 | Related 3 | domain-modeling-for-digital-information-designers (shared)<br>ranked-lists-of-related-content-in-sanity-studio (nearer, hierarchy only)<br>design-for-the-human-scale (sibling, hierarchy only) | 2 | 2 |
| design-for-difference | presentation | 2 | 28 | Related 3 | language-arts-for-the-lizard-brain (nearer, hierarchy only)<br>design-for-the-human-scale (nearer, hierarchy only)<br>domain-modeling-for-digital-information-designers (nearer, hierarchy only) | 3 | 3 |
| structured-content-design | article | 3 | 37 | Related 3 | site-maps-connected-content (shared)<br>structured-content-design-22 (shared)<br>structured-content-headless-cms (shared) | 1 | 0 |
| site-maps-connected-content | article | 3 | 37 | Related 3 | structured-content-design (shared)<br>structured-content-design-22 (shared)<br>structured-content-headless-cms (shared) | 1 | 0 |
| prototyping-information-architecture | presentation | 4 | 28 | Related 3 | content-first-prototyping (shared)<br>orchestrating-the-mundane-deskilling-language-models (shared)<br>information-architecture-for-digital-content (shared) | 1 | 1 |
| seattle-childrens | caseStudy | 3 | 37 | Related 3 | shoreline (shared)<br>designing-with-code (shared)<br>purpose-driven-taxonomy-design (shared) | 1 | 0 |
| language-arts-for-the-lizard-brain | presentation | 2 | 28 | Related 3 | beyond-the-page-with-structured-content (shared)<br>information-architecture-for-digital-content (shared)<br>taxonomy-management-and-use-in-sanity-studio (shared) | 1 | 0 |
| content-first-prototyping | presentation | 3 | 28 | Related 3 | prototyping-information-architecture (shared)<br>information-architecture-for-digital-content (shared)<br>taxonomy-management-and-use-in-sanity-studio (shared) | 1 | 0 |
| design-for-the-human-scale | presentation | 2 | 28 | Related 3 | desiring-ecologies (shared)<br>language-arts-for-the-lizard-brain (shared)<br>domain-modeling-for-digital-information-designers (shared) | 2 | 0 |
| taxonomy-for-experience-designers | presentation | 3 | 28 | Related 3 | taxonomy-for-app-makers (shared)<br>taxonomy-management-and-use-in-sanity-studio (shared)<br>responsive-information-architectures (shared) | 1 | 1 |
| shoreline | caseStudy | 3 | 37 | Related 3 | seattle-childrens (shared)<br>designing-with-code (shared)<br>purpose-driven-taxonomy-design (shared) | 1 | 0 |
| cognitive-science-for-designers | article | 2 | 37 | Related 2 | choosing-card-sorting-topics (shared)<br>domain-modeling (shared) | 0 | 0 |
| proust-and-the-squid | note | 1 | 5 | Related 1 | why-shortcuts-arent-the-road (nearer, hierarchy only) | 1 | 1 |
| desiring-ecologies | presentation | 4 | 28 | Related 3 | design-for-the-human-scale (shared)<br>improv-consulting-yes-and-experts-improvise-solutions-to-real-problems (shared)<br>beyond-the-page-with-structured-content (shared) | 0 | 0 |
| information-design | presentation | 0 | 28 | Recent | — | — | — |
| responsive-information-architectures | presentation | 3 | 28 | Related 3 | browsability-with-dan-brown (shared)<br>taxonomy-management-and-use-in-sanity-studio (shared)<br>taxonomy-for-app-makers (shared) | 2 | 0 |
| language-meaning-user-experience-architecture | article | 2 | 37 | Related 3 | structured-content-headless-cms (shared)<br>web-writing (shared)<br>structured-content-design (shared) | 3 | 1 |
| designing-with-code | article | 2 | 37 | Related 3 | the-trouble-with-systems (shared)<br>ai-supported-auto-categorization (shared)<br>structured-content-design (shared) | 2 | 0 |
| the-trouble-with-systems | article | 2 | 37 | Related 3 | designing-with-code (shared)<br>taxonomy-boot-camp-2024-themes-takeaways (shared)<br>delivering-ia (shared) | 2 | 0 |
| taxonomy-for-app-makers | presentation | 2 | 28 | Related 3 | taxonomy-for-experience-designers (shared)<br>taxonomy-management-and-use-in-sanity-studio (shared)<br>responsive-information-architectures (shared) | 1 | 1 |
