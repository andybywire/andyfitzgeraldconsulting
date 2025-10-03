// Script Notes
// - [ ] add a "no matches" message if 3 chars are entered and there's no match (test with 'ooo')
// - [ ] sort out search bar at top of page on mobile (+ add browse categories at bottom)

// Import the preview macro — js ignores as a comment, 
// but njk doesn't:
// {% from "partials/articlePreview.njk" import preview as preview %}

document.addEventListener('DOMContentLoaded', function () {
  fetch('/insight-search.json')
    .then(response => response.json())
    .then(items => {
      // only data that needs to be weighted needs to 
      // be added to `keys`
      const options = {
        keys: [
          {
            name: 'title',
            weight: 1
          }, 
          {
            name: 'tags',
            weight: 0.9
          },
          {
            name: 'description',
            weight: 0.8
          },
          {
            name: 'lede',
            weight: 0.5
          },
        ],
        threshold: 0.3, // At what point does the match algorithm give up: 0 is a perfect match, 1 matches everything
        ignoreLocation: true, // Match can appear anywhere in the provided text
        minMatchCharLength: 3
      };

      const fuse = new Fuse(items, options);

      const insightHeroCopy = document.getElementById('insight-hero-copy');
      const searchInput = document.getElementById('search-box');
      const searchResults = document.getElementById('search-result-list');
      const resultsCount = document.getElementById('results-count');
      const resultDetails = document.getElementById('result-details');
      const previewListings = document.querySelectorAll('.preview-listing:not(#result-details .preview-listing)');
      const pagination = document.querySelector('.pagination');
      
      searchInput.addEventListener('input', function () {
        const query = searchInput.value.trim();
        const results = fuse.search(query);
        
        if (query.length > 0) {
          searchInput.setAttribute('aria-expanded','true');
          searchResults.classList.add('show');
          insightHeroCopy.classList.remove('show');
          resultsCount.style.display = 'block';
          previewListings.forEach(element => {
            element.classList.add('hide');
          });
          pagination.classList.add('hide')
          if (results.length > 0) {
            resultsCount.innerHTML = `${results.length} results found for \<em>${query}\</em>`;
          } else if (query.length < 3) {
            resultsCount.innerHTML = 'Searching Insights ...';
          } else {
            resultsCount.innerHTML = `No results found for \<em>${query}\</em>. Please try another search term.`
          }
        } else {
          searchInput.setAttribute('aria-expanded','false');
          insightHeroCopy.classList.add('show');
          searchResults.classList.remove('show');
          resultsCount.style.display = 'none';
          resultsCount.innerHTML = ''
          previewListings.forEach(element => {
            element.classList.remove('hide');
          });
          pagination.classList.remove('hide')
        }

        resultDetails.innerHTML = '';
        results.forEach(result => {
          const searchResult = document.createElement('div');
          searchResult.innerHTML = `{{ preview() }}`
          resultDetails.appendChild(searchResult);
        });
      });
    });
});