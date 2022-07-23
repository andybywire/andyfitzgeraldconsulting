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