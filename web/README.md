# Sanity 11ty Web

## Folder structure
Inspired by Webstoemp's [Structuring Eleventy projects](https://www.webstoemp.com/blog/eleventy-projects-structure/)

```
+-- _11ty/            // Imported into .eleventy.js. Filters can go here, too. 
  +-- shortcodes/
+-- _data/            // Sanity content generator functions
+-- _includes/      
  +-- icons/
  +-- layouts/
  +-- macros/
  +-- partials/
+-- _site/
+-- _src/             // 11ty template files
+-- assets/           // Passthrough assets
  +-- fonts/
  +-- js/
+-- style/            // SCSS files
+-- utils/            // Sanity utilities
+-- .eleventy.js
+-- .gitignore
+-- client-config.js  // Sanity client config
+-- package-lock.json
+-- package.json
+-- README.md
```