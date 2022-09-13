// Desktop header resize on scroll
const header = document.getElementById('header');

document.addEventListener('scroll', () => {
  let position = window.scrollY;  
  if (position >= 45) {
    header.classList.add('compact');
  }
  else {
    header.classList.remove('compact');
  }
})

// Progressive enhancement for mobile menu
// Cf. https://gomakethings.com/progressive-enhancement-the-new-hotness/
let navOpen = document.getElementById("open-menu");
let navClose = document.getElementById("close-menu");
let navMenu = document.getElementById("nav-menu");

// Add a11y attribute to link
navOpen.setAttribute('role', 'button');

navOpen.addEventListener("click", function(event){
  event.preventDefault();
  navMenu.classList.replace('side-nav-closed', 'side-nav-open')
});

navClose.addEventListener("click", function(event){
  event.preventDefault();
  navMenu.classList.replace('side-nav-open', 'side-nav-closed')
});

// Add "upcoming" tag to events in the future
const eventList = Array.from(document.querySelectorAll('#event-list>li>time'));
const today = new Date();

eventList.forEach((event) => {
  let eventDatetime = Date.parse(event.getAttribute('datetime'));
  if (eventDatetime > today ) {
    const fragment = document.createDocumentFragment();
    const future = fragment.appendChild(document.createElement('span'));
    future.classList.add('future');
    future.textContent = 'upcoming';
    event.appendChild(future);
  }
});