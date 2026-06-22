// ==========================================
// CODESYA STUDIO – MAIN SCRIPT (FINAL)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- Konfigurasi Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyD2O5Wjt-0Pn_y9naFsvS3iAwoyeWPqIQQ",
  authDomain: "codesya-studio.firebaseapp.com",
  projectId: "codesya-studio",
  storageBucket: "codesya-studio.firebasestorage.app",
  messagingSenderId: "846215546817",
  appId: "1:846215546817:web:1d2b8dac64cfe596bc9140",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 1. NAVBAR SCROLL EFFECT
// ==========================================
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("bg-brand-dark/80", "border-brand-cyan/30");
    navbar.classList.remove("bg-white/5", "border-white/10");
  } else {
    navbar.classList.add("bg-white/5", "border-white/10");
    navbar.classList.remove("bg-brand-dark/80", "border-brand-cyan/30");
  }
});

// ==========================================
// 2. TESTIMONIAL CAROUSEL (STAGGERED)
// ==========================================
const testimonialContainer = document.getElementById("testimonial-container");
const btnPrev = document.getElementById("btn-prev-testi");
const btnNext = document.getElementById("btn-next-testi");

// Tidak ada data fallback – akan diisi dari Firestore
let testimonialsData = [];
let currentList = [];
let cardSize = window.innerWidth > 640 ? 365 : 290;

window.addEventListener("resize", () => {
  const newSize = window.innerWidth > 640 ? 365 : 290;
  if (newSize !== cardSize) {
    cardSize = newSize;
    if (testimonialsData.length > 0) initTestimonials();
  }
});

function handleMove(steps) {
  if (currentList.length === 0) return;
  const newList = [...currentList];
  if (steps > 0) {
    for (let i = steps; i > 0; i--) newList.push(newList.shift());
  } else {
    for (let i = steps; i < 0; i++) newList.unshift(newList.pop());
  }
  currentList = newList;
  updateCarouselPositions();
}

function initTestimonials() {
  if (!testimonialContainer) return;
  testimonialContainer.innerHTML = "";
  testimonialsData.forEach((testi) => {
    const card = document.createElement("div");
    card.className = "testi-card inactive";
    card.setAttribute("data-id", testi.id);
    card.style.width = `${cardSize}px`;
    card.style.height = `${cardSize}px`;
    card.innerHTML = `
      <span class="testi-deco-line bg-white/10"></span>
      <img src="${testi.img}" alt="${testi.by}" class="mb-4 h-14 w-12 object-cover object-top border-2 border-transparent bg-brand-navy" style="box-shadow: 3px 3px 0px #00b4d8">
      <h3 class="text-base sm:text-lg font-medium text-white mb-4 italic text-card-title">"${testi.text}"</h3>
      <p class="absolute bottom-8 left-8 right-8 mt-2 text-sm italic text-gray-400 text-card-by">- ${testi.by}</p>
    `;
    testimonialContainer.appendChild(card);
  });
  updateCarouselPositions();
}

function updateCarouselPositions() {
  currentList.forEach((testi, index) => {
    const card = testimonialContainer.querySelector(`[data-id="${testi.id}"]`);
    if (!card) return;
    const position = currentList.length % 2
      ? index - Math.floor(currentList.length / 2)
      : index - currentList.length / 2;
    const isCenter = position === 0;
    card.style.zIndex = isCenter ? "20" : 10 - Math.abs(position);
    const translateX = (cardSize / 1.3) * position;
    const translateY = isCenter ? -45 : position % 2 ? 15 : -15;
    const rotate = isCenter ? 0 : position % 2 ? 3 : -3;
    const scale = isCenter ? 1.05 : 0.9;
    card.style.transform = `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`;

    const decoLine = card.querySelector(".testi-deco-line");
    const img = card.querySelector("img");
    const title = card.querySelector(".text-card-title");
    const by = card.querySelector(".text-card-by");

    if (isCenter) {
      card.className = "testi-card active";
      if (decoLine) decoLine.className = "testi-deco-line bg-brand-dark/20";
      if (img) {
        img.className = "mb-4 h-14 w-12 object-cover object-top border-2 border-brand-dark bg-brand-navy";
        img.style.boxShadow = "3px 3px 0px #050B14";
      }
      if (title) title.className = "text-base sm:text-lg font-medium text-white mb-4 italic text-card-title";
      if (by) by.className = "absolute bottom-8 left-8 right-8 mt-2 text-sm italic text-gray-400 text-card-by";
    } else {
      card.className = "testi-card inactive";
      if (decoLine) decoLine.className = "testi-deco-line bg-white/10";
      if (img) {
        img.className = "mb-4 h-14 w-12 object-cover object-top border-2 border-transparent bg-brand-navy";
        img.style.boxShadow = "3px 3px 0px #00b4d8";
      }
      if (title) title.className = "text-base sm:text-lg font-medium text-white mb-4 italic text-card-title";
      if (by) by.className = "absolute bottom-8 left-8 right-8 mt-2 text-sm italic text-gray-400 text-card-by";
    }
    card.onclick = () => { if (position !== 0) handleMove(position); };
  });
}

