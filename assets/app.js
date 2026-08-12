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

  // Which specialists run depends on the ticket, so nothing is struck out.
  // A defect confined to one file would skip the architect and the database
  // engineer. This one reaches three layers, so it does not.
  var OFF_ROUTE = {};

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
      stage: 'analysis, decomposition',
      wait: 'nobody yet',
      writes: '01-analysis.md, 02-plan.md',
      live: 'analyst',
      also: 'architect',
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
      also: 'db-engineer',
      term: [
        ['k1', '✓  developer    1 file, 4 sites       3:08'],
        ['g1', '   +96 −14 · 2 files changed'],
        ['g1', '   2 findings deferred, not fixed'],
        ['', ''],
      ],
    },
    {
      title: 'Gate 2, then the tester goes looking for trouble',
      body: 'The diff is approved. The tester writes the regression test, stashes the fix,'  +
        ' and runs the test against the broken code to prove it fails. A test that never'  +
        ' failed proves nothing. Then it runs against the fix, and one case still fails.',
      stage: 'qa',
      wait: 'a human, then nobody',
      writes: '05-qa.md',
      live: 'tester',
      term: [
        ['w1', '› GATE 2 approved'],
        ['r1', '✗  tester       33 of 34 passing      3:36'],
        ['g1', '   red first: proven on old code'],
        ['r1', '   still failing: aging buckets'],
        ['r1', '   never routed through the helper'],
        ['', ''],
      ],
    },
    {
      title: 'The lead sends it back. Nobody told it to',
      body: 'This is the difference between a team and a queue. The tester rejected the work, so the lead returns it to the developer with the failure attached rather than recording a partial pass and moving on. A human has not been asked for anything yet, because nothing has left the machine.',
      stage: 'rework',
      wait: 'nobody. this is the lead deciding',
      writes: 'events.jsonl',
      live: 'lead',
      rework: 'developer',
      term: [
        ['a1', '↑  returning to developer'],
        ['a1', '   sent back by tester'],
        ['g1', '   reason: 1 site not converted'],
        ['', ''],
        ['k1', '✓  developer    attempt 2, 1 site     0:48'],
        ['', ''],
      ],
    },
    {
      title: 'Re-validated, and the record keeps both attempts',
      body: 'The tester runs again and passes. The run does not quietly forget that it took two attempts: the record shows the rejection, who raised it, and what changed. That is what makes the evidence worth reading six months later.',
      stage: 'qa, attempt 2',
      wait: 'nobody yet',
      writes: '05-qa.md',
      live: 'tester',
      term: [
        ['k1', '✓  tester       34 passing            1:12'],
        ['g1', '   attempt 2 · rejection recorded'],
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
  var elOf = el('pl-of');
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

  var ICO = function (d) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  };
  // A filled triangle and two bars, so the control reads at a glance rather
  // than needing the word beside it.
  var ICON_PLAY = ICO('<polygon points="7 4 19 12 7 20" fill="currentColor" stroke="none"/>');
  var ICON_PAUSE = ICO('<rect x="7" y="5" width="3.4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.6" y="5" width="3.4" height="14" rx="1" fill="currentColor" stroke="none"/>');

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

    // A specialist the lead sent work back to carries the attempt on its chip,
    // so the return shows on the rail as well as in the terminal.
    var reworked = null;
    for (var s2 = 0; s2 <= index; s2++) if (STEPS[s2].rework) reworked = STEPS[s2].rework;

    elAgents.querySelectorAll('li').forEach(function (li) {
      var name = li.getAttribute('data-a');
      if (OFF_ROUTE[name]) li.setAttribute('data-s', 'off');
      else if (liveNow[name]) li.setAttribute('data-s', 'live');
      else if (seen[name]) li.setAttribute('data-s', 'done');

      else li.removeAttribute('data-s');
    });

    elAgents.querySelectorAll('.pl-again').forEach(function (b) { b.remove(); });
    if (reworked) {
      var chip = elAgents.querySelector('li[data-a="' + reworked + '"]');
      if (chip) {
        var badge = document.createElement('span');
        badge.className = 'pl-again';
        badge.textContent = '2';
        badge.title = 'the lead sent work back here';
        chip.appendChild(badge);
      }
    }

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
    btnPlay.innerHTML = ICON_PAUSE + 'Pause';
    btnPlay.setAttribute('aria-pressed', 'true');
    // Slower without the entrance animation, since each step arrives as a jump
    // rather than easing in and needs a beat longer to read.
    timer = setInterval(tick, reduced ? 5600 : 4200);
  }

  function stop() {
    playing = false;
  btnPlay.innerHTML = ICON_PLAY + 'Play';
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

  btnPlay.innerHTML = ICON_PLAY + 'Play';
  // Read the total from the data. It was hardcoded, so adding steps made the
  // counter quietly lie, and the first version of this fix ran inside stop()
  // where it only corrected itself after playback ended.
  if (elOf) elOf.textContent = String(STEPS.length);

  go(0, false);
})();

