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

  // ── 결과 카드 (캔버스, 1080×1350) ─────────────────────
  function drawCard(r) {
    var cv = $('card'), x = cv.getContext('2d'), W = cv.width, H = cv.height;
    var brand = '#1f3c88', white = '#ffffff', soft = 'rgba(255,255,255,0.72)', line = 'rgba(255,255,255,0.22)';
    var sans = '"Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
    var serif = '"Noto Serif KR", Batang, serif';
    x.fillStyle = brand; x.fillRect(0, 0, W, H);

    x.fillStyle = soft; x.font = '600 40px ' + sans; x.textBaseline = 'alphabetic';
    x.fillText('81수리 이름 풀이', 88, 140);

    // 도장
    x.save(); x.translate(W - 88 - 96, 76);
    x.strokeStyle = white; x.lineWidth = 5; x.strokeRect(0, 0, 96, 96);
    x.fillStyle = white; x.font = '600 60px ' + serif; x.textAlign = 'center'; x.fillText('名', 48, 70);
    x.restore();

    // 이름 칸
    var chars = [state.sn].concat(state.gn), n = chars.length, cw = 220, gap = 24;
    var x0 = (W - (n * cw + (n - 1) * gap)) / 2;
    chars.forEach(function (ch, i) {
      var cx = x0 + i * (cw + gap), hj = state.pick[i];
      x.strokeStyle = line; x.lineWidth = 3; roundRect(x, cx, 240, cw, 300, 28); x.stroke();
      x.textAlign = 'center'; x.fillStyle = white;
      x.font = (hj ? '600 150px ' + serif : '800 130px ' + sans);
      x.fillText(hj || ch, cx + cw / 2, 430);
      x.fillStyle = soft; x.font = '500 38px ' + sans;
      x.fillText(hj ? ch + ' · ' + r.chars[i].stroke + '획' : r.chars[i].stroke + '획', cx + cw / 2, 500);
    });

    // 점수
    x.textAlign = 'left'; x.fillStyle = white;
    x.font = '800 220px ' + sans; x.fillText(String(r.total), 88, 830);
    var sw = x.measureText(String(r.total)).width;
    x.font = '700 64px ' + sans; x.fillText('점', 88 + sw + 12, 830);
    var pw = x.measureText('점').width;
    x.font = '700 44px ' + sans; x.fillStyle = soft; x.fillText(grade(r.total), 88 + sw + 12 + pw + 28, 830);
    // 한 줄 풀이 (넘치면 두 줄)
    x.fillStyle = white; x.font = '600 40px ' + sans;
    wrap(x, summary(r.total), 88, 910, W - 176, 54);

    // 4격
    var bx = 88, by = 1030, bw = (W - 176 - 3 * 20) / 4;
    r.detail.forEach(function (d, i) {
      var px = bx + i * (bw + 20);
      if (d.lucky) { x.fillStyle = white; roundRect(x, px, by, bw, 150, 24); x.fill(); }
      else { x.strokeStyle = line; x.lineWidth = 3; roundRect(x, px, by, bw, 150, 24); x.stroke(); }
      x.textAlign = 'center';
      x.fillStyle = d.lucky ? brand : soft;
      x.font = '600 34px ' + sans; x.fillText(d.label, px + bw / 2, by + 60);
      x.font = '800 48px ' + sans; x.fillText(d.num + ' ' + d.gradeName, px + bw / 2, by + 120);
    });

    x.textAlign = 'left'; x.fillStyle = soft; x.font = '500 30px ' + sans;
    x.fillText('재미로 보는 풀이예요 · 과학적 근거는 없어요', 88, H - 72);
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
  $('pay2').addEventListener('click', function () { track('pay39000_click'); sheet('개명·아기 이름 추천'); });
  $('sheet-close').addEventListener('click', function () { $('sheet').hidden = true; });
  $('sheet').addEventListener('click', function (e) { if (e.target === $('sheet')) $('sheet').hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('sheet').hidden = true; });

  if (!GOATCOUNTER_CODE) track('visit');
})();
