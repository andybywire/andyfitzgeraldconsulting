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
let sidenav = document.getElementById("nav-menu");

// Add a11y attribute to link
navOpen.setAttribute('role', 'button');

navOpen.addEventListener("click", function(event){
  event.preventDefault();
  sidenav.style.transform = "translateX(0)";
});

navClose.addEventListener("click", function(event){
  event.preventDefault();
  sidenav.style.transform = "translateX(100%)";
});

// Consider listening w/ event delegation: 
// https://gomakethings.com/listening-for-events-on-multiple-elements-using-javascript-event-delegation/



// $(window).scroll(function() {    
//     var scroll = $(window).scrollTop();

//     if (scroll >= 45) {
//         $("nav").addClass("compact");
//         $("div.nav-wrap").addClass("compact");
//         $("li.title").addClass("compact");
//         $("span.full").addClass("compact");
//         $("nav.top-wrap").addClass("compact");
//         $("div.mobile-nav").addClass("compact");
//     } else {
//         $("nav").removeClass("compact");
//         $("div.nav-wrap").removeClass("compact");
//         $("li.title").removeClass("compact"); 
//         $("span.full").removeClass("compact");   
//         $("nav.top-wrap").removeClass("compact");
//         $("div.mobile-nav").removeClass("compact");   
//     }
// });

// $("#event-list div.event-listing time").each(function () {
//     var eventDate = new Date($(this).attr("datetime"));
//     var currentDate = new Date();

//     if (eventDate > currentDate) {
//         $(this).children("span").css("display", "inline-block");
//     }
// });