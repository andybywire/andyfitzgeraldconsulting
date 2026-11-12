// The tagger moved to studio/tagger/tagger.ts on 2026-11-06, where the Studio's "Suggest
// topics" action shares it with this research. This re-export keeps every research script's
// import as it was. Plain Node runs the .ts file directly, under type stripping, as it runs
// web/src/lib/related.ts.
export * from '../../studio/tagger/tagger.ts'
