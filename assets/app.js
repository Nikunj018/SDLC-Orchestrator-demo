// ClicqSolve - small progressive enhancements. The site works without this file.

(function () {
  'use strict';

  // Nav: hairline appears once the page has scrolled past the hero edge.
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu.
  var toggle = document.querySelector('.nav-tog');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Colour theme. Light is the default so a demo is predictable in a lit room;
  // the choice persists so a presenter sets it once.
  var themeBtn = document.querySelector('.theme-tog');
  if (themeBtn) {
    var applyTheme = function (mode) {
      if (mode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      themeBtn.textContent = mode === 'dark' ? '◑' : '◐';
    };
    var saved = null;
    try { saved = localStorage.getItem('cs-theme'); } catch (e) { saved = null; }
    applyTheme(saved === 'dark' ? 'dark' : 'light');
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('cs-theme', next); } catch (e) { /* private mode */ }
    });
  }

  // Reveal on scroll. Elements are visible by default if IO is unavailable.
  var targets = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );

  targets.forEach(function (el, index) {
    el.style.transitionDelay = Math.min(index % 4, 3) * 60 + 'ms';
    observer.observe(el);
  });
})();

/* ---------------------------------------------------------------------------
   Engineering economics model.
   Every assumption is an input the visitor can change, including the loaded
   cost multiplier. Nothing is hidden behind the headline number.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var root = document.querySelector('[data-calc]');
  if (!root) return;

  // Salaries are local market rates, not conversions of one another. A US
  // engineer costs about 120k dollars; that is not 22 lakh converted.
  var CCY = {
    INR: { symbol: '₹', locale: 'en-IN', salary: 2200000, step: 50000, max: 9000000 },
    USD: { symbol: '$', locale: 'en-US', salary: 120000, step: 5000, max: 400000 },
    GBP: { symbol: '£', locale: 'en-GB', salary: 72000, step: 2500, max: 250000 },
    EUR: { symbol: '€', locale: 'de-DE', salary: 80000, step: 2500, max: 280000 },
  };

  var ccy = 'INR';

  function money(value) {
    var c = CCY[ccy];
    var v = Math.max(0, value);
    if (ccy === 'INR') {
      if (v >= 1e7) return c.symbol + (v / 1e7).toFixed(2) + ' Cr';
      if (v >= 1e5) return c.symbol + (v / 1e5).toFixed(1) + ' L';
      return c.symbol + Math.round(v).toLocaleString('en-IN');
    }
    if (v >= 1e6) return c.symbol + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return c.symbol + Math.round(v / 1e3) + 'K';
    return c.symbol + Math.round(v).toLocaleString(c.locale);
  }

  var el = function (id) { return root.querySelector('#' + id); };

  var engineers = el('c-eng');
  var salary = el('c-sal');
  var releases = el('c-rel');
  var gain = el('c-gain');
  var loaded = el('c-load');

  function num(input, fallback) {
    var v = parseFloat(input.value);
    return isFinite(v) && v >= 0 ? v : fallback;
  }

  function render() {
    var nEng = num(engineers, 120);
    var nSal = num(salary, CCY[ccy].salary);
    var nRel = num(releases, 4);
    var pct = num(gain, 45) / 100;
    var mult = num(loaded, 1.8);

    var capacity = nEng * pct;
    var spend = nEng * nSal;
    var value = capacity * nSal * mult;
    var after = nRel * (1 + pct);
    var ratio = spend > 0 ? value / spend : 0;

    el('v-eng').textContent = Math.round(nEng).toLocaleString(CCY[ccy].locale);
    el('v-sal').textContent = money(nSal);
    el('v-rel').textContent = Math.round(nRel) + '/mo';
    el('v-gain').textContent = Math.round(pct * 100) + '%';
    el('v-load').textContent = mult.toFixed(2) + '×';

    el('o-value').textContent = money(value);
    el('o-spend').textContent = money(spend);
    el('o-capacity').textContent = '+' + Math.round(capacity).toLocaleString(CCY[ccy].locale);
    el('o-releases').textContent = Math.round(nRel) + ' to ' + Math.round(after) + ' per month';
    el('o-ratio').textContent = ratio.toFixed(2) + '×';

    // Bars are scaled to whichever of the two is larger, so the longer one is
    // always full width and the comparison stays readable at any ratio.
    var peak = Math.max(spend, value, 1);
    el('o-bar-spend').style.width = (spend / peak) * 100 + '%';
    el('o-bar-value').style.width = (value / peak) * 100 + '%';
    el('o-bk-spend').textContent = money(spend);
    el('o-bk-value').textContent = money(value);
  }

  [engineers, salary, releases, gain, loaded].forEach(function (input) {
    input.addEventListener('input', render);
    input.addEventListener('change', render);
  });

  root.querySelectorAll('[data-ccy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      ccy = btn.getAttribute('data-ccy');
      root.querySelectorAll('[data-ccy]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      // Reset to that market's typical salary rather than converting.
      salary.value = String(CCY[ccy].salary);
      salary.step = String(CCY[ccy].step);
      salary.max = String(CCY[ccy].max);
      render();
    });
  });

  render();
})();

/* ---------------------------------------------------------------------------
   Run player.

   One timeline drives four surfaces: the terminal, the agent rail, the Jira
   card and the pull request card. The example is deliberately generic: the
   stages and the gates are the point, not whose file it was.

   The page is complete without this file. If the script never runs, step one
   is what a visitor reads, and it still says what the product does.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var root = document.getElementById('player');
  if (!root) return;

  var AGENTS = [
    'lead', 'analyst', 'architect', 'challenger', 'developer', 'db-engineer',
    'tester', 'reviewer', 'security', 'docs', 'release', 'retro',
  ];

  // A bug route skips these two. Saying so is better than quietly hiding them.
  var OFF_ROUTE = { architect: 1, 'db-engineer': 1 };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Terminal lines. Each entry is [cssClass, text]; '' means plain.
  var STEPS = [
    {
      title: 'One line starts it',
      body: 'An engineer opens Claude Code in the repository and types one line. There is no' +
        ' service to start, no dashboard to open and no webhook. The pipeline runs in the same' +
        ' terminal they already work in.',
      stage: 'intake',
      wait: 'nobody yet',
      writes: 'run record on disk',
      live: 'lead',
      term: [
        ['g1', '$ /ticket ENG-4417'],
        ['', ''],
        ['a1', '════════════════════════════════════'],
        ['w1', '  SEQUENT / ENG-4417 / bug'],
        ['g1', '  Receivables totals are overstated'],
        ['a1', '════════════════════════════════════'],
        ['', ''],
      ],
    },
    {
      title: 'It reads the ticket, once',
      body: 'Intake pulls ENG-4417 from Jira over MCP and writes it to the run directory. It is' +
        ' never fetched again, so every later stage argues from the same text rather than a' +
        ' paraphrase of a paraphrase.',
      stage: 'intake',
      wait: 'nobody yet',
      writes: '00-ticket.md',
      live: 'lead',
      term: [
        ['k1', '✓  lead         ticket read over MCP   0:11'],
        ['g1', '   route: bug · tree clean · run opened'],
        ['', ''],
      ],
    },
    {
      title: 'The analyst finds the cause, not the symptom',
      body: 'Four accumulators add raw minor units straight across six currencies. The' +
        ' expression is the exact expression, with the file and line.' +
        ' A rupee, a yen and a cent are all being treated as the same unit.',
      stage: 'analysis',
      wait: 'nobody yet',
      writes: '01-analysis.md',
      live: 'analyst',
      term: [
        ['k1', '✓  analyst      the file it cited          1:14'],
        ['g1', '   4 sites · every claim cites file:line'],
        ['g1', '   the correct helper already exists,'],
        ['g1', '   is tested, and the function below'],
        ['g1', '   the function below it already calls it.'],
        ['', ''],
      ],
    },
    {
      title: 'A second agent tries to prove the first one wrong',
      body: 'The challenger re-opens every cited path independently. It agrees with the' +
        ' diagnosis and catches an omission: the analyst listed a fourth call site in its own' +
        ' blast radius, then never assigned it a task. A challenge that finds nothing is a' +
        ' failed challenge.',
      stage: 'challenge',
      wait: 'nobody yet',
      writes: '03-challenge.md',
      live: 'challenger',
      term: [
        ['a1', '✓  challenger   SOUND w/ corrections   0:52'],
        ['a1', '   missed: a fourth call site in'],
        ['a1', '   a neighbouring function, listed but'],
        ['a1', '   never assigned a task'],
        ['', ''],
      ],
    },
    {
      title: 'Gate 1. It stops, before touching a file',
      body: 'Not one source file has been edited. The human reads the plan, overrides it to' +
        ' cover all four sites, and approves. Only then does anything leave the laptop: the' +
        ' plan is posted to the ticket and the ticket moves to In Progress.',
      stage: 'GATE 1 / PLAN',
      wait: 'a human',
      writes: 'events.jsonl, Jira comment',
      live: 'lead',
      jira: 'prog',
      jiraLog: [
        'Plan posted as a comment by Sequent',
        'Moved To Do to <b>In Progress</b>',
      ],
      term: [
        ['a1', '┌──────────────────────────────────┐'],
        ['a1', '│ ' + 'GATE 1 of 4 / PLAN'.padEnd(32) + ' │'],
        ['a1', '├──────────────────────────────────┤'],
        ['g1', '│ Blocks: every source edit        │'],
        ['w1', '│ Approve the plan and implement?  │'],
        ['a1', '└──────────────────────────────────┘'],
        ['', ''],
        ['w1', '› yes, fix all four sites'],
        ['', ''],
      ],
    },
    {
      title: 'The developer builds the approved plan, and nothing else',
      body: 'Four call sites routed through the helper that already existed. It noticed two' +
        ' unrelated problems on the way and wrote them down instead of fixing them, so the' +
        ' diff stays small enough for a person to actually read.',
      stage: 'implementation',
      wait: 'nobody yet',
      writes: '04-implementation.md',
      live: 'developer',
      term: [
        ['k1', '✓  developer    1 file, 4 sites       3:08'],
        ['g1', '   +96 −14 · 2 files changed'],
        ['g1', '   2 findings deferred, not fixed'],
        ['', ''],
      ],
    },
    {
      title: 'Gate 2, then evidence rather than assertion',
      body: 'The diff is shown and approved. The tester then writes the regression test,' +
        ' stashes the fix, and runs it to prove the test fails against the broken code. A test' +
        ' that never failed proves nothing.',
      stage: 'qa',
      wait: 'a human, then nobody',
      writes: '05-qa.md',
      live: 'tester',
      term: [
        ['w1', '› GATE 2 approved'],
        ['k1', '✓  tester       34 passing            3:36'],
        ['g1', '   red first: mixed-currency test'],
        ['g1', '   failed on the old code, pasted'],
        ['', ''],
      ],
    },
    {
      title: 'Review and security, in parallel, on the real diff',
      body: 'Two agents read the same diff at once and never write the same file. Security' +
        ' reports what it could not check as loudly as what it could. The deployed environment' +
        ' was unreachable, so that check did not run, and the run says so.',
      stage: 'review, security',
      wait: 'nobody yet',
      writes: '06-review.md, 07-security.md',
      live: 'reviewer',
      also: 'security',
      term: [
        ['k1', '✓  reviewer     0 blocking            1:36'],
        ['k1', '✓  security     CLEAR                 1:28'],
        ['a1', '⚠  dev environment unreachable,'],
        ['a1', '   deployed QA did not run'],
        ['', ''],
      ],
    },
    {
      title: 'Gate 3. A number you can check',
      body: 'The gate shows the reported total before and the total after, against the same' +
        ' data. On a ticket like this one that is the figure finance had already reconciled by' +
        ' hand. You are not asked to trust a green tick. You are given a number and told where' +
        ' to check it.',
      stage: 'GATE 3 / QA',
      wait: 'a human',
      writes: 'events.jsonl',
      live: 'lead',
      jira: 'prog',
      term: [
        ['a1', '┌──────────────────────────────────┐'],
        ['a1', '│ ' + 'GATE 3 of 4 / QA'.padEnd(32) + ' │'],
        ['a1', '├──────────────────────────────────┤'],
        ['r1', '│ Reported total was wrong     │'],
        ['k1', '│ It now matches the ledger       │'],
        ['g1', '│ Regression test proves it   │'],
        ['a1', '└──────────────────────────────────┘'],
        ['', ''],
        ['w1', '› approved'],
        ['', ''],
      ],
    },
    {
      title: 'Gate 4. It asks which branch, then opens the pull request',
      body: 'The last gate asks two things: which branch to target, and permission for every' +
        ' outward action at once. Then it branches, commits, pushes, opens the pull request and' +
        ' comments on the ticket. It never merges, and it never closes the ticket.',
      stage: 'docs, delivery, retro',
      wait: 'a human, then done',
      writes: 'PR, Jira comment, report',
      live: 'release',
      jira: 'rev',
      pr: true,
      jiraLog: [
        'Plan posted as a comment by Sequent',
        'Moved To Do to In Progress',
        'PR link posted, moved to <b>In Review</b>',
      ],
      term: [
        ['k1', '✓  docs         release note         1:01'],
        ['', ''],
        ['a1', '┌──────────────────────────────────┐'],
        ['a1', '│ ' + 'GATE 4 of 4 / DELIVERY'.padEnd(32) + ' │'],
        ['a1', '├──────────────────────────────────┤'],
        ['w1', '│ Open the PR against main?        │'],
        ['g1', '│ Reply with a branch to target    │'],
        ['g1', '│ a different one, or no to stop.  │'],
        ['a1', '└──────────────────────────────────┘'],
        ['', ''],
        ['w1', '› main'],
        ['', ''],
        ['k1', '✓  release      PR opened            1:14'],
        ['k1', '✓  retro        3 proposals          0:48'],
        ['', ''],
        ['k1', 'COMPLETE / ENG-4417 / 17:22'],
        ['a1', 'Degraded: deployed QA did not run'],
      ],
    },
  ];

  var el = function (id) { return document.getElementById(id); };

  var elTerm = el('pl-term');
  var elN = el('pl-n');
  var elTitle = el('pl-title');
  var elBody = el('pl-body');
  var elStage = el('pl-stage');
  var elWait = el('pl-wait');
  var elWrites = el('pl-writes');
  var elAgents = el('pl-agents');
  var elDots = el('pl-dots');
  var elJira = el('pl-jira-status');
  var elJiraLog = el('pl-jira-log');
  var elPrEmpty = el('pl-pr-empty');
  var elPrBody = el('pl-pr-body');
  var elCrumb = el('pl-crumb');
  var btnPrev = el('pl-prev');
  var btnNext = el('pl-next');
  var btnPlay = el('pl-play');
  var btnReset = el('pl-reset');

  var index = 0;
  var timer = null;
  var playing = false;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- agent rail, built once ---------------------------------------------

  AGENTS.forEach(function (name) {
    var li = document.createElement('li');
    li.textContent = name;
    li.setAttribute('data-a', name);
    elAgents.appendChild(li);
  });

  // --- dots, built once ----------------------------------------------------

  STEPS.forEach(function (step, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + step.title);
    b.addEventListener('click', function () { stop(); go(i); });
    elDots.appendChild(b);
  });

  // --- rendering -----------------------------------------------------------

  function renderTerm(upTo, animateLast) {
    var html = '';
    for (var s = 0; s <= upTo; s++) {
      var lines = STEPS[s].term;
      for (var i = 0; i < lines.length; i++) {
        var cls = 'l' + (animateLast && s === upTo && !reduced ? ' new' : '');
        var tint = lines[i][0];
        var text = esc(lines[i][1]);
        html += '<span class="' + cls + '">' +
          (tint ? '<span class="' + tint + '">' + text + '</span>' : text || '&nbsp;') +
          '</span>';
      }
    }
    elTerm.innerHTML = html;
    elTerm.scrollTop = elTerm.scrollHeight;
  }

  function go(i, animate) {
    index = Math.max(0, Math.min(STEPS.length - 1, i));
    var step = STEPS[index];

    elN.textContent = index + 1 < 10 ? '0' + (index + 1) : String(index + 1);
    elTitle.textContent = step.title;
    elBody.innerHTML = step.body;
    elStage.textContent = step.stage;
    elWait.textContent = step.wait;
    elWrites.textContent = step.writes;
    elCrumb.textContent = 'your-repo / sequent / ENG-4417';

    renderTerm(index, animate !== false);

    // Agent rail. Everything the run has already used is done, the current one
    // is live, and the two the bug route skips stay struck through throughout.
    var seen = {};
    for (var s = 0; s <= index; s++) {
      if (STEPS[s].live) seen[STEPS[s].live] = 1;
      if (STEPS[s].also) seen[STEPS[s].also] = 1;
    }
    var liveNow = {};
    liveNow[step.live] = 1;
    if (step.also) liveNow[step.also] = 1;

    elAgents.querySelectorAll('li').forEach(function (li) {
      var name = li.getAttribute('data-a');
      if (OFF_ROUTE[name]) li.setAttribute('data-s', 'off');
      else if (liveNow[name]) li.setAttribute('data-s', 'live');
      else if (seen[name]) li.setAttribute('data-s', 'done');
      else li.removeAttribute('data-s');
    });

    // Jira. Status is the latest one set at or before this step.
    var status = 'todo';
    var log = null;
    for (var j = 0; j <= index; j++) {
      if (STEPS[j].jira) status = STEPS[j].jira;
      if (STEPS[j].jiraLog) log = STEPS[j].jiraLog;
    }
    elJira.setAttribute('data-s', status);
    elJira.textContent = status === 'prog' ? 'In Progress' : status === 'rev' ? 'In Review' : 'To Do';
    elJiraLog.innerHTML = log ? log.map(function (line) { return '<li>' + line + '</li>'; }).join('') : '';

    // Pull request. Nothing before gate 4, which is the whole point.
    var hasPr = false;
    for (var p = 0; p <= index; p++) if (STEPS[p].pr) hasPr = true;
    elPrEmpty.hidden = hasPr;
    elPrBody.hidden = !hasPr;

    // Controls.
    btnPrev.disabled = index === 0;
    btnNext.disabled = index === STEPS.length - 1;
    elDots.querySelectorAll('button').forEach(function (b, i2) {
      b.setAttribute('aria-selected', String(i2 === index));
      b.classList.toggle('done', i2 < index);
    });
  }

  // --- playback ------------------------------------------------------------

  function tick() {
    if (index >= STEPS.length - 1) { stop(); return; }
    go(index + 1);
  }

  // Distinguishes "the visitor took control" from "it scrolled off screen".
  // Only the first should stop it coming back.
  var handedOver = false;

  function start() {
    if (playing || index >= STEPS.length - 1) return;
    playing = true;
    btnPlay.textContent = 'Pause';
    btnPlay.setAttribute('aria-pressed', 'true');
    // Slower without the entrance animation, since each step arrives as a jump
    // rather than easing in and needs a beat longer to read.
    timer = setInterval(tick, reduced ? 5600 : 4200);
  }

  function stop() {
    playing = false;
    btnPlay.textContent = 'Play';
    btnPlay.setAttribute('aria-pressed', 'false');
    if (timer) { clearInterval(timer); timer = null; }
  }

  // A manual step is a decision. Autoplay does not resume behind their back.
  function takeOver(next) {
    handedOver = true;
    stop();
    go(next);
  }

  btnPrev.addEventListener('click', function () { takeOver(index - 1); });
  btnNext.addEventListener('click', function () { takeOver(index + 1); });
  btnPlay.addEventListener('click', function () {
    if (playing) { handedOver = true; stop(); } else { handedOver = false; start(); }
  });
  // Reset means start over, so it re-arms rather than staying handed over.
  btnReset.addEventListener('click', function () {
    stop();
    handedOver = false;
    go(0);
    start();
  });

  // Keys are bound to the player, not the window, so arrows and space keep
  // doing what a visitor expects everywhere else on the page.
  root.setAttribute('tabindex', '0');
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { takeOver(index + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { takeOver(index - 1); e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'Spacebar') {
      if (playing) { handedOver = true; stop(); } else { handedOver = false; start(); }
      e.preventDefault();
    }
  });

  // Autoplay when the section is reached, and again if the visitor comes back
  // to it, but never once they have taken control. Pauses off screen so it is
  // not running through a section nobody is looking at.
  //
  // Reduced motion does not disable this. That setting is about movement, and
  // the entrance animation is already off in CSS; suppressing the walkthrough
  // entirely just leaves those visitors staring at step one. WCAG 2.2.2 wants
  // auto-updating content to be pausable, and Pause is right there.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!handedOver && !playing && index < STEPS.length - 1) start();
          } else if (playing) {
            stop();
          }
        });
      },
      { threshold: 0.25 }
    ).observe(root);
  }

  go(0, false);
})();
