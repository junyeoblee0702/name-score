// 이름 풀이 엔진 (정적 페이지용, 실행 중 AI 호출 없음)
// 획수: hanja_data.js (인명용 한자, 원획).
// 81수리 등급: 작명 카페 '81영동수' 표(m.cafe.daum.net/sinbisaju/ZuRA/81, 2026-11-13 확인)를 옮김. 학파마다 다르다.
var HANJA_TABLE = (typeof HANJA !== 'undefined') ? HANJA : require('./hanja_data.js').HANJA;

var GRADE_SETS = {
  3: [1,3,5,6,7,8,11,13,15,16,17,18,21,23,24,25,31,32,33,35,37,38,39,41,45,47,48,52,57,61,63,65,67,68,81], // 길
  2: [27,29,30,49,58,71,73,75,77,78], // 중길
  1: [26,51]                          // 반길, 나머지 흉(0)
};
var GRADE_81 = [];
for (var n = 1; n <= 81; n++) {
  GRADE_81[n - 1] = GRADE_SETS[3].indexOf(n) >= 0 ? 3 : GRADE_SETS[2].indexOf(n) >= 0 ? 2 : GRADE_SETS[1].indexOf(n) >= 0 ? 1 : 0;
}
var GRADE_NAME = ['흉', '반길', '중길', '길'];

// shortcut: 한자를 안 고른 글자는 한글 자모 획수의 근사값을 쓴다. 학파마다 다르므로 화면에 밝힌다.
var CHO = [2,4,2,3,6,5,4,4,8,2,4,1,3,6,4,3,4,4,3];
var JUNG = [2,3,3,4,2,3,3,4,2,4,5,3,3,2,4,5,3,2,1,2,1];
var JONG = [0,2,4,4,2,5,5,3,5,7,9,9,7,9,9,8,4,4,6,2,4,1,3,4,3,4,4,3];

function hangulStroke(ch) {
  var c = ch.charCodeAt(0) - 0xAC00;
  if (c < 0 || c > 11171) return null;
  return CHO[Math.floor(c / 588)] + JUNG[Math.floor((c % 588) / 28)] + JONG[c % 28];
}

// 음에 맞는 인명용 한자 후보: [[한자, 원획, 뜻, 교육용], ...]
// 두음법칙: 이(李)는 표에 '리', 노(盧)는 '로', 여(汝)는 '녀/려'로 들어 있어 바뀐 음도 함께 찾는다.
function soundVariants(sound) {
  var c = sound.charCodeAt(0) - 0xAC00;
  if (c < 0 || c > 11171) return [sound];
  var cho = Math.floor(c / 588), rest = c % 588, jung = Math.floor(rest / 28);
  var out = [sound];
  function withCho(k) { out.push(String.fromCharCode(0xAC00 + k * 588 + rest)); }
  if (cho === 11 && [2, 3, 6, 7, 12, 17, 20].indexOf(jung) >= 0) { withCho(5); withCho(2); } // ㅇ→ㄹ,ㄴ
  if (cho === 2) withCho(5); // ㄴ→ㄹ
  return out;
}

function candidates(sound) {
  var seen = {}, rows = [];
  soundVariants(sound).forEach(function (s) {
    (HANJA_TABLE[s] || []).forEach(function (r) { if (!seen[r[0]]) { seen[r[0]] = 1; rows.push(r); } });
  });
  return rows.sort(function (a, b) { return (b[3] - a[3]) || ((a[2] === '') - (b[2] === '')) || (a[1] - b[1]); });
}

