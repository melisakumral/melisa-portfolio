/* =========================================================
   Melisa — Portföy — script.js
   Loader, dil geçişi, navbar/mobil menü, scroll-spy, fade-in,
   sayaç, proje modalı, Formspree gönderimi.
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initLanguage();
  initNavbar();
  initMobileMenu();
  initScrollSpy();
  initFadeIn();
  initCounters();
  initProjectModal();
  initAboutTabs();
  initBlogFeed();
  initFeaturedGallery();
});

/* ---------- About section tabs (Bio / Experience / Certifications) ---------- */
function initAboutTabs() {
  const btns = document.querySelectorAll('.about-tab-btn');
  const panels = document.querySelectorAll('.about-tab-panel');
  if (!btns.length || !panels.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');

      btns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });

      panels.forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-panel') === target);
      });
    });
  });
}

/* ---------- Medium blog feed (auto-updates when a new post is published) ---------- */
const MEDIUM_USERNAME = 'melisakumral';
let cachedBlogPosts = null; // null = not loaded yet, [] = loaded but empty

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function initBlogFeed() {
  const grid = document.getElementById('blogGrid');
  if (!grid) return;

  const rssUrl = `https://medium.com/feed/@${MEDIUM_USERNAME}`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=3`;

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      cachedBlogPosts = (data.status === 'ok' && Array.isArray(data.items)) ? data.items.slice(0, 3) : [];
      const lang = document.documentElement.getAttribute('lang') || 'tr';
      renderBlogPosts(lang);
      renderFeatured(lang);
    })
    .catch(() => {
      cachedBlogPosts = [];
      const lang = document.documentElement.getAttribute('lang') || 'tr';
      renderBlogPosts(lang);
      renderFeatured(lang);
    });
}

function renderBlogPosts(lang) {
  const grid = document.getElementById('blogGrid');
  if (!grid || cachedBlogPosts === null) return;

  if (!cachedBlogPosts.length) {
    const msg = lang === 'tr'
      ? 'Henüz yayınlanmış bir yazı yok — yeni bir yazı paylaştığımda burada otomatik olarak görünecek. Bu arada Medium sayfamı takip edebilirsin.'
      : "No posts published yet — new articles will show up here automatically. Feel free to follow my Medium page in the meantime.";
    grid.innerHTML = `<div class="blog-empty">${escapeHtml(msg)}</div>`;
    return;
  }

  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  const readLabel = lang === 'tr' ? "Medium'da oku ↗" : 'Read on Medium ↗';

  grid.innerHTML = cachedBlogPosts.map(post => {
    const tag = (post.categories && post.categories[0]) || 'Medium';
    const rawExcerpt = stripHtml(post.description || '').trim();
    const excerpt = rawExcerpt.length > 130 ? rawExcerpt.slice(0, 130).trim() + '…' : rawExcerpt;
    let dateStr = '';
    try {
      dateStr = new Date(post.pubDate).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { /* ignore */ }

    return `
      <a href="${post.link}" target="_blank" rel="noopener" class="blog-card">
        <span class="blog-tag">${escapeHtml(tag)}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(excerpt)}</p>
        <span class="blog-read">${dateStr ? escapeHtml(dateStr) + ' · ' : ''}${readLabel}</span>
      </a>`;
  }).join('');
}

/* ---------- Featured (projects + Medium posts, newest first, horizontal gallery) ----------
   ✏️ Yeni bir projeni öne çıkarmak istediğinde bu listeye bir obje ekle (en üste veya araya,
   sıralama otomatik tarihe göre yapılır). Ekran görüntüsünü index.html ile aynı klasöre koyup
   "image" alanına dosya adını yaz (örn. 'sentinel.png'). Görsel yoksa placeholder gösterilir.
   Bu dosyayı GitHub'da düzenleyip kaydettiğinde Vercel otomatik olarak siteyi günceller. */
const FEATURED_PROJECTS = [
  {
    title: { tr: 'Sentinel', en: 'Sentinel' },
    desc: {
      tr: "Stellar ağı üzerinde çalışan, merkeziyetsiz (non-custodial) bir kitle fonlama platformu. Fonlar ve anahtarlar hiçbir zaman Sentinel'de tutulmaz — her işlem kullanıcının kendi cüzdanında imzalanır ve zincir üzerinde doğrulanır.",
      en: "A non-custodial crowdfunding platform built on the Stellar network. Sentinel never holds funds or keys — every transaction is signed in the user's own wallet and verified on-chain."
    },
    tag: { tr: 'Web3 / Blockchain', en: 'Web3 / Blockchain' },
    date: '2026-07-21',
    link: 'https://frontend-liart-eight-29.vercel.app/',
    browserUrl: 'frontend-liart-eight-29.vercel.app',
    image: null
  }
];

function renderFeatured(lang) {
  const gallery = document.getElementById('featuredGallery');
  if (!gallery) return;

  const posts = (cachedBlogPosts || []).map(post => ({
    type: 'post',
    title: post.title,
    desc: stripHtml(post.description || '').trim(),
    tag: (post.categories && post.categories[0]) || 'Medium',
    date: post.pubDate,
    link: post.link,
    image: post.thumbnail || null
  }));

  const projects = FEATURED_PROJECTS.map(p => ({
    type: 'project',
    title: p.title[lang] || p.title.tr,
    desc: p.desc[lang] || p.desc.tr,
    tag: p.tag[lang] || p.tag.tr,
    date: p.date,
    link: p.link,
    image: p.image,
    browserUrl: p.browserUrl
  }));

  const items = [...projects, ...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!items.length) {
    const msg = translations['featured.empty'][lang] || translations['featured.empty'].tr;
    gallery.innerHTML = `<div class="featured-empty">${escapeHtml(msg)}</div>`;
    renderFeaturedDots(0);
    updateFeaturedNav();
    return;
  }

  const viewLiveLabel = translations['featured.viewLive'][lang] || translations['featured.viewLive'].tr;
  const readPostLabel = translations['blog.read'][lang] || translations['blog.read'].tr;
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return ''; }
  };

  gallery.innerHTML = items.map(item => {
    const excerpt = item.desc.length > 140 ? item.desc.slice(0, 140).trim() + '…' : item.desc;
    const dateStr = formatDate(item.date);
    const meta = `<div class="featured-card-meta"><span class="featured-card-tag">${escapeHtml(item.tag)}</span>${dateStr ? `<span class="featured-card-date">${escapeHtml(dateStr)}</span>` : ''}</div>`;

    if (item.type === 'project') {
      const visual = item.image
        ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">`
        : `<div class="featured-mockup-placeholder">🛡</div>`;
      return `
        <a href="${item.link}" target="_blank" rel="noopener" class="featured-card">
          <div class="featured-mockup">
            <div class="featured-mockup-bar">
              <span class="featured-mockup-dot red"></span>
              <span class="featured-mockup-dot yellow"></span>
              <span class="featured-mockup-dot green"></span>
              <span class="featured-mockup-url">${escapeHtml(item.browserUrl || item.link)}</span>
            </div>
            <div class="featured-mockup-img">${visual}</div>
          </div>
          <div class="featured-card-body">
            ${meta}
            <h3 class="featured-card-title">${escapeHtml(item.title)}</h3>
            <p class="featured-card-desc">${escapeHtml(excerpt)}</p>
            <span class="featured-card-link">${viewLiveLabel}</span>
          </div>
        </a>`;
    }

    return `
      <a href="${item.link}" target="_blank" rel="noopener" class="featured-card featured-card-post">
        <div class="featured-post-visual">
          ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">` : `<span class="featured-post-icon">✎</span>`}
        </div>
        <div class="featured-card-body">
          ${meta}
          <h3 class="featured-card-title">${escapeHtml(item.title)}</h3>
          <p class="featured-card-desc">${escapeHtml(excerpt)}</p>
          <span class="featured-card-link">${readPostLabel}</span>
        </div>
      </a>`;
  }).join('');

  renderFeaturedDots(items.length);
  updateFeaturedNav();
}

function renderFeaturedDots(count) {
  const dotsWrap = document.getElementById('featuredDots');
  if (!dotsWrap) return;
  if (count <= 1) { dotsWrap.innerHTML = ''; return; }

  dotsWrap.innerHTML = Array.from({ length: count }, (_, i) =>
    `<button class="featured-dot${i === 0 ? ' active' : ''}" type="button" data-index="${i}" aria-label="${i + 1}"></button>`
  ).join('');

  dotsWrap.querySelectorAll('.featured-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const gallery = document.getElementById('featuredGallery');
      const card = gallery && gallery.querySelectorAll('.featured-card')[Number(dot.getAttribute('data-index'))];
      if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
  });
}

function updateFeaturedNav() {
  const gallery = document.getElementById('featuredGallery');
  const prevBtn = document.getElementById('featuredPrev');
  const nextBtn = document.getElementById('featuredNext');
  if (!gallery || !prevBtn || !nextBtn) return;

  const maxScroll = gallery.scrollWidth - gallery.clientWidth - 2;
  prevBtn.disabled = gallery.scrollLeft <= 2;
  nextBtn.disabled = maxScroll <= 0 || gallery.scrollLeft >= maxScroll;

  const dots = document.querySelectorAll('.featured-dot');
  if (!dots.length) return;
  const cards = gallery.querySelectorAll('.featured-card');
  let closestIdx = 0;
  let closestDist = Infinity;
  cards.forEach((card, i) => {
    const dist = Math.abs(card.offsetLeft - gallery.scrollLeft);
    if (dist < closestDist) { closestDist = dist; closestIdx = i; }
  });
  dots.forEach((dot, i) => dot.classList.toggle('active', i === closestIdx));
}

function initFeaturedGallery() {
  const gallery = document.getElementById('featuredGallery');
  const prevBtn = document.getElementById('featuredPrev');
  const nextBtn = document.getElementById('featuredNext');
  if (!gallery || !prevBtn || !nextBtn) return;

  const scrollByCard = (dir) => {
    const card = gallery.querySelector('.featured-card');
    const amount = card ? card.getBoundingClientRect().width + 26 : 320;
    gallery.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  prevBtn.addEventListener('click', () => scrollByCard(-1));
  nextBtn.addEventListener('click', () => scrollByCard(1));
  gallery.addEventListener('scroll', () => updateFeaturedNav());
  window.addEventListener('resize', () => updateFeaturedNav());

  const lang = document.documentElement.getAttribute('lang') || 'tr';
  renderFeatured(lang);
}

/* ---------- Navbar scroll style ---------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* ---------- Mobile menu toggle ---------- */
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

/* ---------- Loading screen ---------- */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const hide = () => loader.classList.add('hidden');
  if (document.readyState === 'complete') {
    setTimeout(hide, 400);
  } else {
    window.addEventListener('load', () => setTimeout(hide, 400));
  }
  // Safety fallback in case load event is delayed
  setTimeout(hide, 2500);
}

/* ---------- Language toggle (TR/EN, persisted) ---------- */
const translations = {
  'sidebar.role': { tr: 'Siber Güvenlik<br>Uzmanı &amp; Full<br>Stack Geliştirici', en: 'Cybersecurity<br>Specialist &amp;<br>Full Stack Dev' },
  'sidebar.vertical': { tr: 'MELİSA — PORTFOLYO', en: 'MELISA — PORTFOLIO' },
  'dock.home': { tr: 'Ana Sayfa', en: 'Home' },
  'dock.about': { tr: 'Hakkımda', en: 'About' },
  'dock.featured': { tr: 'Öne Çıkanlar', en: 'Featured' },
  'featured.label': { tr: 'Vitrin', en: 'Showcase' },
  'featured.title': { tr: 'Öne Çıkanlar', en: 'Featured' },
  'featured.sub': { tr: 'En yeni projelerim ve yazılarım — yeni bir şey paylaştığımda burada otomatik görünür.', en: 'My newest projects and articles — new work appears here automatically.' },
  'featured.empty': { tr: 'Henüz öne çıkan içerik yok.', en: 'No featured content yet.' },
  'featured.viewLive': { tr: 'Canlı Görüntüle ↗', en: 'View Live ↗' },
  'dock.services': { tr: 'Hizmetler', en: 'Services' },
  'dock.projects': { tr: 'Projeler', en: 'Projects' },
  'dock.blog': { tr: 'Yazılar', en: 'Blog' },
  'dock.contact': { tr: 'İletişim', en: 'Contact' },
  'hero.eyebrow': { tr: 'Siber Güvenlik Uzmanı & Full Stack Geliştirici', en: 'Cybersecurity Specialist & Full Stack Developer' },
  'hero.title1': { tr: 'Merhaba, ben', en: "Hi, I'm" },
  'hero.name': { tr: 'Melisa', en: 'Melisa' },
  'hero.desc': { tr: 'Güvenlik açıklarını bulup kapatmayı, sağlam ve ölçeklenebilir yazılımlar geliştirmeyi seviyorum. Tersine mühendislikten web güvenliğine, uçtan uca geliştirme süreçlerine kadar geniş bir yelpazede çalışıyorum.', en: 'I love finding and fixing security vulnerabilities, and building robust, scalable software. I work across a wide range — from reverse engineering to web security to end-to-end development.' },
  'hero.cta.projects': { tr: 'Projelerimi Gör', en: 'View My Projects' },
  'hero.cta.contact': { tr: 'İletişime Geç', en: 'Get In Touch' },
  'hero.cta.cv': { tr: '⬇ CV İndir', en: '⬇ Download CV' },
  'hero.note.reverse': { tr: 'Reverse Engineering', en: 'Reverse Engineering' },
  'hero.note.web': { tr: 'Web Security', en: 'Web Security' },
  'hero.note.stack': { tr: 'Full Stack', en: 'Full Stack' },
  'hero.note.quote': { tr: '"Güvenlik açıklarını bulmak, kapatmaktan daha zevkli."', en: '"Finding a vulnerability is more fun than fixing it."' },
  'hero.scroll': { tr: 'Aşağı kaydır', en: 'Scroll down' },
  'about.label': { tr: 'Kimim', en: 'Who I Am' },
  'about.title': { tr: 'Hakkımda', en: 'About Me' },
  'about.text1': { tr: "Kariyerimde sürekli olarak yeni fırsatlar keşfetmeye ve teknolojik yetkinliklerimi derinleştirmeye odaklanmış biriyim. Yeni şeyler öğrenme tutkum, beni farklı platformlarda çeşitli eğitim programlarına yönlendiriyor. Edindiğim bilgileri yalnızca teoride bırakmıyor; bunları pratiğe dökerek uçtan uca, aktif yazılım projeleri üretiyorum. Gerek hackathon'larda geliştirdiğimiz yenilikçi çözümler gerekse takım olarak hayata geçirdiğimiz uygulamaların tüm geliştirme döngülerinde (Front-end ve Back-end) sorumluluk alarak fikirleri somut ürünlere dönüştürüyorum.", en: "I'm someone who is constantly focused on discovering new opportunities and deepening my technological skills. My passion for learning new things leads me to various training programs across different platforms. I don't leave what I learn in theory; I put it into practice, building active, end-to-end software projects. Whether it's the innovative solutions we've built at hackathons or the applications we've shipped as a team, I take responsibility across the full development cycle (front-end and back-end) and turn ideas into concrete products." },
  'about.text2': { tr: "Şu anda Siber Vatan programı kapsamında siber güvenlik alanında aktif eğitimler alıp projeler yürütüyor ve bu ekosistemde kendimi sürekli geliştiriyorum. Aynı zamanda bir dijital kariyer platformu olan PythianGo'da Kampüs Elçisi olarak görev alıyor, kariyer odaklı ağımı genişletiyorum.", en: "I'm currently taking active training and running projects in cybersecurity through the Siber Vatan program, continuously growing within that ecosystem. I also serve as a Campus Ambassador at PythianGo, a digital career platform, expanding my career-focused network." },
  'about.text3': { tr: "Tüm bu teknik ve profesyonel üretim süreçlerinin yanı sıra, matematik özel dersleri vererek eğitim alanındaki tutkumu da sürdürüyorum. Öğretim süreci, bilgi aktarmanın ötesinde iletişim ve öğretme yeteneklerimi sürekli taze tuttuğum değerli bir deneyim alanı. Hem teknoloji ekosisteminde yeni projeler üretmeye hem de kariyerimde sağlam adımlarla ilerleyerek en iyisini yapmaya devam ediyorum.", en: "Alongside all this technical and professional work, I keep my passion for education alive by giving private math lessons. Teaching is a valuable experience that goes beyond transferring knowledge — it keeps my communication and teaching skills sharp. I keep building new projects in the tech ecosystem while moving forward steadily in my career." },
  'tabs.bio': { tr: 'Hakkımda', en: 'About' },
  'tabs.experience': { tr: 'Deneyim & Eğitim', en: 'Experience & Education' },
  'tabs.certs': { tr: 'Sertifikalar', en: 'Certifications' },
  'about.list1': { tr: 'Bilgisayar Mühendisliği, 3. Sınıf — Bülent Ecevit Üniversitesi', en: 'Computer Engineering, 3rd Year — Bülent Ecevit University' },
  'about.list2': { tr: 'Full-Stack Engineer @ Blue Network', en: 'Full-Stack Engineer @ Blue Network' },
  'about.list3': { tr: 'Başkan @ Karaelmas Yazılım Topluluğu', en: 'President @ Karaelmas Software Community' },
  'about.list4': { tr: 'Odak: Ağ Teknolojileri, Sistem Yönetimi, Siber Güvenlik, Full-Stack Geliştirme', en: 'Focus: Network Technologies, System Administration, Cybersecurity, Full-Stack Development' },
  'about.stat1': { tr: 'Yıl Deneyim', en: 'Years Experience' },
  'about.stat2': { tr: 'Tamamlanan Proje', en: 'Projects Completed' },
  'about.stat3': { tr: 'Sertifika & Eğitim', en: 'Certifications & Trainings' },
  'skills.label': { tr: 'Araç Kutusu', en: 'Toolbox' },
  'skills.title': { tr: 'Yetkinlikler', en: 'Skills' },
  'skills.sub': { tr: 'Günlük olarak kullandığım diller, çerçeveler ve güvenlik araçları.', en: 'Languages, frameworks and security tools I use daily.' },
  'timeline.label': { tr: 'Yolculuk', en: 'Journey' },
  'timeline.title': { tr: 'Deneyim & Eğitim', en: 'Experience & Education' },
  'timeline.tag.edu': { tr: 'Eğitim', en: 'Education' },
  'timeline.edu.title': { tr: 'Bilgisayar Mühendisliği', en: 'Computer Engineering' },
  'timeline.edu.org': { tr: 'Bülent Ecevit Üniversitesi', en: 'Bülent Ecevit University' },
  'timeline.edu.date': { tr: '2023 – Günümüz', en: '2023 – Present' },
  'timeline.tag.work': { tr: 'Deneyim', en: 'Experience' },
  'timeline.work.title': { tr: 'Full-Stack Engineer', en: 'Full-Stack Engineer' },
  'timeline.work.org': { tr: 'Blue Network', en: 'Blue Network' },
  'timeline.work.date': { tr: 'Kasım 2025 – Günümüz', en: 'Nov 2025 – Present' },
  'timeline.altay.title': { tr: 'Ekip Üyesi', en: 'Team Member' },
  'timeline.altay.org': { tr: 'Altay (Siber Vatan)', en: 'Altay (Siber Vatan)' },
  'timeline.altay.date': { tr: 'Mart 2026 – Günümüz', en: 'Mar 2026 – Present' },
  'timeline.zayotem.title': { tr: 'Ekip Üyesi', en: 'Team Member' },
  'timeline.zayotem.org': { tr: 'ZAYOTEM (Siber Vatan)', en: 'ZAYOTEM (Siber Vatan)' },
  'timeline.zayotem.date': { tr: 'Kasım 2025 – Şubat 2026', en: 'Nov 2025 – Feb 2026' },
  'timeline.math.title': { tr: 'Matematik Özel Ders Eğitmeni', en: 'Private Math Tutor' },
  'timeline.math.org': { tr: 'Bağımsız', en: 'Independent' },
  'timeline.math.date': { tr: 'Kasım 2022 – Günümüz', en: 'Nov 2022 – Present' },
  'timeline.tag.lead': { tr: 'Liderlik', en: 'Leadership' },
  'timeline.lead.title': { tr: 'Başkan', en: 'President' },
  'timeline.lead.org': { tr: 'Karaelmas Yazılım Topluluğu', en: 'Karaelmas Software Community' },
  'timeline.lead.date': { tr: 'Nisan 2026 – Günümüz', en: 'Apr 2026 – Present' },
  'timeline.hackviser.title': { tr: 'Kampüs Temsilcisi', en: 'Campus Ambassador' },
  'timeline.hackviser.org': { tr: 'Hackviser', en: 'Hackviser' },
  'timeline.hackviser.date': { tr: 'Haziran 2026 – Günümüz', en: 'Jun 2026 – Present' },
  'timeline.sisterslab.title': { tr: 'Eğitmen', en: 'Instructor' },
  'timeline.sisterslab.org': { tr: 'SisterLabs', en: 'SisterLabs' },
  'timeline.sisterslab.date': { tr: 'Haziran 2026 – Günümüz', en: 'Jun 2026 – Present' },
  'certs.label': { tr: 'Belgeler', en: 'Credentials' },
  'certs.title': { tr: 'Sertifikalar', en: 'Certifications' },
  'certs.sub': { tr: 'Güvenlik, ağ ve veri bilimi alanında aldığım öne çıkan sertifikalardan bazıları.', en: 'Some of the notable certifications I have earned in security, networking, and data science.' },
  'certs.c1.title': { tr: 'Certified Associate Penetration Tester (CAPT)', en: 'Certified Associate Penetration Tester (CAPT)' },
  'certs.c2.title': { tr: 'Zararlı Yazılım Analizi', en: 'Malware Analysis' },
  'certs.c3.title': { tr: 'Türkiye Siber Vatan Programı Mezuniyeti', en: 'Turkey Siber Vatan Program Graduate' },
  'certs.c4.title': { tr: 'Network Technician Career Path', en: 'Network Technician Career Path' },
  'certs.c5.title': { tr: 'Introduction to Cybersecurity', en: 'Introduction to Cybersecurity' },
  'certs.c6.title': { tr: 'Python Programming for Data Science & Feature Engineering', en: 'Python Programming for Data Science & Feature Engineering' },
  'services.label': { tr: 'Ne Yapıyorum', en: 'What I Do' },
  'services.title': { tr: 'Hizmetler & Yetkinlikler', en: 'Services & Expertise' },
  'services.sub': { tr: 'Güvenlik odaklı yazılım geliştirme sürecinin her aşamasında yer alıyorum.', en: 'I take part in every stage of security-focused software development.' },
  'services.c1.title': { tr: 'Zararlı Yazılım Analizi', en: 'Malware Analysis' },
  'services.c1.desc': { tr: 'IDA Pro ile statik/dinamik analiz ve tersine mühendislik. Zararlı yazılım davranışlarının izole ortamlarda incelenmesi ve raporlanması.', en: 'Static/dynamic analysis and reverse engineering with IDA Pro. Examining and reporting malware behavior in isolated environments.' },
  'services.c2.title': { tr: 'Web Güvenliği & Pentest', en: 'Web Security & Pentesting' },
  'services.c2.desc': { tr: 'Zafiyet taramaları, exploit geliştirme ve sızma testleri. OWASP standartlarına uygun kapsamlı güvenlik denetimleri.', en: 'Vulnerability scanning, exploit development and penetration testing. Comprehensive security audits aligned with OWASP standards.' },
  'services.c3.title': { tr: 'Full-Stack Entegrasyon', en: 'Full-Stack Integration' },
  'services.c3.desc': { tr: 'Python, PHP, C, SQL ile güvenli mimari tasarımı. Uçtan uca güvenli, ölçeklenebilir yazılım sistemleri geliştirme.', en: 'Secure architecture design with Python, PHP, C, SQL. Building end-to-end secure, scalable software systems.' },
  'services.c4.title': { tr: 'Web Sitesi Geliştirme', en: 'Website Development' },
  'services.c4.desc': { tr: 'Kurumsal siteden portföy sayfasına, modern ve güvenlik odaklı web siteleri tasarlayıp geliştiriyorum. Duyarlı tasarım, hızlı performans ve temiz kod önceliğim.', en: 'From corporate sites to portfolio pages, I design and build modern, security-conscious websites — responsive, fast, and cleanly coded.' },
  'projects.label': { tr: 'Seçilmiş Çalışmalar', en: 'Selected Work' },
  'projects.title': { tr: 'Projeler', en: 'Projects' },
  'projects.sub': { tr: 'Üzerinde çalıştığım öne çıkan projelerden bazıları. Detaylar için karta tıkla.', en: 'Some of the notable projects I have worked on. Click a card for details.' },
  'projects.p1.status': { tr: 'Yayında', en: 'Live' },
  'projects.p1.title': { tr: 'Joins — Etkileşimli Quiz & Yarışma Platformu', en: 'Joins — Interactive Quiz & Competition Platform' },
  'projects.p1.desc': { tr: "Gerçek zamanlı soru-cevap ve yarışma deneyimi sunan yerli Kahoot alternatifi. Google Play ve App Store'da yayında.", en: 'A homegrown Kahoot alternative offering real-time Q&A and competition experiences. Published on Google Play and the App Store.' },
  'projects.p2.status': { tr: 'Hackathon Projesi', en: 'Hackathon Project' },
  'projects.p2.title': { tr: 'NebulaGate — Akıllı Güvenlik Ağ Geçidi', en: 'NebulaGate — Smart Security Gateway' },
  'projects.p2.desc': { tr: 'Yapay zekâ destekli risk puanlaması ve mikro ödeme mekanizmalarıyla bot trafiğini filtreleyen güvenlik ağ geçidi.', en: 'A security gateway that filters bot traffic using AI-powered risk scoring and micropayment mechanisms.' },
  'projects.p3.status': { tr: 'Güvenlik Mimarisi', en: 'Security Architecture' },
  'projects.p3.title': { tr: 'CyberShield — Savunma & Saldırı Mimarisi', en: 'CyberShield — Defense & Attack Architecture' },
  'projects.p3.desc': { tr: 'Güvenlik açıklarının tespit edilmesi, simüle edilmesi ve güvenli yazılım geliştirme prensipleriyle giderilmesini hedefleyen mimari.', en: 'A security architecture aimed at detecting, simulating, and remediating vulnerabilities following secure development principles.' },
  'projects.p4.status': { tr: 'Kriptografi', en: 'Cryptography' },
  'projects.p4.title': { tr: 'AES Şifreleme Uygulaması', en: 'AES Encryption Application' },
  'projects.p4.desc': { tr: 'AES-128 algoritmasının temel bileşenlerinin Python ile sıfırdan uygulandığı kriptografi projesi.', en: 'A cryptography project implementing the core components of the AES-128 algorithm from scratch in Python.' },
  'projects.p5.status': { tr: 'NLP Projesi', en: 'NLP Project' },
  'projects.p5.title': { tr: 'Türkçe Duygu Analizi', en: 'Turkish Sentiment Analysis' },
  'projects.p5.desc': { tr: 'Sosyal medya verileri üzerinde DistilBERT modeliyle pozitif, negatif ve nötr duygu sınıflandırması.', en: 'Positive, negative, and neutral sentiment classification on social media data using the DistilBERT model.' },
  'projects.p6.status': { tr: 'Full-Stack Web', en: 'Full-Stack Web' },
  'projects.p6.title': { tr: 'Çok Kullanıcılı Satış Platformu', en: 'Multi-User Sales Platform' },
  'projects.p6.desc': { tr: 'Rol yönetimi ve PDF üretim özelliklerine sahip, PHP ve SQLite ile geliştirilen full-stack web uygulaması.', en: 'A full-stack web application built with PHP and SQLite, featuring role management and PDF generation.' },
  'projects.cta': { tr: 'Detayları Gör →', en: 'View Details →' },
  'projects.more': { tr: "GitHub'da Tüm Projelerim →", en: 'All My Projects on GitHub →' },
  'projects.modalGithub': { tr: "GitHub'da Gör ↗", en: 'View on GitHub ↗' },
  'blog.label': { tr: 'Yazılar', en: 'Writing' },
  'blog.title': { tr: 'Blog', en: 'Blog' },
  'blog.sub': { tr: 'Teknik notlarımı ve analizlerimi Medium üzerinde paylaşıyorum.', en: 'I share my technical notes and analyses on Medium.' },
  'blog.loading': { tr: 'Yazılar yükleniyor...', en: 'Loading posts...' },
  'blog.read': { tr: "Medium'da oku ↗", en: 'Read on Medium ↗' },
  'blog.more': { tr: "Medium'da Tüm Yazılarım →", en: 'All My Posts on Medium →' },
  'contact.label': { tr: 'Birlikte Çalışalım', en: "Let's Work Together" },
  'contact.title': { tr: 'İletişime Geçin', en: 'Get In Touch' },
  'contact.sub': { tr: 'Bir proje, iş birliği veya sorunuz mu var? Aşağıdan mesaj bırakabilirsiniz.', en: 'Have a project, collaboration idea, or question? Leave a message below.' },
  'contact.info.title': { tr: 'İletişim Bilgileri', en: 'Contact Information' },
  'contact.info.desc': { tr: 'Projeleriniz, iş birliği teklifleriniz veya sorularınız için doğrudan ulaşabilir ya da yandaki formu doldurabilirsiniz.', en: 'Reach out directly for projects, collaboration offers, or questions — or fill out the form.' },
  'contact.info.email': { tr: 'E-posta', en: 'Email' },
  'contact.info.location': { tr: 'Konum', en: 'Location' },
  'contact.info.social': { tr: 'Sosyal', en: 'Social' },
  'contact.form.name': { tr: 'Adınız', en: 'Your Name' },
  'contact.form.namePh': { tr: 'Adınız Soyadınız', en: 'Your full name' },
  'contact.form.email': { tr: 'E-posta', en: 'Email' },
  'contact.form.message': { tr: 'Mesajınız', en: 'Your Message' },
  'contact.form.messagePh': { tr: 'Mesajınızı buraya yazın...', en: 'Write your message here...' },
  'contact.form.submit': { tr: 'Mesajı Gönder', en: 'Send Message' },
  'footer.rights': { tr: '© 2026 Melisa. Tüm hakları saklıdır.', en: '© 2026 Melisa. All rights reserved.' }
};

function setTranslatedText(el, text) {
  const underline = el.querySelector(':scope > .title-underline');
  if (underline) {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.nodeValue = text + ' ';
        return;
      }
    }
    el.insertBefore(document.createTextNode(text + ' '), el.firstChild);
  } else if (el.children.length === 0) {
    el.textContent = text;
  } else {
    // Element has child markup we shouldn't destroy (e.g. <br>); use innerHTML for known-safe keys
    el.innerHTML = text;
  }
}

function applyLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const entry = translations[key];
    if (!entry) return;
    setTranslatedText(el, entry[lang] || entry.tr);
  });

  document.querySelectorAll('[data-i18n-tip]').forEach(el => {
    const key = el.getAttribute('data-i18n-tip');
    const entry = translations[key];
    if (!entry) return;
    el.setAttribute('data-tip', entry[lang] || entry.tr);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const entry = translations[key];
    if (!entry) return;
    el.setAttribute('placeholder', entry[lang] || entry.tr);
  });

  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    const codeEl = langBtn.querySelector('.lang-code');
    if (codeEl) codeEl.textContent = lang === 'tr' ? 'EN' : 'TR';
  }

  if (cachedBlogPosts !== null) renderBlogPosts(lang);
  renderFeatured(lang);
}

function initLanguage() {
  const toggle = document.getElementById('langToggle');
  const stored = localStorage.getItem('melisa-lang') || 'tr';
  applyLanguage(stored);

  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('lang') || 'tr';
    const next = current === 'tr' ? 'en' : 'tr';
    localStorage.setItem('melisa-lang', next);
    applyLanguage(next);
  });
}

/* ---------- Scroll spy (active nav link highlight) ---------- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  sections.forEach(sec => observer.observe(sec));
}

/* ---------- Scroll-triggered fade-in (with staggered children) ---------- */
function initFadeIn() {
  const items = document.querySelectorAll('.fade-in');
  if (!items.length) return;

  document.querySelectorAll('.cards-grid, .projects-grid, .skills-grid, .blog-grid').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 0.1}s`;
    });
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(item => observer.observe(item));
}