if (btnPrev) btnPrev.addEventListener("click", () => handleMove(-1));
if (btnNext) btnNext.addEventListener("click", () => handleMove(1));

// ==========================================
// 3. WEBGL SHADER BACKGROUND
// ==========================================
const canvas = document.getElementById("shader-canvas");
if (canvas) {
  const gl = canvas.getContext("webgl");
  if (gl) {
    const vsSource = `attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;
    const fsSource = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      mat2 rotate2d(float angle){ float c=cos(angle),s=sin(angle); return mat2(c,-s,s,c); }
      float variation(vec2 v1,vec2 v2,float strength,float speed){ return sin(dot(normalize(v1),normalize(v2))*strength+iTime*speed)/100.0; }
      vec3 paintCircle(vec2 uv,vec2 center,float rad,float width){
          vec2 diff = center-uv;
          float len = length(diff);
          len += variation(diff,vec2(0.,1.),5.,2.);
          len -= variation(diff,vec2(1.,0.),5.,2.);
          float circle = smoothstep(rad-width,rad,len)-smoothstep(rad,rad+width,len);
          return vec3(circle);
      }
      void main(){
          vec2 uv = gl_FragCoord.xy/iResolution.xy;
          uv.x *= 1.5; uv.x -= 0.25;
          float mask = 0.0;
          float radius = .35;
          vec2 center = vec2(.5);
          mask += paintCircle(uv,center,radius,.035).r;
          mask += paintCircle(uv,center,radius-.018,.01).r;
          mask += paintCircle(uv,center,radius+.018,.005).r;
          vec2 v=rotate2d(iTime)*uv;
          vec3 foregroundColor=vec3(v.x,v.y,.7-v.y*v.x);
          vec3 color=mix(vec3(0.02, 0.04, 0.08), foregroundColor, mask * 0.4);
          gl_FragColor=vec4(color,1.);
      }`;
    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, vsSource); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, fsSource); gl.compileShader(fs);
    const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program); gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "aPosition"); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const iTimeLoc = gl.getUniformLocation(program, "iTime");
    const iResLoc = gl.getUniformLocation(program, "iResolution");
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; gl.viewport(0,0,canvas.width,canvas.height); }
    window.addEventListener("resize", resize); resize();
    function render(time) { gl.uniform1f(iTimeLoc, time*0.001); gl.uniform2f(iResLoc, canvas.width, canvas.height); gl.drawArrays(gl.TRIANGLES,0,6); requestAnimationFrame(render); }
    requestAnimationFrame(render);
  }
}