/* ---------------------------------------------------------------------------
   Motion.

   Four behaviours, each earning its place: reading position on a very long
   page, which section you are in, the pipeline drawing itself in order because
   order is that section's entire subject, and the hero terminal filling once so
   the first thing a visitor sees is the product running rather than a picture
   of it.

   All of it is enhancement. With this file absent the page is complete and
   every element is in its finished state.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var reduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- reading progress --------------------------------------------------

  if (!reduced) {
    var bar = document.createElement('div');
    bar.className = 'prog';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;
    var paint = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
      ticking = false;
    };
    // rAF-coalesced: scroll fires far more often than the screen refreshes.
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) { ticking = true; requestAnimationFrame(paint); }
      },
      { passive: true }
    );
    window.addEventListener('resize', paint, { passive: true });
    paint();
  }

  // --- which section am I in ---------------------------------------------

  var navLinks = [].slice.call(document.querySelectorAll('.nav-links a[href^="#"]:not(.btn)'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    var watched = [];
    navLinks.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) { byId[el.id] = a; watched.push(el); }
    });

    var visible = {};
    var mark = function () {
      // The topmost section that is currently on screen wins, so the highlight
      // does not flicker between two sections that overlap the viewport.
      var best = null;
      watched.forEach(function (el) {
        if (!visible[el.id]) return;
        if (!best || el.getBoundingClientRect().top < best.getBoundingClientRect().top) best = el;
      });
      navLinks.forEach(function (a) { a.classList.remove('here'); });
      if (best && byId[best.id]) byId[best.id].classList.add('here');
    };

    var navObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
        mark();
      },
      // Discount the sticky nav, and only count a section once it is properly
      // in view rather than one pixel over the edge.
      { rootMargin: '-72px 0px -55% 0px' }
    );
    watched.forEach(function (el) { navObs.observe(el); });
  }

  // --- the pipeline draws itself -----------------------------------------

  var rail = document.querySelector('.rail');
  if (rail && 'IntersectionObserver' in window) {
    rail.classList.add('seq');
    var items = [].slice.call(rail.children);

    // Gates get a ring on the timeline dot, so the four stops are findable
    // without reading.
    items.forEach(function (li) {
      if (li.classList.contains('rail-gate')) li.classList.add('gate-lit');
    });

    if (reduced) {
      items.forEach(function (li) { li.classList.add('lit'); });
    } else {
      var railObs = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            obs.unobserve(e.target);
            items.forEach(function (li, i) {
              setTimeout(function () { li.classList.add('lit'); }, i * 110);
            });
          });
        },
        { threshold: 0.12 }
      );
      railObs.observe(rail);
    }
  }

  // --- staggered children -------------------------------------------------

  var stagger = document.querySelectorAll('.stg');
  if (stagger.length) {
    if (!('IntersectionObserver' in window) || reduced) {
      [].forEach.call(stagger, function (el) { el.classList.add('in'); });
    } else {
      var stgObs = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            obs.unobserve(e.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
      );
      [].forEach.call(stagger, function (el) { stgObs.observe(el); });
    }
  }

  // --- the hero terminal fills once --------------------------------------
  //
  // The markup is the finished output, so with JS off or reduced motion on, a
  // visitor sees the complete run. This only withholds it briefly on the way in.

  var heroPre = document.querySelector('.hero .term pre');
  if (heroPre && !reduced) {
    var raw = heroPre.innerHTML.split('\n');
    heroPre.innerHTML = raw
      .map(function (line) {
        return '<span class="tl" style="opacity:0">' + (line === '' ? '&nbsp;' : line) + '</span>';
      })
      .join('');

    var lines = heroPre.querySelectorAll('.tl');
    [].forEach.call(lines, function (el) {
      el.style.display = 'block';
      el.style.transition = 'opacity .18s ease';
    });

    var run = function () {
      [].forEach.call(lines, function (el, i) {
        // Blank lines carry no information, so they do not cost a beat.
        setTimeout(function () { el.style.opacity = '1'; }, 90 + i * 42);
      });
    };

    if ('IntersectionObserver' in window) {
      var heroObs = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            obs.unobserve(e.target);
            run();
          });
        },
        { threshold: 0.25 }
      );
      heroObs.observe(heroPre);
    } else {
      run();
    }
  }

  // --- magnitude in the economics bars ------------------------------------
  //
  // The bars already transition width. Holding them at zero until the section
  // is reached makes the comparison arrive as a movement rather than a fact
  // that was always on screen.

  var numbers = document.getElementById('numbers');
  var barSpend = document.getElementById('o-bar-spend');
  var barValue = document.getElementById('o-bar-value');

  if (numbers && barSpend && barValue && !reduced && 'IntersectionObserver' in window) {
    var target = { spend: barSpend.style.width, value: barValue.style.width };
    barSpend.style.width = '0%';
    barValue.style.width = '0%';

    var barObs = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          obs.unobserve(e.target);
          // A frame of delay, so the browser has a zero width to animate from.
          requestAnimationFrame(function () {
            barSpend.style.width = target.spend || '100%';
            barValue.style.width = target.value || '81%';
          });
        });
      },
      { threshold: 0.2 }
    );
    barObs.observe(numbers);
  }
})();

/* ---------------------------------------------------------------------------
   The hero graph.

   A generative background that is on message rather than decorative: nodes are
   specialists, edges are handoffs, and the travelling pulses are work moving
   through the pipeline. When a pulse lands, the node it arrives at brightens
   and passes it on. Four of the nodes are gates, and a pulse waits at a gate
   before continuing, which is the whole product argument rendered as motion.

   Constraints it holds to:
     - Contrast stays low enough that the headline is never harder to read.
     - Pauses entirely when scrolled out of view, and on a hidden tab.
     - Device pixel ratio aware, capped at 2 so a 3x phone does not render 9x.
     - Reduced motion draws one static frame instead of animating.
     - Theme aware: it reads the CSS custom properties rather than hardcoding.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var canvas = document.querySelector('.mesh');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var reduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Loose pipeline topology in normalised space. Not a grid and not random:
  // it reads left to right with the parallel pair splitting and rejoining,
  // which is the shape of the real route.
  var LAYOUT = [
    { x: 0.06, y: 0.5 },
    { x: 0.17, y: 0.34 },
    { x: 0.17, y: 0.66 },
    { x: 0.3, y: 0.5, gate: true },
    { x: 0.43, y: 0.28 },
    { x: 0.43, y: 0.72 },
    { x: 0.55, y: 0.5, gate: true },
    { x: 0.67, y: 0.32 },
    { x: 0.67, y: 0.68 },
    { x: 0.78, y: 0.5, gate: true },
    { x: 0.89, y: 0.38 },
    { x: 0.89, y: 0.62 },
    { x: 0.97, y: 0.5, gate: true },
  ];

  var EDGES = [
    [0, 1], [0, 2], [1, 3], [2, 3],
    [3, 4], [3, 5], [4, 6], [5, 6],
    [6, 7], [6, 8], [7, 9], [8, 9],
    [9, 10], [9, 11], [10, 12], [11, 12],
  ];

  var nodes = [];
  var pulses = [];
  var blooms = [];
  var w = 0;
  var h = 0;
  var dpr = 1;
  var raf = null;
  var running = false;
  var last = 0;
  var drawTime = 0;

  // Read colour from the stylesheet so the toggle carries the canvas with it.
  var ink = { line: '#000', node: '#000', gate: '#000', bloomWarm: 'rgba(0,0,0,0)', bloomCool: 'rgba(0,0,0,0)', bloomNone: 'rgba(0,0,0,0)' };

  // Accepts #rgb, #rrggbb or an rgb() string and returns it at a given alpha.
  function hexA(c, a) {
    c = String(c).trim();
    var m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      var v = m[1];
      if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
      var num = parseInt(v, 16);
      return 'rgba(' + ((num >> 16) & 255) + ',' + ((num >> 8) & 255) + ',' + (num & 255) + ',' + a + ')';
    }
    m = c.match(/rgba?(([^)]+))/);
    if (m) {
      var parts = m[1].split(",");
      return 'rgba(' + (+parts[0]) + ',' + (+parts[1]) + ',' + (+parts[2]) + ',' + a + ')';
    }
    return 'rgba(0,0,0,' + a + ')';
  }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    var amber = cs.getPropertyValue('--amber').trim() || '#96590a';
    var t3 = cs.getPropertyValue('--t3').trim() || '#6b6c72';
    ink.line = t3;
    ink.node = t3;
    ink.gate = amber;

    // Blooms are tinted from the accent and the page ink, kept very low so
    // they add depth without becoming a gradient background.
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    ink.bloomWarm = hexA(amber, dark ? 0.16 : 0.13);
    ink.bloomCool = hexA(t3, dark ? 0.15 : 0.1);
    ink.bloomNone = hexA(amber, 0);
  }

  function size() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    blooms = [
      { x: 0.22, y: 0.34, r: 0.5, ph: 0.0, warm: true },
      { x: 0.62, y: 0.68, r: 0.42, ph: 2.1, warm: false },
      { x: 0.86, y: 0.26, r: 0.36, ph: 4.2, warm: true },
    ];

    // Large, slow light fields. They are what stops a flat light page
    // reading as a document, and they sit under everything else.
    blooms = [
      { x: 0.2, y: 0.3, r: 0.62, ph: 0.0, warm: true },
      { x: 0.6, y: 0.72, r: 0.5, ph: 2.1, warm: false },
      { x: 0.88, y: 0.22, r: 0.44, ph: 4.2, warm: true },
    ];

    nodes = LAYOUT.map(function (n, i) {
      return {
        x: n.x * w,
        y: n.y * h,
        gate: !!n.gate,
        // A slow independent drift, so the graph breathes without wandering.
        px: n.x * w,
        py: n.y * h,
        ph: i * 0.9,
        lit: 0,
      };
    });
  }

  function spawn() {
    // Start a pulse at the entry node. One at a time from the source keeps it
    // legible; branches multiply it naturally.
    pulses.push({ from: 0, to: Math.random() < 0.5 ? 1 : 2, t: 0, wait: 0 });
  }

  function step(dt, time) {
    // Drift: a small lissajous per node around its home position.
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var a = time * 0.00016 + n.ph;
      n.x = n.px + Math.sin(a) * (w * 0.006);
      n.y = n.py + Math.cos(a * 1.3) * (h * 0.012);
      if (n.lit > 0) n.lit = Math.max(0, n.lit - dt * 0.0016);
    }

    for (var p = pulses.length - 1; p >= 0; p--) {
      var pu = pulses[p];

      if (pu.wait > 0) {
        pu.wait -= dt;
        continue;
      }

      pu.t += dt * 0.00055;

      if (pu.t >= 1) {
        var arrived = nodes[pu.to];
        arrived.lit = 1;

        // Where can it go next?
        var onward = [];
        for (var e = 0; e < EDGES.length; e++) {
          if (EDGES[e][0] === pu.to) onward.push(EDGES[e][1]);
        }

        pulses.splice(p, 1);

        if (onward.length) {
          for (var o = 0; o < onward.length; o++) {
            pulses.push({
              from: pu.to,
              to: onward[o],
              t: 0,
              // A gate holds the work before it passes on. That pause is the
              // point, so it is the longest beat in the animation.
              wait: arrived.gate ? 900 : 0,
            });
          }
        }
      }
    }

    if (pulses.length === 0) spawn();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Blooms drift on a slow lissajous and are drawn before anything else.
    for (var bi = 0; bi < blooms.length; bi++) {
      var bl = blooms[bi];
      var ba = drawTime * 0.00011 + bl.ph;
      var bx = (bl.x + Math.sin(ba) * 0.05) * w;
      var by = (bl.y + Math.cos(ba * 0.8) * 0.06) * h;
      var br = bl.r * Math.max(w, h) * (0.92 + Math.sin(ba * 1.4) * 0.08);
      var grd = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      grd.addColorStop(0, bl.warm ? ink.bloomWarm : ink.bloomCool);
      grd.addColorStop(1, ink.bloomNone);
      ctx.globalAlpha = 1;
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }

    // Edges
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = ink.line;
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    for (var e = 0; e < EDGES.length; e++) {
      var a = nodes[EDGES[e][0]];
      var b = nodes[EDGES[e][1]];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // Nodes
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var r = n.gate ? 7 : 4.5;

      ctx.globalAlpha = 0.62 + n.lit * 0.38;
      ctx.fillStyle = n.gate ? ink.gate : ink.node;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + n.lit * 2, 0, Math.PI * 2);
      ctx.fill();

      if (n.lit > 0.02) {
        ctx.globalAlpha = n.lit * 0.2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 8 + n.lit * 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Pulses
    for (var p = 0; p < pulses.length; p++) {
      var pu = pulses[p];
      var f = nodes[pu.from];
      var t = nodes[pu.to];
      var waiting = pu.wait > 0;
      var pt = waiting ? 0 : pu.t;
      var x = f.x + (t.x - f.x) * pt;
      var y = f.y + (t.y - f.y) * pt;

      // A halo, so a pulse reads as light travelling rather than a dot sliding.
      ctx.globalAlpha = waiting ? 0.16 : 0.12;
      ctx.fillStyle = ink.gate;
      ctx.beginPath();
      ctx.arc(x, y, waiting ? 15 : 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = waiting ? 0.95 : 0.82;
      ctx.beginPath();
      ctx.arc(x, y, waiting ? 4.4 : 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function frame(time) {
    if (!running) return;
    var dt = Math.min(48, time - (last || time));
    last = time;
    drawTime = time;
    step(dt, time);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  readTheme();
  size();

  if (reduced) {
    // One frame, so there is still a graph rather than an empty rectangle.
    nodes[3].lit = 0.6;
    nodes[6].lit = 0.35;
    draw();
  }

  var resizeTimer = null;
  window.addEventListener(
    'resize',
    function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        size();
        if (reduced) draw();
      }, 140);
    },
    { passive: true }
  );

  // Only run while it is on screen, and never behind a hidden tab.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      },
      { threshold: 0 }
    ).observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  // The theme toggle repaints the graph in the new ink.
  var themeBtn = document.querySelector('.theme-tog');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTimeout(function () { readTheme(); if (reduced) draw(); }, 30);
    });
  }
})();

/* ---------------------------------------------------------------------------
   Page-wide visual system.

   Motion had been confined to the hero, which made everything below read as an
   appendix. This wires three devices across every section: the oversized
   section numeral, the rule that draws itself as a section arrives, and a
   pointer-tracked highlight on cards.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var reduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- the section numeral ------------------------------------------------
  // Taken from the eyebrow rather than hardcoded, so renumbering a section
  // cannot leave the watermark out of step with its heading.

  var heads = document.querySelectorAll('.sec .head, .sec-sm .head');
  [].forEach.call(heads, function (head) {
    var eyebrow = head.querySelector('.eyebrow');
    if (!eyebrow) return;
    var m = (eyebrow.textContent || '').match(/^\s*(\d{1,2})\s*\//);
    if (m) head.setAttribute('data-n', m[1]);
  });

  // --- the arriving rule ---------------------------------------------------

  var sections = document.querySelectorAll('.sec');
  if (!('IntersectionObserver' in window) || reduced) {
    [].forEach.call(sections, function (s) { s.classList.add('seen'); });
  } else {
    var secObs = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('seen');
          obs.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.02 }
    );
    [].forEach.call(sections, function (s) { secObs.observe(s); });
  }

  // --- pointer-tracked card highlight -------------------------------------
  // One listener on the document rather than one per card, and it only writes
  // custom properties, so nothing triggers layout.

  if (!reduced && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    var pending = null;

    document.addEventListener(
      'pointermove',
      function (event) {
        var card = event.target.closest ? event.target.closest('.g .card') : null;
        if (!card) return;
        pending = { card: card, x: event.clientX, y: event.clientY };
        if (pending.raf) return;
        requestAnimationFrame(function () {
          if (!pending) return;
          var r = pending.card.getBoundingClientRect();
          pending.card.style.setProperty('--mx', Math.round(pending.x - r.left) + 'px');
          pending.card.style.setProperty('--my', Math.round(pending.y - r.top) + 'px');
          pending = null;
        });
      },
      { passive: true }
    );
  }
})();
