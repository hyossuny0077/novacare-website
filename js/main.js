(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* header: scrolled state + mobile menu */
  var hdr = $('#hdr'), btn = $('#menuBtn'), nav = $('#nav');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  function closeMenu() { nav.classList.remove('open'); hdr.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', '메뉴 열기'); }
  btn.addEventListener('click', function () {
    var open = !nav.classList.contains('open');
    nav.classList.toggle('open', open); hdr.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* statement: words darken as the sentence scrolls through the viewport */
  var st = $('#statement');
  if (st) {
    var words = st.textContent.trim().split(/\s+/);
    st.setAttribute('aria-label', st.textContent.trim());
    st.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
    var ws = st.querySelectorAll('.w');
    var paint = function () {
      var r = st.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.5)));
      var n = Math.round(p * ws.length);
      ws.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    };
    if (reduce) { ws.forEach(function (w) { w.classList.add('on'); }); }
    else { paint(); window.addEventListener('scroll', paint, { passive: true }); window.addEventListener('resize', paint); }
  }

  /* images ease from slightly smaller to full size as they scroll into view */
  var grows = document.querySelectorAll('[data-grow]');
  if (grows.length && !reduce) {
    var grow = function () {
      var vh = window.innerHeight;
      grows.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
        el.style.setProperty('--s', (0.9 + 0.1 * t).toFixed(3));
      });
    };
    grow(); window.addEventListener('scroll', grow, { passive: true }); window.addEventListener('resize', grow);
  }

  /* care loop: line fills as steps come into view */
  var steps = $('#steps');
  if (steps) {
    var items = steps.querySelectorAll('.step');
    var fill = function () {
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.7 - r.top) / (r.height + vh * 0.15)));
      steps.style.setProperty('--p', p.toFixed(3));
      items.forEach(function (el, i) { el.classList.toggle('on', p >= (i + 0.3) / items.length); });
    };
    if (reduce) { steps.style.setProperty('--p', 1); items.forEach(function (el) { el.classList.add('on'); }); }
    else { fill(); window.addEventListener('scroll', fill, { passive: true }); window.addEventListener('resize', fill); }
  }

  /* AI agent demo */
  var demos = {
    daily: {
      label: '일상 대화',
      desc: '날씨, 일정, 복약 안내, 음악, 라디오처럼 일상에서 자주 쓰는 기능을 대화로 이용합니다.',
      chips: [['날씨', ''], ['일정', ''], ['복약 안내', ''], ['음악', ''], ['라디오', '']],
      lines: [
        ['mako', 'MAKO', '좋은 아침이에요. 오늘은 오후부터 비 소식이 있어요.'],
        ['user', '이용자', '그래? 우산 챙겨야겠네.'],
        ['mako', 'MAKO', '네. 그리고 점심 식사 후에 드실 약이 있어요. 시간 되면 알려드릴게요.'],
        ['user', '이용자', '고마워. 라디오도 틀어줘.'],
        ['mako', 'MAKO', '네, 라디오를 켤게요.']
      ]
    },
    care: {
      label: '안부 확인',
      desc: '활동이 감지되지 않는 이벤트가 생기면 음성으로 먼저 안부를 묻고, 응답이 없으면 사전에 정의된 대응 절차로 이어집니다.',
      chips: [['활동 미감지 인식', 'pilot'], ['음성 안부 확인', 'pilot'], ['관리자 알림 연계', 'pilot']],
      lines: [
        ['sys', '', '설정한 시간 동안 활동이 감지되지 않았습니다.'],
        ['mako', 'MAKO', '안녕하세요, 잘 지내고 계신가요? 괜찮으시면 대답해 주세요.'],
        ['sys', '', '응답 없음 · 사전에 정의된 대응 절차로 연계합니다.'],
        ['sys', '', '관리자 화면에 알림이 전달되었습니다. 확인·대응 이력이 기록됩니다.']
      ]
    }
  };
  var chat = $('#chat'), desc = $('#tabdesc'), chips = $('#chips'), label = $('#demoLabel');
  var timers = [], current = 'daily', started = false;

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function play(key) {
    var d = demos[key]; current = key;
    timers.forEach(clearTimeout); timers = [];
    label.textContent = d.label; desc.textContent = d.desc;
    var map = { '': ['현재 제공', ''], pilot: ['실증 중', ' pilot'], plan: ['개발 예정', ' plan'] };
    chips.innerHTML = d.chips.map(function (c) { var m = map[c[1]]; return '<span class="chip">' + esc(c[0]) + '<span class="badge' + m[1] + '">' + m[0] + '</span></span>'; }).join('');
    chat.innerHTML = d.lines.map(function (l) {
      return '<div class="msg ' + l[0] + '">' + (l[1] ? '<small>' + l[1] + '</small>' : '') + esc(l[2]) + '</div>';
    }).join('');
    var msgs = chat.querySelectorAll('.msg');
    msgs.forEach(function (m, i) {
      if (reduce) { m.classList.add('show'); return; }
      timers.push(setTimeout(function () { m.classList.add('show'); }, 500 + i * 1300));
    });
  }
  document.querySelectorAll('.tabs [role="tab"]').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.tabs [role="tab"]').forEach(function (o) { o.setAttribute('aria-selected', String(o === t)); o.tabIndex = o === t ? 0 : -1; });
      play(t.dataset.demo);
    });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var all = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
      var n = all[(all.indexOf(t) + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; n.focus(); n.click();
    });
  });
  var panel = $('#chatpanel');
  play('daily');
  if (!reduce && 'IntersectionObserver' in window) {
    // 화면에 보일 때 처음부터 한 번 재생
    timers.forEach(clearTimeout); chat.querySelectorAll('.msg').forEach(function (m) { m.classList.remove('show'); });
    new IntersectionObserver(function (es, ob) {
      if (es[0].isIntersecting && !started) { started = true; play(current); ob.disconnect(); }
    }, { threshold: 0.4 }).observe(panel);
  }
})();
