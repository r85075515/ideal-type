/*
 * i18n.js — bilingual UI strings (English / Traditional Chinese).
 * Static page text uses [data-i18n] (textContent) or [data-i18n-html]
 * (innerHTML) attributes; app.js dynamic strings go through
 * window.i18nT(key, vars) and attribute values through window.i18nTV(v).
 * Language persists in localStorage; default follows the browser.
 */
(function () {
  'use strict';

  var DICT = {
    en: {
      badgeAi: 'AI-generated content',
      toggleLabel: '中文',
      h1: 'Find {label} — by choosing, not describing.',
      audienceLabel: 'your ideal woman',
      lede: "Most people can't describe their type. But you know it when you see it. We show you two faces at a time. You pick the one you like more. That's it.",
      step1: '<strong>Pick, left or right.</strong> Up to 30 quick rounds of two faces. You can stop and see your result after 15.',
      step2: '<strong>We learn your taste.</strong> Every pick trains a personal preference model — no forms, no sliders.',
      step3: '<strong>Meet your ideal type.</strong> Get a free watermarked preview of the face your picks point to.',
      step4: '<strong>Want it in HD?</strong> Unlock the high-resolution version plus 3 variations for <strong>$6.99</strong>, one time.',
      audienceNote: 'This round of testing is for people looking for their ideal woman. All faces are AI-generated adults (18+).',
      startBtn: 'Start picking →',
      microFree: 'Free to play · No sign-up · No photo upload — ever',
      aiDisclosure: 'All faces and the generated preview are AI-generated. No real people, no user photos are uploaded or used.',
      disclosureEvents: 'Anonymous usage events (page view, completion, checkout click) are collected to measure the test; see the privacy policy.',
      roundLabel: 'Round {r} of {n}',
      tasteStability: 'Taste stability: ',
      quizPrompt: 'Which face is closer to {label}?',
      audiencePrompt: 'Answer honestly — there are no wrong picks.',
      vsText: 'or',
      skipBtn: 'Neither — skip',
      earlyBtn: 'See my result now →',
      quizMicro: 'Tap a face to vote. Fast tapping is fine — your picks still count.',
      resultH2: 'Your ideal type, according to your picks',
      keptChoosing: 'What you kept choosing',
      summaryEmpty: 'Not enough picks to summarize — your taste stayed broad.',
      summaryLine: 'picked +{p}% more than the pool average',
      resultMeta: 'Based on {n} picks · Confidence: {c} · Finished by: {r}',
      conf_High: 'High', conf_Medium: 'Medium',
      finish_converged: 'your taste converged', finish_max_rounds: 'all rounds played', finish_manual_early: 'you chose to finish early',
      yourPreview: 'Your preview',
      watermark: 'PREVIEW · AI-GENERATED',
      paywallH3: 'Unlock the full version — ${price}',
      payLi1: 'High-resolution version, no watermark',
      payLi2: 'Plus 3 variations of your ideal type',
      payLi3: 'One-time payment. No subscription.',
      payBtn: 'Unlock for ${price} →',
      payNoteLive: 'Secure checkout by Stripe. We email your HD version + 3 variations to your checkout email within 24 hours of payment.',
      payNoteProto: 'Prototype: no payment link is configured yet, so checkout is disabled in this build.',
      variantsH3: 'Your 3 variations would be based on these close matches',
      variantsNote: 'In the live flow, your HD version + 3 variations are produced after payment and delivered by email within 24 hours.',
      wlH3: 'Want her as your own custom model?',
      wlText: 'One-on-one custom character models are in the works — not on sale yet. Join the list and we will email you when commissions open.',
      wlPlaceholder: 'your@email.com', wlBtn: 'Join the list',
      wlDone: 'You are on the list — we will be in touch when commissions open.',
      wlBad: 'Please enter a valid email address.',
      restartBtn: 'Start over',
      exportBtn: 'Export event log (JSON)',
      footerBuild: 'Ideal Type Finder — a small AI preference test.',
      pvTitle: 'Privacy Policy — Ideal Type Finder',
      pvH1: 'Privacy Policy',
      pvUpdated: 'Last updated: October 27, 2026',
      pvH_test: 'What this test does',
      pvP_test: 'Ideal Type Finder is a small preference test. You pick between pairs of AI-generated faces; the picking runs in your browser and works out which style of face you prefer.',
      pvH_collect: 'What we collect',
      pvLi1: '<strong>Anonymous usage events.</strong> To measure whether the test works, we receive anonymous events about how the test is used (for example: page viewed, quiz completed, checkout clicked) together with a random session id that changes every visit. These events contain no name, no email address and nothing that identifies you. Your individual picks are processed in your browser; the full event log also stays in your browser\'s local storage.',
      pvLi2: '<strong>No accounts, no uploads.</strong> We never ask you to create an account, and there is no way to upload your own photos. No real people\'s photos are used anywhere in this test.',
      pvLi3: '<strong>Payments.</strong> If you choose to buy the full result, payment is handled by Stripe on Stripe\'s own pages. We never see or store your card number. Stripe\'s handling of your payment data is covered by <a href="https://stripe.com/privacy">Stripe\'s privacy policy</a>.',
      pvLi4: '<strong>Basic hosting logs.</strong> This site is served by GitHub Pages, which may record standard server logs (such as IP address and browser type) as described in GitHub\'s privacy statement.',
      pvH_ai: 'AI-generated content',
      pvP_ai: 'Every face on this site, including any preview or delivered result, is AI-generated. No face depicts a real person.',
      pvH_waitlist: 'Waitlist emails',
      pvP_waitlist: 'If you join the custom-model waitlist, we store the email address you enter for one purpose only: notifying you if custom model commissions open. We never sell or share it, and you can ask us to delete it at any time via the contact below.',
      pvH_contact: 'Contact',
      pvP_contact: 'Questions about this policy or a purchase: reply to the email receipt you received from Stripe for your purchase, and we will get back to you.',
      pvBack: 'Back to the test',
      footerPrivacyLink: 'Privacy policy',
      poolError: 'Could not load the face pool — please check your connection and reload.',
      dim_ethnicity: 'ethnicity', dim_age_segment: 'age', dim_face_shape: 'face shape', dim_temperament: 'temperament',
      dim_hair_color: 'hair color', dim_hair_style: 'hair style', dim_eye_shape: 'eye shape', dim_skin_tone: 'skin tone',
      attr: {}
    },
    'zh-Hant': {
      badgeAi: 'AI 生成內容',
      toggleLabel: 'EN',
      h1: '找到{label}——不用描述，用選的。',
      audienceLabel: '你的理想型女生',
      lede: '多數人說不出自己的理想型，但看到就知道。我們一次給你看兩張臉，你選比較喜歡的那一張，就這麼簡單。',
      step1: '<strong>二選一，左或右。</strong>最多 30 輪快速選擇，滿 15 輪後隨時可以停下來看結果。',
      step2: '<strong>我們學你的口味。</strong>每一次選擇都在訓練你的個人偏好模型——不用填表、不用拉滑桿。',
      step3: '<strong>見見你的理想型。</strong>免費獲得一張帶浮水印的預覽圖，就是你的選擇指向的那張臉。',
      step4: '<strong>想要高清版？</strong>一次性付費 <strong>$6.99</strong>，解鎖高解析版本＋3 張變化圖。',
      audienceNote: '本輪測試是給想找理想型女生的人。所有臉孔都是 AI 生成的成年人（18+）。',
      startBtn: '開始選擇 →',
      microFree: '免費玩 · 不用註冊 · 絕不上傳你的照片',
      aiDisclosure: '所有臉孔與生成的預覽圖都是 AI 生成。沒有真人，也不會上傳或使用你的照片。',
      disclosureEvents: '我們會收集匿名使用事件（瀏覽、完成、點擊結帳）來量測測試效果；詳見隱私政策。',
      roundLabel: '第 {r} 輪，共 {n} 輪',
      tasteStability: '口味穩定度：',
      quizPrompt: '哪一張臉更接近{label}？',
      audiencePrompt: '照直覺選——沒有錯誤答案。',
      vsText: '或',
      skipBtn: '都不喜歡，跳過',
      earlyBtn: '直接看我的結果 →',
      quizMicro: '點一張臉投票。點得快也沒關係——你的選擇都算數。',
      resultH2: '根據你的選擇，你的理想型是',
      keptChoosing: '你一直選的特徵',
      summaryEmpty: '選擇還不夠多，無法彙總——你的口味很廣。',
      summaryLine: '比平均多選了 +{p}%',
      resultMeta: '根據 {n} 次選擇 · 信心：{c} · 結束方式：{r}',
      conf_High: '高', conf_Medium: '中',
      finish_converged: '你的口味已收斂', finish_max_rounds: '玩滿全部輪次', finish_manual_early: '你選擇提早結束',
      yourPreview: '你的預覽',
      watermark: '預覽 · AI 生成',
      paywallH3: '解鎖完整版 — ${price}',
      payLi1: '高解析版本，沒有浮水印',
      payLi2: '再加 3 張你的理想型變化圖',
      payLi3: '一次性付款，不訂閱。',
      payBtn: '用 ${price} 解鎖 →',
      payNoteLive: '由 Stripe 安全結帳。付款後 24 小時內，我們會把高清版＋3 張變化圖寄到你結帳時填寫的信箱。',
      payNoteProto: '原型版：尚未設定付款連結，本版本結帳停用。',
      variantsH3: '你的 3 張變化圖會以這些接近的臉為基礎',
      variantsNote: '正式流程中，高清版＋3 張變化圖會在付款後製作，24 小時內寄到你的信箱。',
      wlH3: '想把她做成你的專屬模型？',
      wlText: '一對一客製人物模型正在開發中，尚未開賣。加入名單，開放委託時我們會第一時間用信箱通知你。',
      wlPlaceholder: '你的信箱', wlBtn: '加入名單',
      wlDone: '已加入名單，開放委託時會通知你。',
      wlBad: '請輸入有效的信箱。',
      restartBtn: '重新開始',
      exportBtn: '匯出事件紀錄 (JSON)',
      footerBuild: 'Ideal Type Finder —— 一個小小的 AI 偏好測驗。',
      pvTitle: '隱私政策 — Ideal Type Finder',
      pvH1: '隱私政策',
      pvUpdated: '最後更新：2026 年 10 月 27 日',
      pvH_test: '這個測驗做什麼',
      pvP_test: 'Ideal Type Finder 是一個小型偏好測驗。你在成對的 AI 生成臉孔之間做選擇；選擇在你的瀏覽器中進行，系統藉此推算你偏好的臉型風格。',
      pvH_collect: '我們收集什麼',
      pvLi1: '<strong>匿名使用事件。</strong>為了量測測驗效果，我們會收到匿名使用事件（例如：瀏覽頁面、完成測驗、點擊結帳），以及一個每次造訪隨機產生的工作階段編號。這些事件不含姓名、電子郵件或任何可識別你身分的資訊。你的個別選擇在瀏覽器中處理；完整事件紀錄同時保存在你瀏覽器的本機儲存空間。',
      pvLi2: '<strong>不註冊、不上傳。</strong>我們從不要求你建立帳號，也沒有任何上傳自己照片的管道。本測驗不使用任何真人的照片。',
      pvLi3: '<strong>付款。</strong>若你選擇購買完整結果，付款由 Stripe 在其自有頁面上處理。我們看不到、也不保存你的卡號。Stripe 對付款資料的處理受 <a href="https://stripe.com/privacy">Stripe 隱私政策</a>規範。',
      pvLi4: '<strong>基本主機紀錄。</strong>本站由 GitHub Pages 提供，GitHub 可能依其隱私聲明記錄標準伺服器日誌（例如 IP 位址與瀏覽器類型）。',
      pvH_ai: 'AI 生成內容',
      pvP_ai: '本站的每一張臉，包括預覽與交付的成果，都是 AI 生成。沒有任何一張臉描繪真實人物。',
      pvH_waitlist: '候補名單信箱',
      pvP_waitlist: '若你加入客製模型候補名單，我們只會把你填寫的信箱用於一個目的：在客製委託開放時通知你。我們不會出售或分享，你隨時可以透過下方聯絡方式要求刪除。',
      pvH_contact: '聯絡方式',
      pvP_contact: '對本政策或購買有疑問：回覆你從 Stripe 收到的購買收據郵件，我們會回覆你。',
      pvBack: '回到測驗',
      footerPrivacyLink: '隱私政策',
      poolError: '無法載入臉孔圖池——請檢查連線後重新整理。',
      dim_ethnicity: '族裔', dim_age_segment: '年齡', dim_face_shape: '臉型', dim_temperament: '氣質',
      dim_hair_color: '髮色', dim_hair_style: '髮型', dim_eye_shape: '眼型', dim_skin_tone: '膚色',
      attr: {
        'African': '非洲裔', 'East Asian': '東亞', 'European': '歐裔', 'Latina': '拉丁裔',
        'Middle Eastern / North African': '中東／北非', 'South Asian': '南亞', 'Southeast Asian': '東南亞',
        'diamond with prominent cheekbones': '菱形臉（顴骨明顯）', 'heart-shaped': '心形臉', 'long': '長臉',
        'oval': '鵝蛋臉', 'round': '圓臉', 'square with a defined jawline': '方臉（下顎線明顯）',
        'bold, distinctive': '野性／個性', 'calm, intellectual': '知性文藝', 'cool, elegant, high-fashion': '冷豔高級感',
        'innocent, girl-next-door': '清純鄰家', 'mature, confident': '成熟幹練', 'sweet, approachable': '甜美親和',
        'black': '黑髮', 'blonde': '金髮', 'dark brown': '深棕髮', 'medium-to-light brown': '中淺棕髮', 'reddish copper': '紅銅髮',
        'long straight center-parted, falling behind her shoulders': '中分長直髮', 'low bun': '低髮髻', 'low ponytail': '低馬尾',
        'almond-shaped': '杏眼', 'deep-set': '深邃眼窩', 'large round with visible double eyelids': '大圓眼（雙眼皮明顯）',
        'long narrow phoenix': '細長丹鳳眼', 'slightly downturned, gentle': '下垂無辜眼',
        'deep': '深膚色', 'fair': '淺膚色', 'light-medium': '中淺膚色', 'medium tan': '小麥膚色'
      }
    }
  };

  var LS_KEY = 'idealtype_lang';
  var lang = 'en';
  try {
    lang = localStorage.getItem(LS_KEY) ||
      ((navigator.language || 'en').toLowerCase().indexOf('zh') === 0 ? 'zh-Hant' : 'en');
  } catch (e) { /* keep default */ }
  if (!DICT[lang]) lang = 'en';

  function dict() { return DICT[lang]; }
  function t(key, vars) {
    if (typeof key !== 'string') return '';
    var s = dict()[key] || DICT.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }
  function tv(value) { return (dict().attr && dict().attr[value]) || value; }

  function applyI18n() {
    document.documentElement.lang = lang === 'zh-Hant' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'), { label: t('audienceLabel'), price: window.M0_CONFIG ? window.M0_CONFIG.priceUSD.toFixed(2) : '6.99' });
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'), { label: t('audienceLabel') });
    });
    document.querySelectorAll('[data-audience-label]').forEach(function (el) { el.textContent = t('audienceLabel'); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    var toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = t('toggleLabel');
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem(LS_KEY, next); } catch (e) { /* ignore */ }
    applyI18n();
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: lang } }));
  }

  window.i18nT = t;
  window.i18nTV = tv;
  window.i18nLang = function () { return lang; };
  window.applyI18n = applyI18n;

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () { setLang(lang === 'en' ? 'zh-Hant' : 'en'); });
    }
    applyI18n();
  });
})();