/* ---------- Animated stat counters ---------- */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 900;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(progress * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ---------- Project detail modal ---------- */
const projectData = {
  joins: {
    logoClass: 'project-logo-1',
    logoText: 'J',
    statusClass: 'status-live',
    status: { tr: 'Yayında', en: 'Live' },
    title: { tr: 'Joins — Etkileşimli Quiz & Yarışma Platformu', en: 'Joins — Interactive Quiz & Competition Platform' },
    desc: {
      tr: "Eğitimlerde, etkinliklerde ve sınıf içi aktivitelerde kullanılabilen, gerçek zamanlı soru-cevap ve yarışma deneyimi sunan yerli Kahoot alternatifi. Katılımcılar ortak bir kod ile odaya bağlanarak canlı puanlama ve sıralama üzerinden rekabet ediyor. Google Play ve App Store üzerinde yayında; projede tam yığın (full-stack) geliştirme sürecinde yer aldım.",
      en: "A homegrown Kahoot alternative offering real-time Q&A and competition experiences for trainings, events, and in-class activities. Participants join a room with a shared code and compete via live scoring and rankings. Published on Google Play and the App Store — I contributed across the full stack."
    },
    tags: ['Mobile', 'Full Stack', 'Team Work', 'App Store']
  },
  nebulagate: {
    logoClass: 'project-logo-2',
    logoText: 'N',
    statusClass: 'status-proto',
    status: { tr: 'Hackathon Projesi', en: 'Hackathon Project' },
    title: { tr: 'NebulaGate — Akıllı Güvenlik Ağ Geçidi', en: 'NebulaGate — Smart Security Gateway' },
    desc: {
      tr: "Yapay zekâ destekli risk puanlaması ve mikro ödeme mekanizmaları kullanarak bot trafiğini filtreleyen bir güvenlik ağ geçidi. TypeScript, Soroban akıllı kontratları ve x402 protokolü kullanılarak geliştirildi.",
      en: "A security gateway that filters bot traffic using AI-powered risk scoring and micropayment mechanisms. Built with TypeScript, Soroban smart contracts, and the x402 protocol."
    },
    tags: ['TypeScript', 'Soroban', 'x402', 'AI']
  },
  cybershield: {
    logoClass: 'project-logo-3',
    logoText: '🛡',
    statusClass: 'status-report',
    status: { tr: 'Güvenlik Mimarisi', en: 'Security Architecture' },
    title: { tr: 'CyberShield — Savunma & Saldırı Mimarisi', en: 'CyberShield — Defense & Attack Architecture' },
    desc: {
      tr: "Güvenlik açıklarının tespit edilmesini, simüle edilmesini ve güvenli yazılım geliştirme prensipleriyle giderilmesini hedefleyen bir güvenlik mimarisi çalışması.",
      en: "A security architecture project aimed at detecting and simulating vulnerabilities, then remediating them following secure software development principles."
    },
    tags: ['Security', 'Vulnerability', 'Architecture']
  },
  aes: {
    logoClass: 'project-logo-4',
    logoText: '🔐',
    statusClass: 'status-proto',
    status: { tr: 'Kriptografi', en: 'Cryptography' },
    title: { tr: 'AES Şifreleme Uygulaması', en: 'AES Encryption Application' },
    desc: {
      tr: "AES-128 algoritmasının temel bileşenlerini (SubBytes, ShiftRows, MixColumns, key schedule) Python ile sıfırdan uygulayarak geliştirdiğim bir kriptografi projesi.",
      en: "A cryptography project where I implemented the core components of the AES-128 algorithm (SubBytes, ShiftRows, MixColumns, key schedule) from scratch in Python."
    },
    tags: ['Python', 'AES-128', 'Cryptography']
  },
  sentiment: {
    logoClass: 'project-logo-5',
    logoText: 'NLP',
    statusClass: 'status-proto',
    status: { tr: 'NLP Projesi', en: 'NLP Project' },
    title: { tr: 'Türkçe Duygu Analizi', en: 'Turkish Sentiment Analysis' },
    desc: {
      tr: "Sosyal medya verileri kullanılarak DistilBERT modeliyle pozitif, negatif ve nötr duygu sınıflandırması gerçekleştirilen bir doğal dil işleme (NLP) projesi.",
      en: "An NLP project performing positive, negative, and neutral sentiment classification on social media data using the DistilBERT model."
    },
    tags: ['NLP', 'DistilBERT', 'Python']
  },
  salesplatform: {
    logoClass: 'project-logo-6',
    logoText: 'S',
    statusClass: 'status-proto',
    status: { tr: 'Full-Stack Web', en: 'Full-Stack Web' },
    title: { tr: 'Çok Kullanıcılı Satış Platformu', en: 'Multi-User Sales Platform' },
    desc: {
      tr: "PHP ve SQLite kullanılarak geliştirilen, rol yönetimi ve PDF üretim özelliklerine sahip full-stack bir web uygulaması.",
      en: "A full-stack web application built with PHP and SQLite, featuring role management and PDF generation capabilities."
    },
    tags: ['PHP', 'SQLite', 'Full Stack']
  }
};

function initProjectModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  const cards = document.querySelectorAll('.project-card[data-project]');
  if (!overlay || !cards.length) return;

  const logoEl = document.getElementById('modalLogo');
  const statusEl = document.getElementById('modalStatus');
  const titleEl = document.getElementById('modalTitle');
  const descEl = document.getElementById('modalDesc');
  const tagsEl = document.getElementById('modalTags');

  function open(id) {
    const data = projectData[id];
    if (!data) return;
    const lang = document.documentElement.getAttribute('lang') || 'tr';

    logoEl.className = 'modal-logo ' + data.logoClass;
    logoEl.textContent = data.logoText;
    statusEl.className = 'modal-status ' + data.statusClass;
    statusEl.textContent = data.status[lang] || data.status.tr;
    titleEl.textContent = data.title[lang] || data.title.tr;
    descEl.textContent = data.desc[lang] || data.desc.tr;
    tagsEl.innerHTML = data.tags.map(t => `<span>${t}</span>`).join('');

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  cards.forEach(card => {
    card.addEventListener('click', () => open(card.getAttribute('data-project')));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(card.getAttribute('data-project'));
      }
    });
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ---------- Contact form (Formspree AJAX submit) ---------- */
