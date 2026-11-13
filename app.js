(function () {
  'use strict';

  // ── 집계 ─────────────────────────────────────────────
  // GoatCounter: 쿠키를 쓰지 않아 동의 창이 필요 없다. 이름 등 입력값은 절대 보내지 않고 이벤트 이름만 보낸다.
  // 계정: nibblestudio.goatcounter.com (2026-11-13 대표 가입). 비우면 아무것도 보내지 않는다.
  // localhost에서는 count.js가 스스로 집계를 건너뛴다(배포 주소에서만 쌓임).
  var GOATCOUNTER_CODE = 'nibblestudio';
  if (GOATCOUNTER_CODE) {
    var gs = document.createElement('script');
    gs.async = true; gs.src = 'https://gc.zgo.at/count.js';
    gs.setAttribute('data-goatcounter', 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count');
    gs.setAttribute('data-goatcounter-settings', '{"no_onload": true}');
    gs.onload = function () { track('visit'); };
    document.head.appendChild(gs);
  }
  function track(name) {
    window.__events = (window.__events || []).concat(name); // 로컬 확인용
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: 'ev-' + name, title: name, event: true });
    }
  }

  // ── 풀이 문장 (직접 씀) ──────────────────────────────
  var TEXT = {
    won:   ['어릴 때 바탕이 단단한 수예요. 주변의 도움을 잘 받는 흐름으로 봐요.',
            '어린 시절에 굴곡이 있는 수로 봐요. 다른 격이 받쳐 주면 크게 걱정하지 않아도 돼요.'],
    hyung: ['사회에 나가 자리를 잡는 힘이 좋은 수예요. 이름의 중심이 되는 격이에요.',
            '일을 시작할 때 막힘이 생기기 쉬운 수로 봐요. 성명학에서 가장 무겁게 보는 격이에요.'],
    i:     ['집안과 가까운 관계가 편안한 수로 봐요.',
            '가까운 사이에서 서운함이 쌓이기 쉬운 수로 봐요.'],
    jeong: ['이름 전체의 흐름이 좋은 수예요. 늦게까지 힘이 이어진다고 봐요.',
            '전체 흐름에 오르내림이 있는 수로 봐요. 한자를 바꾸면 이 수가 달라져요.']
  };
  var MIXED = '좋은 면과 아쉬운 면이 반반인 수로 봐요. 다른 격과 함께 보는 게 좋아요.';
  function grade(t) { return t >= 80 ? '매우 좋음' : t >= 60 ? '좋음' : t >= 40 ? '보통' : '아쉬움'; }
  function summary(t) {
    if (t === 100) return '네 격이 모두 길로 나온 이름이에요.';
    if (t >= 70) return '중심이 되는 격이 좋아 안정된 이름이에요.';
    if (t >= 50) return '길한 격과 흉한 격이 섞여 있는 이름이에요.';
    if (t >= 30) return '중요한 격 일부가 흉으로 나왔어요.';
    return '흉한 격이 많게 나왔어요. 한자를 바꾸면 결과가 달라질 수 있어요.';
  }

  // ── 상태 ─────────────────────────────────────────────
  var state = { sn: '', gn: [], pick: [] }; // pick[i] = 한자 또는 ''
  var $ = function (id) { return document.getElementById(id); };
  var HANGUL1 = /^[가-힣]$/, HANGUL12 = /^[가-힣]{1,2}$/;

  function show(id) {
    ['s-input', 's-hanja', 's-result'].forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('[data-back]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-back')); });
  });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ── 1 → 2 ───────────────────────────────────────────
  $('to-hanja').addEventListener('click', function () {
    var sn = $('sn').value.trim(), gn = $('gn').value.trim(), err = $('err');
    if (!HANGUL1.test(sn) || !HANGUL12.test(gn)) {
      err.hidden = false;
      err.textContent = !HANGUL1.test(sn) ? '성은 한글 한 글자로 넣어 주세요. 두 글자 성은 아직 지원하지 않아요.' : '이름은 한글 한두 글자로 넣어 주세요.';
      return;
    }
    err.hidden = true;
    var chars = [sn].concat(Array.from(gn));
    if (chars.join('') !== [state.sn].concat(state.gn).join('')) state.pick = chars.map(function () { return ''; });
    state.sn = sn; state.gn = Array.from(gn);
    renderPickers(chars);
    show('s-hanja');
  });

  function renderPickers(chars) {
    var box = $('pickers'); box.textContent = '';
    chars.forEach(function (ch, idx) {
      var list = idx === 0 ? surnameCandidates(ch) : nameCandidates(ch);
      var wrap = el('div', 'picker');
      var head = el('div', 'picker-head');
      head.appendChild(el('b', null, ch));
      head.appendChild(el('span', null, idx === 0 ? '성' : '이름 ' + idx + '번째 글자'));
      wrap.appendChild(head);
      var grid = el('div', 'chips'); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', ch + ' 한자');
      var limit = 11, expanded = false;
      function draw() {
        grid.textContent = '';
        var none = el('button', 'chip'); none.type = 'button';
        none.appendChild(el('span', 'none', '모름'));
        none.setAttribute('aria-pressed', state.pick[idx] === '' ? 'true' : 'false');
        none.addEventListener('click', function () { state.pick[idx] = ''; draw(); });
        grid.appendChild(none);
        var rows = expanded ? list : list.slice(0, limit);
        // 고른 한자가 접힌 쪽에 있으면 보이게 넣는다
        if (!expanded && state.pick[idx] && !rows.some(function (r) { return r[0] === state.pick[idx]; })) {
          rows = rows.concat(list.filter(function (r) { return r[0] === state.pick[idx]; }));
        }
        rows.forEach(function (r) {
          var b = el('button', 'chip'); b.type = 'button';
          b.appendChild(el('span', 'h', r[0]));
          b.appendChild(el('span', 'm', r[2] || r[1] + '획'));
          b.setAttribute('aria-pressed', state.pick[idx] === r[0] ? 'true' : 'false');
          b.setAttribute('aria-label', r[0] + ' ' + (r[2] || '') + ' ' + r[1] + '획');
          b.addEventListener('click', function () { state.pick[idx] = r[0]; draw(); });
          grid.appendChild(b);
        });
      }
      draw();
      wrap.appendChild(grid);
      if (list.length > limit) {
        var more = el('button', 'more', '한자 ' + list.length + '개 모두 보기'); more.type = 'button';
        more.addEventListener('click', function () { expanded = !expanded; more.textContent = expanded ? '접기' : '한자 ' + list.length + '개 모두 보기'; draw(); });
        wrap.appendChild(more);
      }
      if (!list.length) wrap.appendChild(el('p', 'hint', '이 음으로 쓰는 인명용 한자가 없어요. 한글 획수로 계산해요.'));
      box.appendChild(wrap);
    });
  }

  // ── 2 → 3 ───────────────────────────────────────────
  var last = null;
  $('to-result').addEventListener('click', function () {
    var r = score({ ch: state.sn, hanja: state.pick[0] },
                  state.gn.map(function (c, i) { return { ch: c, hanja: state.pick[i + 1] }; }));
    last = r;
    renderResult(r);
    show('s-result');
    track('result_done');
  });

  function renderResult(r) {
    var chars = [state.sn].concat(state.gn);
    var grid = $('namegrid'); grid.textContent = '';
    chars.forEach(function (ch, i) {
      var c = el('div', 'cell'), info = r.chars[i], hj = state.pick[i];
      c.appendChild(el('div', 'k', hj ? ch : ''));
      c.appendChild(el('div', hj ? 'h' : 'h empty', hj || ch));
      c.appendChild(el('div', 'm', hj ? info.meaning : '한자 모름'));
      c.appendChild(el('div', 'n', info.stroke + '획'));
      grid.appendChild(c);
    });
    // 이름 도장: 한자가 있으면 한자, 없으면 한글. 세 글자면 '印'을 더해 2x2
    var sealChars = chars.map(function (ch, i) { return state.pick[i] || ch; });
    if (sealChars.length === 3) sealChars.push('印');
    var seal = $('seal'); seal.textContent = '';
    sealChars.forEach(function (c) { seal.appendChild(el('span', null, c)); });
    $('who').textContent = chars.join('') + ' 님의 이름 풀이';
    $('who-sub').textContent = state.pick.some(Boolean)
      ? chars.map(function (ch, i) { return state.pick[i] || ch; }).join('') + ' · 총 ' + r.chars.reduce(function (a, c) { return a + c.stroke; }, 0) + '획'
      : '한자 없이 한글로 계산했어요';
    drawFlow(r);
    drawLocked(r, chars);
    $('score').textContent = r.total;
    $('grade').textContent = grade(r.total);
    $('summary').textContent = summary(r.total);
    $('approx').hidden = !r.hangulUsed;
    var ul = $('frames'); ul.textContent = '';
    r.detail.forEach(function (d) {
      var li = el('li', 'frame');
      li.appendChild(el('div', 'num', d.num));
      var name = el('div', 'name', d.label); name.appendChild(el('small', null, d.life));
      li.appendChild(name);
      li.appendChild(el('span', 'tag ' + (d.lucky ? 'good' : 'bad'), d.gradeName));
      li.appendChild(el('p', null, d.grade === 1 ? MIXED : TEXT[d.key][d.lucky ? 0 : 1]));
      ul.appendChild(li);
    });
    drawCard(r);
  }

  // ── 인생 흐름 그래프 (SVG) ──────────────────────────
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function drawFlow(r) {
    var W = 340, H = 170, L = 16, R = 16, T = 28, B = 40;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': '인생 흐름: ' + r.detail.map(function (d) { return d.life + ' ' + d.gradeName; }).join(', ') });
    var xs = r.detail.map(function (d, i) { return L + i * (W - L - R) / 3; });
    var ys = r.detail.map(function (d) { return T + (3 - d.grade) * (H - T - B) / 3; });
    [0, 1, 2, 3].forEach(function (g) {
      var y = T + g * (H - T - B) / 3;
      svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y, y2: y, 'class': 'axis' }));
    });
    var pts = xs.map(function (x, i) { return x + ',' + ys[i]; }).join(' ');
    svg.appendChild(svgEl('polygon', { points: L + ',' + (H - B) + ' ' + pts + ' ' + (W - R) + ',' + (H - B), 'class': 'area' }));
    svg.appendChild(svgEl('polyline', { points: pts, 'class': 'lineP' }));
    r.detail.forEach(function (d, i) {
      svg.appendChild(svgEl('circle', { cx: xs[i], cy: ys[i], r: 6, 'class': 'dot' }));
      var anchor = i === 0 ? 'start' : i === 3 ? 'end' : 'middle';
      svg.appendChild(svgEl('text', { x: xs[i], y: ys[i] - 12, 'text-anchor': anchor, 'class': 'v' }, d.gradeName));
      svg.appendChild(svgEl('text', { x: xs[i], y: H - 12, 'text-anchor': anchor }, d.life));
    });
    var box = $('flow'); box.textContent = ''; box.appendChild(svg);
  }

  // ── 990원 전체 풀이 미리 보기 (제목·핵심 값은 보이고 해설은 흐림) ──
  var BLUR_TEXT = '이 이름은 첫소리가 이어지며 서로를 받쳐 주는 흐름이에요. 어려서는 주변의 도움이 크고, 사회에 나가서는 사람을 모으는 힘으로 이어져요. 다만 가까운 관계에서는';
  function drawLocked(r, chars) {
    var box = $('locked'); box.textContent = '';
    var flow = soundFlow(chars), yy = yinYang(r.chars.map(function (c) { return c.stroke; }));
    var cards = [
      { t: '소리 기운 (발음오행)', peek: function (p) {
          flow.elements.forEach(function (e, i) {
            p.appendChild(el('span', 'el', e || '?'));
            if (i < flow.relations.length) p.appendChild(el('span', 'rel', flow.relations[i] || ''));
          });
        } },
      { t: '음양 조화', peek: function (p) {
          yy.marks.forEach(function (m) { p.appendChild(el('span', 'el', m)); });
          p.appendChild(el('span', 'rel', yy.balanced ? '고르게 섞임' : '한쪽으로 치우침'));
        } },
      { t: '한자 뜻으로 읽는 이름', peek: function (p) {
          var any = false;
          chars.slice(1).forEach(function (ch, i) {
            var hj = state.pick[i + 1];
            if (hj) { any = true; p.appendChild(el('span', 'el', hj)); p.appendChild(el('span', 'rel', r.chars[i + 1].meaning)); }
          });
          if (!any) p.appendChild(el('span', 'rel', '이름 한자를 고르면 뜻을 엮어 풀어 드려요'));
        } },
      { t: '4격 상세 · 재물 · 건강 · 인연', peek: function (p) {
          r.detail.forEach(function (d) { p.appendChild(el('span', 'el', String(d.num))); });
        } }
    ];
    cards.forEach(function (c) {
      var card = el('div', 'lock-card');
      var top = el('div', 'lock-top'); top.appendChild(el('b', null, c.t));
      var lk = document.createElementNS(NS, 'svg'); lk.setAttribute('aria-hidden', 'true');
      var use = document.createElementNS(NS, 'use'); use.setAttribute('href', '#lock'); lk.appendChild(use);
      top.appendChild(lk); card.appendChild(top);
      var peek = el('div', 'lock-peek'); c.peek(peek); card.appendChild(peek);
      var bl = el('p', 'blur', BLUR_TEXT); bl.setAttribute('aria-hidden', 'true'); card.appendChild(bl);
      box.appendChild(card);
    });
  }

  // ── 결과 카드 (캔버스, 1080x1350, 흰 바탕 + 이름 도장) ──
  function drawCard(r) {
    var cv = $('card'), x = cv.getContext('2d'), W = cv.width, H = cv.height;
    var red = '#b8322a', ink = '#1b1c20', sub = '#5f6a77', line = '#ebebee';
    var sans = '"Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
    var serif = '"Noto Serif KR", Batang, serif';
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    x.textBaseline = 'alphabetic'; x.textAlign = 'left';

    x.fillStyle = red; x.font = '800 40px ' + sans; x.fillText('이름 풀이', 88, 132);
    x.fillStyle = sub; x.font = '500 36px ' + sans; x.fillText('81수리 성명학', 88, 184);

    // 이름 도장 (오른쪽 세로줄부터 읽음)
    var chars = [state.sn].concat(state.gn), sc = chars.map(function (ch, i) { return state.pick[i] || ch; });
    if (sc.length === 3) sc.push('印');
    var cell = 130, pad = 22, rows = sc.length > 2 ? 2 : sc.length, cols = sc.length > 2 ? 2 : 1;
    var sw = cols * cell + pad * 2, sh = rows * cell + pad * 2, sx = W - 88 - sw, sy = 96;
    x.save(); x.translate(sx + sw / 2, sy + sh / 2); x.rotate(-0.05); x.translate(-sw / 2, -sh / 2);
    x.fillStyle = red; roundRect(x, 0, 0, sw, sh, 18); x.fill();
    x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = '700 112px ' + serif;
    sc.forEach(function (c, i) {
      var col = cols - 1 - Math.floor(i / rows), row = i % rows;
      x.fillText(c, pad + col * cell + cell / 2, pad + row * cell + cell / 2 + 40);
    });
    x.restore();

    // 이름과 점수
    x.textAlign = 'left'; x.fillStyle = ink; x.font = '800 64px ' + sans;
    x.fillText(chars.join('') + ' 님', 88, 560);
    x.fillStyle = red; x.font = '800 260px ' + sans; x.fillText(String(r.total), 80, 820);
    var nw = x.measureText(String(r.total)).width;
    x.fillStyle = ink; x.font = '800 72px ' + sans; x.fillText('점', 80 + nw + 12, 820);
    var pw = x.measureText('점').width;
    x.fillStyle = sub; x.font = '700 44px ' + sans; x.fillText(grade(r.total), 80 + nw + 12 + pw + 28, 820);
    x.fillStyle = ink; x.font = '600 40px ' + sans; wrap(x, summary(r.total), 88, 910, W - 176, 56);

    // 4격
    var bx = 88, by = 1030, bw = (W - 176 - 3 * 20) / 4;
    r.detail.forEach(function (d, i) {
      var px = bx + i * (bw + 20);
      if (d.lucky) { x.fillStyle = red; roundRect(x, px, by, bw, 150, 24); x.fill(); }
      else { x.strokeStyle = line; x.lineWidth = 4; roundRect(x, px, by, bw, 150, 24); x.stroke(); }
      x.textAlign = 'center';
      x.fillStyle = d.lucky ? '#ffffff' : sub;
      x.font = '600 32px ' + sans; x.fillText(d.life, px + bw / 2, by + 58);
      x.font = '800 46px ' + sans; x.fillText(d.gradeName, px + bw / 2, by + 118);
    });

    x.textAlign = 'left'; x.fillStyle = sub; x.font = '500 30px ' + sans;
    x.fillText(location.host || '이름 풀이', 88, H - 72);
    x.textAlign = 'right'; x.fillText('재미로 보는 풀이예요', W - 88, H - 72);
  }
  function wrap(x, text, a, b, maxW, lh) {
    var words = text.split(' '), line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (x.measureText(t).width > maxW && line) { x.fillText(line, a, b); b += lh; line = w; } else line = t;
    });
    if (line) x.fillText(line, a, b);
  }
  function roundRect(x, a, b, w, h, rr) {
    x.beginPath(); x.moveTo(a + rr, b); x.arcTo(a + w, b, a + w, b + h, rr); x.arcTo(a + w, b + h, a, b + h, rr);
    x.arcTo(a, b + h, a, b, rr); x.arcTo(a, b, a + w, b, rr); x.closePath();
  }
  // 글꼴이 늦게 오면 카드를 다시 그린다
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (last) drawCard(last); });

  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2400);
  }
  function cardBlob(cb) { $('card').toBlob(cb, 'image/png'); }

  $('save').addEventListener('click', function () {
    track('card_save');
    cardBlob(function (b) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = '이름점수.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      toast('이미지를 저장했어요.');
    });
  });
  $('share').addEventListener('click', function () {
    track('card_share');
    cardBlob(function (b) {
      var file = new File([b], '이름점수.png', { type: 'image/png' });
      var data = { files: [file], title: '내 이름 점수', text: '내 이름은 몇 점일까?' };
      if (navigator.canShare && navigator.canShare(data)) {
        navigator.share(data).catch(function () {});
      } else if (navigator.share) {
        navigator.share({ title: '내 이름 점수', url: location.href }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () { toast('링크를 복사했어요.'); });
      } else {
        toast('이 브라우저는 공유를 지원하지 않아요. 이미지 저장을 써 주세요.');
      }
    });
  });

  // ── 유료 버튼: 결제 없이 안내만 ─────────────────────
  function sheet(title) {
    $('sheet-title').textContent = title + ', 아직 준비 중이에요';
    $('sheet').hidden = false; $('sheet-close').focus();
  }
  $('pay1').addEventListener('click', function () { track('pay990_click'); sheet('전체 풀이'); });
  $('pay1b').addEventListener('click', function () { track('pay990_click'); sheet('전체 풀이'); });
  $('t-baby').addEventListener('click', function () { track('pay39000_baby_click'); sheet('아기 이름 짓기'); });
  $('t-rename').addEventListener('click', function () { track('pay39000_rename_click'); sheet('개명 이름 추천'); });
  $('t-match').addEventListener('click', function () { track('match_click'); sheet('이름 궁합'); });
  $('sheet-close').addEventListener('click', function () { $('sheet').hidden = true; });
  $('sheet').addEventListener('click', function (e) { if (e.target === $('sheet')) $('sheet').hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('sheet').hidden = true; });

  if (!GOATCOUNTER_CODE) track('visit');
})();
