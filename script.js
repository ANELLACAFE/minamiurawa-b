// ANELLA CAFE 南浦和店 B型LP — 見学申込みフォームの送信と、ボタンの計測

// Apps Script（B型問い合わせ一覧）の「ウェブアプリURL」を公開後にここへ入れる
var GAS_URL = 'https://script.google.com/macros/s/AKfycbx_V5DqSv7ZApbpPDVXyFTYs58oI9IoWFva1AgOAxg64M5kG8Z3LhwLI4yzErdExjyidA/exec';

// Google広告の「コンバージョンラベル」を作成後にここへ入れる（例: 'AW-1234567890/AbCdEf'）
var ADS_CONVERSIONS = {
  form: '',
  tel: '',
  line: ''
};

// 広告から来たかどうかを覚えておく（gclid＝Google広告のクリック番号）
(function rememberSource() {
  try {
    var q = new URLSearchParams(location.search);
    var keys = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term'];
    keys.forEach(function (k) {
      if (q.get(k)) sessionStorage.setItem('lp_' + k, q.get(k));
    });
    if (!sessionStorage.getItem('lp_referrer')) sessionStorage.setItem('lp_referrer', document.referrer || '');
  } catch (e) { /* 保存できない環境でも動くようにする */ }
})();

function getStored(k) {
  try { return sessionStorage.getItem('lp_' + k) || ''; } catch (e) { return ''; }
}

function sendConversion(kind) {
  var label = ADS_CONVERSIONS[kind];
  if (label && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', { send_to: label });
  }
}

// 電話・LINEボタンが押されたら計測
document.querySelectorAll('[data-track="tel"]').forEach(function (a) {
  a.addEventListener('click', function () { sendConversion('tel'); });
});
document.querySelectorAll('[data-track="line"]').forEach(function (a) {
  a.addEventListener('click', function () { sendConversion('line'); });
});

// ===== フォーム =====
var form = document.getElementById('apply-form');
var errorBox = document.getElementById('form-error');
var submitBtn = document.getElementById('submit-btn');
var thanks = document.getElementById('thanks');
// form.name はフォーム自体の名前と重なるので、入力欄は必ず field('name') で取る
function field(n) { return form.elements.namedItem(n); }

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

function checkForm() {
  var problems = [];
  form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('invalid'); });

  var name = field('name').value.trim();
  var tel = field('tel').value.replace(/[^\d]/g, '');
  if (!name) { problems.push('お名前'); field('name').closest('.field').classList.add('invalid'); }
  if (tel.length < 10 || tel.length > 11 || tel.charAt(0) !== '0') {
    problems.push('電話番号（半角数字10〜11ケタ）');
    field('tel').closest('.field').classList.add('invalid');
  }
  if (!form.querySelector('input[name="who"]:checked')) {
    problems.push('どなたからのご相談か');
    form.querySelector('input[name="who"]').closest('.field').classList.add('invalid');
  }
  if (!form.querySelector('input[name="contact"]:checked')) {
    problems.push('ご希望の連絡方法');
    form.querySelector('input[name="contact"]').closest('.field').classList.add('invalid');
  }
  if (!field('agree').checked) problems.push('個人情報の取り扱いへの同意');
  return problems;
}

form.addEventListener('submit', function (ev) {
  ev.preventDefault();
  errorBox.hidden = true;

  var problems = checkForm();
  if (problems.length) {
    showError('次の項目を確認してください：' + problems.join('、'));
    return;
  }

  if (!GAS_URL) {
    showError('ただいまフォームは準備中です。お手数ですが、お電話（048-767-3936）でお問い合わせください。');
    return;
  }

  var checked = function (n) {
    var el = form.querySelector('input[name="' + n + '"]:checked');
    return el ? el.value : '';
  };
  var times = Array.prototype.map.call(form.querySelectorAll('input[name="time"]:checked'), function (el) { return el.value; });

  var data = new URLSearchParams();
  data.append('name', field('name').value.trim());
  data.append('kana', field('kana').value.trim());
  data.append('tel', field('tel').value.trim());
  data.append('email', field('email').value.trim());
  data.append('who', checked('who'));
  data.append('jukyusha', checked('jukyusha'));
  data.append('contact', checked('contact'));
  data.append('time', times.join('・'));
  data.append('message', field('message').value.trim());
  data.append('website', field('website').value); // いたずら送信よけ
  data.append('gclid', getStored('gclid'));
  data.append('utm_source', getStored('utm_source'));
  data.append('utm_campaign', getStored('utm_campaign'));
  data.append('utm_term', getStored('utm_term'));
  data.append('referrer', getStored('referrer'));

  submitBtn.disabled = true;
  submitBtn.textContent = '送信しています…';

  fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: data })
    .then(function () {
      sendConversion('form');
      form.hidden = true;
      thanks.hidden = false;
      thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
    })
    .catch(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'この内容で送信する';
      showError('送信できませんでした。電波の良いところでもう一度お試しいただくか、お電話（048-767-3936）でお問い合わせください。');
    });
});
