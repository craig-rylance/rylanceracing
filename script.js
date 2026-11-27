(function () {
  var header = document.querySelector('.site-header');
  var menuToggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');

  function updateHeader() {
    if (!header) return;
    if (window.scrollY > 24) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open', !expanded);
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menuToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      });
    });
  }

  var form = document.querySelector('.js-contact-form');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = (form.elements.name.value || '').trim();
      var email = (form.elements.email.value || '').trim();
      var phone = (form.elements.phone.value || '').trim();
      var message = (form.elements.message.value || '').trim();

      var recipient = 'arylance@rylanceracing.com';
      var subject = 'Rylance Racing Inquiry' + (name ? ' - ' + name : '');
      var bodyLines = [
        'Name: ' + name,
        'Email: ' + email,
        'Phone Number: ' + phone,
        '',
        'Message:',
        message
      ];

      var mailtoUrl =
        'mailto:' +
        recipient +
        '?subject=' +
        encodeURIComponent(subject) +
        '&body=' +
        encodeURIComponent(bodyLines.join('\r\n'));

      var statusEl = form.querySelector('.form-status');
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.innerHTML =
          'Opening your email app addressed to <a href="mailto:' +
          recipient +
          '">' +
          recipient +
          '</a>. If nothing opened, click the email link directly.';
      }

      window.location.href = mailtoUrl;
    });
  }

  var scheduleContainer = document.getElementById('schedule-container');
  if (scheduleContainer) {
    loadSchedule(scheduleContainer);
  }

  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    var trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return '';
  }

  function renderSchedule(container, data) {
    var titleEl = document.getElementById('schedule-title');
    var pageTitle = data && (data.title || data.heading);
    if (titleEl && pageTitle) {
      titleEl.textContent = pageTitle;
    }

    var seriesList = Array.isArray(data) ? data : (data && Array.isArray(data.series) ? data.series : []);
    container.textContent = '';

    if (!seriesList.length) {
      var emptyMsg = document.createElement('p');
      emptyMsg.className = 'schedule-status';
      emptyMsg.textContent = 'Upcoming schedule details will be posted soon.';
      container.appendChild(emptyMsg);
      return;
    }

    seriesList.forEach(function (seriesItem) {
      if (!seriesItem) return;

      var seriesBlock = document.createElement('div');
      seriesBlock.className = 'schedule-series';

      var seriesName = seriesItem.name || seriesItem.series || seriesItem.title || '';
      if (seriesName) {
        var heading = document.createElement('h2');
        heading.textContent = seriesName;
        seriesBlock.appendChild(heading);
      }

      if (seriesItem.description) {
        var desc = document.createElement('p');
        desc.className = 'schedule-series-description';
        desc.textContent = seriesItem.description;
        seriesBlock.appendChild(desc);
      }

      var events = Array.isArray(seriesItem.events) ? seriesItem.events : [];
      var grid = document.createElement('div');
      grid.className = 'schedule-grid';

      events.forEach(function (ev) {
        if (!ev) return;

        var safeUrl = sanitizeUrl(ev.url);
        var card = document.createElement(safeUrl ? 'a' : 'article');
        card.className = 'event-card';
        if (safeUrl) {
          card.href = safeUrl;
          card.target = '_blank';
          card.rel = 'noopener noreferrer';
        }

        var eventName = ev.name || ev.event || ev.round || ev.title || '';
        if (eventName) {
          var roundEl = document.createElement('div');
          roundEl.className = 'event-round';
          roundEl.textContent = eventName;
          card.appendChild(roundEl);
        }

        var eventDate = ev.date || ev.dates || '';
        if (eventDate) {
          var dateEl = document.createElement('div');
          dateEl.className = 'event-date';
          dateEl.textContent = eventDate;
          card.appendChild(dateEl);
        }

        var venueParts = [ev.venue || ev.track || '', ev.location || ''].filter(Boolean);
        if (venueParts.length) {
          var venueEl = document.createElement('p');
          venueEl.className = 'event-venue';
          venueEl.textContent = venueParts.join(', ');
          card.appendChild(venueEl);
        }

        if (ev.notes) {
          var notesEl = document.createElement('p');
          notesEl.className = 'event-notes';
          notesEl.textContent = ev.notes;
          card.appendChild(notesEl);
        }

        grid.appendChild(card);
      });

      seriesBlock.appendChild(grid);
      container.appendChild(seriesBlock);
    });
  }

  function showScheduleError(container, message) {
    container.textContent = '';
    var errEl = document.createElement('p');
    errEl.className = 'schedule-status schedule-status--error';
    errEl.textContent = message;
    container.appendChild(errEl);
  }

  function loadSchedule(container) {
    var src = container.getAttribute('data-schedule-src') || 'schedule.json';
    fetch(src, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        renderSchedule(container, data);
      })
      .catch(function (err) {
        if (window.location.protocol === 'file:') {
          showScheduleError(
            container,
            'Browser security prevents loading schedule.json over file://. Serve this folder with a local web server (e.g. python3 -m http.server 8000) to view the schedule.'
          );
        } else if (err instanceof SyntaxError) {
          showScheduleError(
            container,
            'Could not parse schedule.json. Please check the file for valid JSON syntax.'
          );
        } else {
          showScheduleError(
            container,
            'Unable to load the race schedule right now. Please try again shortly.'
          );
        }
      });
  }
})();