// ==========================================
// 4. RIPPLE BUTTON EFFECT (delegasi)
// ==========================================
document.addEventListener('click', function(e) {
  const btn = e.target.closest('#harga button, .ripple-btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const ripple = document.createElement("span");
  ripple.className = "ripple-effect";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ==========================================
// 5. SPOTLIGHT CURSOR PADA KARTU HARGA (delegasi)
// ==========================================
document.addEventListener('mousemove', function(e) {
  const card = e.target.closest('.glow-card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  card.style.setProperty("--mouse-x", `${x}px`);
  card.style.setProperty("--mouse-y", `${y}px`);
});

// ==========================================
// 6. PORTOFOLIO DENGAN INFINITE MARQUEE
// ==========================================
function createPortfolioCard(data) {
  return `
    <div class="group cursor-pointer bg-brand-navy rounded-2xl overflow-hidden border border-white/5 shadow-2xl transition duration-500 hover:border-brand-cyan/20 hover:shadow-cyan-900/40 relative">
      <div class="h-64 overflow-hidden relative">
        <img src="${data.imgUrl}" alt="${data.title}" class="w-full h-full object-cover transition duration-700 group-hover:scale-105">
        <div class="absolute bottom-3 right-3 bg-brand-cyan/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs text-brand-cyan font-bold shadow-lg">
          ${data.category}
        </div>
      </div>
      <div class="py-4 px-5 flex items-center justify-between gap-4">
        <h3 class="text-lg font-bold text-white truncate transition group-hover:text-brand-cyan">${data.title}</h3>
        <div class="text-brand-cyan text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-300 shrink-0">
          Lihat Detail <span class="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </div>
  `;
}

async function loadPortfolioMarquee() {
  const col1 = document.getElementById('col-1');
  const col2 = document.getElementById('col-2');
  const col3 = document.getElementById('col-3');
  if (!col1 || !col2 || !col3) return;

  try {
    const q = query(collection(db, "portfolios"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      col1.innerHTML = '<p class="text-gray-400 text-center">Belum ada portofolio.</p>';
      return;
    }

    let htmlCol1 = '';
    let htmlCol2 = '';
    let htmlCol3 = '';
    let index = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const card = createPortfolioCard(data);
      if (index % 3 === 0) htmlCol1 += card;
      else if (index % 3 === 1) htmlCol2 += card;
      else htmlCol3 += card;
      index++;
    });

    col1.innerHTML = htmlCol1 + htmlCol1;
    col2.innerHTML = htmlCol2 + htmlCol2;
    col3.innerHTML = htmlCol3 + htmlCol3;
  } catch (error) {
    console.error("Gagal memuat portofolio:", error);
  }
}

// ==========================================
// 7. EFEK PARALLAX SCROLL PORTOFOLIO
// ==========================================
function initPortfolioParallax() {
  const section = document.getElementById('portofolio');
  if (!section) return;

  window.addEventListener('scroll', () => {
    if (window.innerWidth < 1024) {
      document.querySelectorAll('#portfolio-container > div').forEach(card => {
        card.style.transform = 'translateY(0px)';
      });
      return;
    }

    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const cards = document.querySelectorAll('#portfolio-container > div');
      let scrollProgress = window.innerHeight - rect.top;
      cards.forEach((card, index) => {
        const colIndex = index % 3;
        const speed = 0.1;
        card.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        if (colIndex === 1) {
          card.style.transform = `translateY(${scrollProgress * speed}px)`;
        } else {
          card.style.transform = `translateY(${scrollProgress * -speed}px)`;
        }
      });
    }
  });
}

// ==========================================
// 8. MEMUAT SEMUA KONTEN DARI FIREBASE
// ==========================================
async function loadSiteContent() {
  try {
    const docRef = doc(db, "siteContent", "homepage");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();

    // --- HERO ---
    if (data.hero) {
      const hero = data.hero;
      const titleEl = document.getElementById("hero-title");
      const subtitleEl = document.getElementById("hero-subtitle");
      const cta1 = document.getElementById("hero-cta1");
      const cta2 = document.getElementById("hero-cta2");
      if (titleEl && hero.titleLine1) {
        titleEl.innerHTML = `${hero.titleLine1} <br class="hidden md:block" /> ${hero.titleLine2 || ''}`;
      }
      if (subtitleEl && hero.subtitle) subtitleEl.textContent = hero.subtitle;
      if (cta1 && hero.cta1) cta1.textContent = hero.cta1;
      if (cta2 && hero.cta2) cta2.textContent = hero.cta2;
    }

    // --- LAYANAN ---
    const servicesGrid = document.getElementById("services-grid");
    if (servicesGrid && data.services && data.services.length > 0) {
      servicesGrid.innerHTML = "";
      data.services.forEach(svc => {
        servicesGrid.innerHTML += `
          <div class="bg-brand-navy p-8 rounded-2xl border border-white/5 hover:border-brand-cyan/30 transition duration-300 group">
            <div class="w-14 h-14 bg-brand-cyan/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <i class="bi ${svc.icon || 'bi-star'} text-2xl text-brand-cyan"></i>
            </div>
            <h3 class="text-xl font-semibold mb-3">${svc.title || ''}</h3>
            <p class="text-gray-400 text-sm leading-relaxed">${svc.desc || ''}</p>
          </div>
        `;
      });
    }

    // --- TECH STACK ---
    const techContainer = document.getElementById("techstack-marquee");
    if (techContainer && data.techstack && data.techstack.length > 0) {
      let techHTML = '<div class="flex items-center gap-16 px-8 min-w-max">';
      data.techstack.forEach(tech => {
        techHTML += `
          <div class="flex flex-col items-center gap-3 hover:scale-110 transition">
            <i class="${tech.iconClass}"></i>
            <span class="text-xs font-semibold text-gray-400">${tech.name}</span>
          </div>`;
      });
      techHTML += '</div>';
      techContainer.innerHTML = techHTML + techHTML;
    } else if (techContainer) {
      techContainer.innerHTML = '<p class="text-gray-500 text-center col-span-full w-full">Belum ada teknologi yang ditambahkan di Admin.</p>';
    }

    // --- HARGA ---
    const pricingGrid = document.getElementById("pricing-grid");
    if (pricingGrid && data.pricing && data.pricing.length > 0) {
      pricingGrid.innerHTML = "";
      data.pricing.forEach((p, idx) => {
        const isPopular = idx === 1;
        const featuresHTML = (p.features || []).map(f => `<li class="flex items-center gap-2"><span class="text-brand-cyan">✔</span> ${f}</li>`).join('');
        pricingGrid.innerHTML += `
          <div class="glass-card glow-card rounded-2xl p-8 max-w-sm w-full transition duration-300 hover:border-brand-cyan/50 ${isPopular ? 'scale-105 border-brand-cyan/30 ring-2 ring-brand-cyan/20 relative shadow-2xl' : ''}">
            ${isPopular ? '<div class="absolute -top-4 right-6 bg-brand-cyan text-brand-dark px-4 py-1.5 text-xs font-bold rounded-full z-20 shadow-lg">Most Popular</div>' : ''}
            <h3 class="text-4xl font-light text-white mb-2">${p.name || 'Paket'}</h3>
            <p class="text-gray-400 text-sm mb-6">${p.desc || ''}</p>
            <div class="flex items-baseline gap-2 mb-6"><span class="text-5xl font-light">Rp ${(Number(p.price) || 0).toLocaleString('id-ID')}</span><span class="text-sm text-gray-400">${p.unit || ''}</span></div>
            <div class="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full mb-6"></div>
            <ul class="space-y-3 text-gray-300 text-sm mb-8">${featuresHTML}</ul>
            <button class="w-full py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition border border-white/20">${isPopular ? 'Pilih Paket' : 'Mulai'}</button>
          </div>
        `;
      });
    }

    // --- TESTIMONI ---
    const testiHeading = document.querySelector('#testimoni h2');
    const testiSub = document.querySelector('#testimoni p.text-gray-400');
    if (testiHeading && data.testimonialsHeading) testiHeading.textContent = data.testimonialsHeading;
    if (testiSub && data.testimonialsSubheading) testiSub.textContent = data.testimonialsSubheading;

    if (data.testimonials && data.testimonials.length > 0) {
      testimonialsData = data.testimonials.map((t, idx) => ({ id: idx + 1, text: t.text, by: t.by, img: t.img }));
      currentList = [...testimonialsData];
      initTestimonials();
    } else {
      if (testimonialContainer) testimonialContainer.innerHTML = '';
    }

    // --- FAQ ---
    const faqContainer = document.getElementById("faq-container");
    if (faqContainer && data.faq && data.faq.length > 0) {
      faqContainer.innerHTML = "";
      let col1HTML = '<div class="space-y-4">';
      let col2HTML = '<div class="space-y-4">';
      data.faq.forEach((item, index) => {
        const faqHTML = `
          <details class="group bg-brand-navy border border-white/5 p-5 rounded-xl cursor-pointer">
            <summary class="flex justify-between items-center font-medium list-none outline-none">
              <span>${item.q}</span>
              <span class="transition group-open:rotate-180 text-brand-cyan text-xl">+</span>
            </summary>
            <div class="text-gray-400 mt-4 text-sm leading-relaxed border-t border-white/5 pt-4">${item.a}</div>
          </details>
        `;
        if (index % 2 === 0) col1HTML += faqHTML;
        else col2HTML += faqHTML;
      });
      col1HTML += '</div>';
      col2HTML += '</div>';
      faqContainer.innerHTML = col1HTML + col2HTML;
    } else if (faqContainer) {
      faqContainer.innerHTML = '<p class="text-gray-500 text-center col-span-full">Belum ada FAQ yang ditambahkan.</p>';
    }

    // --- KONTAK ---
    if (data.contact) {
      const c = data.contact;

      const heading = document.getElementById("contact-heading");
      const subtext = document.getElementById("contact-subtext");
      if (heading && c.heading) heading.textContent = c.heading;
      if (subtext && c.subtext) subtext.textContent = c.subtext;

      const waLink = document.getElementById("contact-wa-link");
      if (waLink && c.waNumber) {
        waLink.href = `https://wa.me/${c.waNumber}`;
        waLink.innerHTML = `<i class="bi bi-whatsapp text-2xl"></i> ${c.waMessage || 'Chat via WhatsApp'}`;
      }

      const navbarWa = document.getElementById("navbar-wa-btn");
      if (navbarWa && c.waNumber) {
        navbarWa.href = `https://wa.me/${c.waNumber}`;
      }

      const floatingWa = document.getElementById("floating-wa-btn");
      const floatingWaText = document.getElementById("floating-wa-text");
      if (floatingWa && c.waNumber) {
        floatingWa.href = `https://wa.me/${c.waNumber}`;
      }
      if (floatingWaText) {
        const deco = floatingWaText.querySelector('span');
        floatingWaText.innerHTML = '';
        floatingWaText.appendChild(document.createTextNode(c.waMessage || 'Chat Kami!'));
        if (deco) floatingWaText.appendChild(deco);
      }
    }

  } catch (error) {
    console.error("Gagal memuat konten situs:", error);
  }
}

// ==========================================
// STARTUP
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  loadPortfolioMarquee();
  loadSiteContent();
  initPortfolioParallax();
});