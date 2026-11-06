/* Louis Verde 官网公共脚本：页头页脚、想要清单、系列页、详情页、通知表单 */
(function () {
  'use strict';

  var CONFIG = window.LV_CONFIG || {};
  var DESIGNS = window.LV_DESIGNS || [];
  var WISH_KEY = 'lv-wishlist';
  var page = document.body.dataset.page;

  // 正式 Logo 图形（来自 02_LOGO 矢量稿 V0.3）。dark=true 时 L 用象牙白。
  function monogram(dark) {
    return '<svg viewBox="120 84 192 192" aria-hidden="true">' +
      '<path fill="' + (dark ? '#F5F0E7' : '#0B3028') + '" d="M 126 90 H 202 V 92 C 184 92 177 99 177 113 V 222 C 177 238 182 244 198 246 H 225 V 249 H 126 V 247 C 143 246 148 240 148 226 V 113 C 148 98 142 94 126 92 Z"/>' +
      '<path fill="#B89A62" d="M 178 132 H 221 V 134 C 208 134 206 140 211 153 L 245 235 L 277 153 C 282 141 279 136 267 134 V 132 H 306 V 134 C 294 134 289 142 284 154 L 243 270 H 241 L 190 153 C 185 140 183 135 178 134 Z"/>' +
      '</svg>';
  }
  var HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- 想要清单（存在本机浏览器里） ----------
  function getWish() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY)) || []; } catch (e) { return []; }
  }
  function setWish(list) {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(list)); } catch (e) { /* 隐私模式下忽略 */ }
    document.querySelectorAll('.wish-count').forEach(function (el) { el.textContent = list.length ? list.length : ''; });
  }
  function toggleWish(id) {
    var list = getWish();
    var i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    setWish(list);
    send({ type: 'vote', id: id, on: i < 0 });
    return i < 0;
  }

  // ---------- 把数据送到 Louis 的 Google 表格（没填地址时不发送） ----------
  function visitorId() {
    try {
      var v = localStorage.getItem('lv-visitor');
      if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('lv-visitor', v); }
      return v;
    } catch (e) { return 'anon'; }
  }
  function send(data) {
    if (!CONFIG.formEndpoint) return Promise.resolve(null);
    data.visitor = visitorId();
    data.page = location.pathname;
    // 用 text/plain 发送，避免 Google 脚本不支持的跨域预检
    return fetch(CONFIG.formEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data), keepalive: true
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-wish]');
    if (!btn) return;
    e.preventDefault();
    var on = toggleWish(btn.dataset.wish);
    document.querySelectorAll('[data-wish="' + btn.dataset.wish + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', on);
      var label = b.querySelector('.wish-text');
      if (label) label.textContent = on ? '已加入想要' : '我想要这一款';
    });
    if (page === 'collection' && currentFilter === 'wish') renderGrid();
  });

  // ---------- 页头 ----------
  var nav = [
    ['index.html', '首页', 'home'],
    ['collection.html', '设计系列', 'collection'],
    ['about.html', '品牌故事', 'about'],
    ['index.html#notify', '上新通知', 'notify']
  ];
  var header = document.getElementById('site-header');
  if (header) {
    header.className = 'header';
    header.innerHTML =
      '<div class="wrap">' +
        '<a class="brand" href="index.html" aria-label="Louis Verde 首页">' + monogram(false) + '<span class="wordmark">LOUIS VERDE</span></a>' +
        '<button class="menu-btn" aria-label="打开菜单" aria-expanded="false"><span></span><span></span></button>' +
        '<nav class="nav" aria-label="主导航">' +
          nav.map(function (n) {
            return '<a href="' + n[0] + '"' + (n[2] === page ? ' aria-current="page"' : '') + '>' + n[1] + '</a>';
          }).join('') +
          '<a class="wish-link" href="collection.html?show=wish">想要 <span class="wish-count"></span></a>' +
        '</nav>' +
      '</div>';
    var menuBtn = header.querySelector('.menu-btn');
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    header.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- 页脚 ----------
  var footer = document.getElementById('site-footer');
  if (footer) {
    var social = CONFIG.social || {};
    var links = Object.keys(social).filter(function (k) { return social[k]; }).map(function (k) {
      return '<li><a href="' + esc(social[k]) + '" target="_blank" rel="noopener">' + esc(k) + '</a></li>';
    }).join('');
    footer.className = 'footer';
    footer.innerHTML =
      '<div class="wrap">' +
        '<div class="top">' +
          '<div><a class="brand" href="index.html">' + monogram(true) + '<span class="wordmark">LOUIS VERDE</span></a>' +
          '<p style="margin-top:20px;max-width:26em">让自然，贴近生活。<br><span class="en">Nature, held close.</span></p></div>' +
          '<div><h4>浏览</h4><ul><li><a href="collection.html">设计系列</a></li><li><a href="about.html">品牌故事</a></li><li><a href="index.html#notify">上新通知</a></li></ul></div>' +
          '<div><h4>关注我们</h4><ul>' + (links || '<li>社媒账号即将公布</li>') +
          (CONFIG.email ? '<li><a href="mailto:' + esc(CONFIG.email) + '">' + esc(CONFIG.email) + '</a></li>' : '') + '</ul></div>' +
        '</div>' +
        '<div class="bottom"><span>© ' + new Date().getFullYear() + ' Louis Verde</span>' +
        '<span>本站展示的作品为设计概念，正式上架的单品以实物照片和检测资料为准。</span></div>' +
      '</div>';
  }
  setWish(getWish());

  // ---------- 卡片 ----------
  function card(d) {
    var on = getWish().indexOf(d.id) >= 0;
    return '<article class="card reveal">' +
      '<a class="ph" href="design.html?id=' + d.id + '"><img src="assets/img/' + d.id + '.webp" width="' + d.w + '" height="' + d.h + '" alt="' + esc(d.name + '，' + d.catZh + '设计概念') + '" loading="lazy"></a>' +
      '<span class="tag">设计概念</span>' +
      '<button class="wish" data-wish="' + d.id + '" aria-pressed="' + on + '" aria-label="想要 ' + esc(d.name) + '">' + HEART + '</button>' +
      '<a class="meta" href="design.html?id=' + d.id + '"><span class="name">' + esc(d.name) + '</span><span class="cat-label">' + esc(d.catZh) + ' · ' + d.id + '</span></a>' +
    '</article>';
  }

  // ---------- 系列页 ----------
  var currentFilter = 'all';
  function renderGrid() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var wish = getWish();
    var list = DESIGNS.filter(function (d) {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'wish') return wish.indexOf(d.id) >= 0;
      if (currentFilter === 'studio') return d.series === 'studio';
      return d.cat === currentFilter;
    });
    grid.innerHTML = list.length ? list.map(card).join('') :
      '<p class="empty">' + (currentFilter === 'wish' ? '还没有想要的款式。点图片右上角的心形，就能加进来。' : '这个分类暂时没有作品。') + '</p>';
    observe();
  }
  if (page === 'collection') {
    var params = new URLSearchParams(location.search);
    currentFilter = params.get('show') || params.get('cat') || 'all';
    var chips = document.querySelectorAll('.chip');
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', c.dataset.filter === currentFilter);
      c.addEventListener('click', function () {
        currentFilter = c.dataset.filter;
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c); });
        history.replaceState(null, '', currentFilter === 'all' ? 'collection.html' :
          'collection.html?' + (currentFilter === 'wish' ? 'show=' : 'cat=') + currentFilter);
        renderGrid();
      });
    });
    renderGrid();
  }

  // ---------- 详情页 ----------
  if (page === 'design') {
    var id = new URLSearchParams(location.search).get('id');
    var d = DESIGNS.filter(function (x) { return x.id === id; })[0] || DESIGNS[0];
    var on = getWish().indexOf(d.id) >= 0;
    document.title = d.name + ' · ' + d.catZh + ' · Louis Verde';
    document.getElementById('detail').innerHTML =
      '<p class="crumbs"><a href="collection.html">设计系列</a> / <a href="collection.html?cat=' + d.cat + '">' + esc(d.catZh) + '</a> / ' + esc(d.name) + '</p>' +
      '<div class="detail">' +
        '<div class="ph"><img src="assets/img/' + d.id + '.webp" width="' + d.w + '" height="' + d.h + '" alt="' + esc(d.name + '，' + d.catZh + '设计概念') + '"></div>' +
        '<div class="info">' +
          '<span class="cat-label">' + esc(d.catEn) + ' · ' + d.id + '</span>' +
          '<h1>' + esc(d.name) + '</h1>' +
          '<p class="en">' + esc(d.catZh) + '设计概念 · Design study</p>' +
          '<p class="lead" style="margin-top:28px">' + esc(d.desc) + '</p>' +
          '<dl class="facts">' +
            '<div><dt>品类</dt><dd>' + esc(d.catZh) + '</dd></div>' +
            '<div><dt>尺寸设想</dt><dd>' + esc(d.size) + '</dd></div>' +
            '<div><dt>材质</dt><dd>白绿色系天然石材。每件实物颜色和纹理各不相同，正式上架时附实物照片和检测资料。</dd></div>' +
            '<div><dt>状态</dt><dd>设计中，暂未开售</dd></div>' +
          '</dl>' +
          '<div class="actions">' +
            '<button class="btn" data-wish="' + d.id + '" aria-pressed="' + on + '"><span class="wish-text">' + (on ? '已加入想要' : '我想要这一款') + '</span></button>' +
            '<a class="btn ghost" href="index.html#notify">上新时通知我</a>' +
          '</div>' +
          '<p class="notice">这是一张设计概念图，用来展示造型和比例方向，不是商品实拍。你的“想要”会帮助我们决定首批制作哪几款。</p>' +
        '</div>' +
      '</div>';
    var more = DESIGNS.filter(function (x) { return x.cat === d.cat && x.id !== d.id; }).slice(0, 4);
    document.getElementById('more').innerHTML = more.map(card).join('');
  }

  // ---------- 首页：品类入口 ----------
  var cats = document.getElementById('cats');
  if (cats) {
    var picks = [['bangles', 'G01'], ['beads', 'H02'], ['pendants', 'J01'], ['carvings', 'K01'], ['rings', 'R02'], ['earrings', 'E03']];
    cats.innerHTML = picks.map(function (p) {
      var d = DESIGNS.filter(function (x) { return x.id === p[1]; })[0];
      return '<a class="cat reveal" href="collection.html?cat=' + p[0] + '"><img src="assets/img/' + d.id + '.webp" alt="' + esc(d.catZh) + '" loading="lazy"><span>' + esc(d.catZh) + '<small>' + esc(d.catEn) + '</small></span></a>';
    }).join('');
  }

  // ---------- 上新通知表单 ----------
  var form = document.getElementById('notify-form');
  if (form) {
    var msg = document.getElementById('form-msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.email.value.trim();
      msg.className = 'form-msg';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msg.className = 'form-msg err';
        msg.textContent = '请填写有效的邮箱地址。';
        form.email.focus();
        return;
      }
      var interests = Array.prototype.map.call(form.querySelectorAll('input[name=interest]:checked'), function (i) { return i.value; });
      var data = { type: 'signup', email: email, interests: interests.join('、'), wishlist: getWish().join(',') };
      var btn = form.querySelector('button');
      btn.disabled = true;
      msg.textContent = '正在提交…';
      if (!CONFIG.formEndpoint) {
        setTimeout(function () {
          btn.disabled = false;
          form.reset();
          msg.className = 'form-msg ok';
          msg.textContent = '谢谢！（目前是演示模式，资料还没有真的发送。）';
        }, 600);
        return;
      }
      send(data).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).then(function (res) {
        if (!res || !res.ok) throw new Error('save');
        form.reset();
        msg.className = 'form-msg ok';
        msg.textContent = '谢谢！第一批作品上架时，我们会发邮件告诉你。';
      }).catch(function () {
        msg.className = 'form-msg err';
        msg.textContent = '提交没有成功，请稍后再试。';
      }).then(function () { btn.disabled = false; });
    });
  }

  // ---------- 进场动画 ----------
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function observe() {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  }
  observe();
})();
