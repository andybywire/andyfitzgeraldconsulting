// Types the `?inline` import suffix used by icon.tsx. Vite supplies the runtime behavior; this
// only tells TypeScript the import is a string (a data URI).
declare module '*.svg?inline' {
  const uri: string
  export default uri
}
