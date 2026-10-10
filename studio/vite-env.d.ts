// Types the `?url` import suffix used by icon.tsx. Vite supplies the runtime behavior; this only
// tells TypeScript the import is a string.
declare module '*.svg?url' {
  const url: string
  export default url
}