// 흔한 성씨 한자를 성 후보 맨 앞에 둔다 (통계청 성씨 상위권 위주)
var SURNAMES = '金李朴崔鄭姜趙尹張林韓吳徐申權黃安宋全洪柳劉高文梁孫裵白許南沈盧河郭成車朱禹具閔羅陳池嚴蔡元千方孔玄咸卞廉楊邊呂秋魯都蘇愼石宣薛馬吉延表魏明奇潘王琴玉陸印孟諸牟卓';
function surnameCandidates(sound) {
  return candidates(sound).slice().sort(function (a, b) {
    var ia = SURNAMES.indexOf(a[0]), ib = SURNAMES.indexOf(b[0]);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
}

// 이름에 자주 쓰는 한자를 이름 후보 앞에 둔다.
// shortcut: 손으로 고른 목록이라 통계가 아니다. 출생신고 한자 통계를 구하면 그것으로 바꾼다.
var NAME_COMMON = '民珉玟旻旼敏俊準埈晙浚峻駿瑞書序叙宇祐佑雨禹賢炫鉉玹顯現智知志芝秀洙修守壽' +
  '娟姸延妍恩銀殷承昇勝允潤胤晟成盛誠聖星在宰載材道度到夏河昊浩晧鎬珍眞鎭振晋珠柱周熙喜姬希' +
  '怡伊利理娥雅亞媛元源瑗苑願煥桓奐惠慧蕙叡藝睿東桐棟斗玄映英瑛榮泳永詠京慶敬景卿炅璟柔侑裕宥' +
  '有由赫結潔律栗率硏唯維惟瑜世鍾宗弦泫讚燦贊璨娜羅那泰兌太海美妙彬斌嬪彩採菜采靜貞正廷庭晶' +
  '定姃政炳秉昞柄丙善宣仙璇鮮選宣雪舒瑞錫碩奭明銘溪桂啓圭奎貴主宙健建乾虎湖鎬好皓孝曉效勳薰訓' +
  '輝徽揮凡範汎林霖琳彬心沁新信愼申實雅安岸晏案仁寅認一日逸林任淵然連蓮演硯燕緣靈令玲怜鈴羚';
function nameCandidates(sound) {
  return candidates(sound).slice().sort(function (a, b) {
    var ia = NAME_COMMON.indexOf(a[0]), ib = NAME_COMMON.indexOf(b[0]);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
}

function strokeOf(sound, hanja) {
  if (hanja) {
    var row = candidates(sound).filter(function (r) { return r[0] === hanja; })[0];
    if (row) return { stroke: row[1], source: 'hanja', meaning: row[2] };
  }
  var h = hangulStroke(sound);
  return { stroke: h || 0, source: h ? 'hangul' : null, meaning: '' };
}

// 81을 넘으면 80을 뺀다(같은 표의 규칙)
function norm81(n) { if (n <= 0) return 81; while (n > 81) n -= 80; return n; }

// 격별 가중치: 형격·정격을 더 무겁게 (이 시험판이 정한 규칙, 근거 없음)
var FRAMES = [
  { key: 'won', label: '원격', life: '어린 시절', w: 20 },
  { key: 'hyung', label: '형격', life: '청년기·사회', w: 30 },
  { key: 'i', label: '이격', life: '중년·가정', w: 20 },
  { key: 'jeong', label: '정격', life: '전체 흐름', w: 30 }
];

// surname: {ch, hanja?}  given: [{ch, hanja?}] 1~2자
function score(surname, given) {
  var s = strokeOf(surname.ch, surname.hanja);
  var g = given.map(function (c) { return strokeOf(c.ch, c.hanja); });
  var gsum = g.reduce(function (a, b) { return a + b.stroke; }, 0);
  var nums = {
    won: norm81(s.stroke + 1),
    hyung: norm81(s.stroke + g[0].stroke),
    i: norm81(given.length === 1 ? g[0].stroke + 1 : gsum),
    jeong: norm81(s.stroke + gsum)
  };
  var detail = FRAMES.map(function (f) {
    var g = GRADE_81[nums[f.key] - 1];
    return { key: f.key, label: f.label, life: f.life, num: nums[f.key], grade: g, gradeName: GRADE_NAME[g], lucky: g >= 2 };
  });
  // 길 1, 중길 0.75, 반길 0.5, 흉 0 을 격 가중치에 곱한다 (이 시험판의 규칙)
  var total = Math.round(detail.reduce(function (a, d, i) { return a + FRAMES[i].w * [0, 0.5, 0.75, 1][d.grade]; }, 0));
  return {
    total: total,
    detail: detail,
    hangulUsed: [s].concat(g).some(function (x) { return x.source === 'hangul'; }),
    chars: [s].concat(g)
  };
}

if (typeof module !== 'undefined') module.exports = { candidates: candidates, surnameCandidates: surnameCandidates, nameCandidates: nameCandidates, strokeOf: strokeOf, score: score, norm81: norm81, GRADE_81: GRADE_81, hangulStroke: hangulStroke };
