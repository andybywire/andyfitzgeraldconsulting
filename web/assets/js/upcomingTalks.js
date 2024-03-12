document.addEventListener('DOMContentLoaded', function () {
  const upcomingEventsList = document.getElementById('upcomingEvents');
  const pastEventsList = document.getElementById('pastEvents');
  const upcomingEventsHeader = document.querySelector('h2.upcoming');

  let hasUpcomingEvents = false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  Array
    .from(pastEventsList.children)
    .forEach(event => {
      const eventDate = new Date(event.querySelector('time').getAttribute('datetime'));
      if (eventDate >= today) {
        upcomingEventsList.appendChild(event);
        hasUpcomingEvents = true;
      }
    });

  if (hasUpcomingEvents) {
    upcomingEventsHeader
      .classList
      .replace('hidden', 'visible');
    upcomingEventsList
      .classList
      .replace('hidden', 'visible');
  }
});