import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
const auth = getAuth(app);

// ---------- AUTH ----------
const loginScreen = document.getElementById("login-screen");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("login-error");

document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = "Login gagal: " + err.message;
    loginError.classList.remove("hidden");
  }
});

document.getElementById("btn-logout").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadSiteData();
  } else {
    loginScreen.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});

// ---------- DATA LOADER ----------
let siteData = {
  hero: { titleLine1: "", titleLine2: "", subtitle: "", cta1: "", cta2: "" },
  services: [],
  techstack: [],
  pricing: [],
  testimonials: [],
  testimonialsHeading: "Apa Kata Klien Kami?",
  testimonialsSubheading: "Kepercayaan mereka adalah pencapaian terbesar kami.",
  faq: [],
  contact: { heading: "", subtext: "", waNumber: "", waMessage: "" },
};

async function loadSiteData() {
  const docRef = doc(db, "siteContent", "homepage");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    siteData = { ...siteData, ...snap.data() };
  } else {
    await setDoc(docRef, siteData);
  }
  renderCurrentTab();
}

// ---------- TAB NAVIGATION ----------
let currentTab = "hero";
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentTab = btn.dataset.tab;
    renderCurrentTab();
  });
});

function renderCurrentTab() {
  const container = dashboard;
  let html = `<h2 class="text-2xl font-semibold mb-8 capitalize">${currentTab} Editor</h2>`;

  switch (currentTab) {
    case "hero":
      html += formHero();
      break;
    case "services":
      html += formList("services", ["icon", "title", "desc"], siteData.services);
      break;
    case "techstack":
      html += formList("techstack", ["name", "iconClass"], siteData.techstack);
      break;
    case "pricing":
      html += formList("pricing", ["name", "price", "unit", "desc", "features"], siteData.pricing);
      break;
    case "testimonials":
      html += `
        <div class="mb-8 p-4 bg-brand-navy rounded border border-white/10">
          <h3 class="text-lg font-semibold mb-4">Judul & Subjudul Section</h3>
          <input class="w-full bg-brand-dark border border-white/10 p-2 rounded text-white mb-2" value="${esc(siteData.testimonialsHeading || '')}" data-field="testimonialsHeading" placeholder="Heading (misal: Apa Kata Klien Kami?)">
          <input class="w-full bg-brand-dark border border-white/10 p-2 rounded text-white" value="${esc(siteData.testimonialsSubheading || '')}" data-field="testimonialsSubheading" placeholder="Subheading (misal: Kepercayaan mereka adalah pencapaian terbesar kami.)">
        </div>
      `;
      html += formList("testimonials", ["text", "by", "img"], siteData.testimonials);
      break;
    case "faq":
      html += formList("faq", ["q", "a"], siteData.faq);
      break;
    case "contact":
      html += formObject("contact", siteData.contact, ["heading", "subtext", "waNumber", "waMessage"]);
      break;
    case "portfolio":
      html += portfolioManager();
      break;
    default:
      html = "<p>Pilih tab</p>";
  }

  container.innerHTML = html;
  attachSaveListeners();

  if (currentTab === "portfolio") {
    loadPortfolios();
    attachPortfolioListener();
  }
}

// ---------- FORM BUILDER ----------
function formHero() {
  const d = siteData.hero;
  return `
    <div class="space-y-4">
      <input class="w-full bg-brand-navy border border-white/10 p-3 rounded text-white" value="${esc(d.titleLine1)}" data-field="hero.titleLine1" placeholder="Judul baris 1">
      <input class="w-full bg-brand-navy border border-white/10 p-3 rounded text-white" value="${esc(d.titleLine2)}" data-field="hero.titleLine2" placeholder="Judul baris 2">
      <input class="w-full bg-brand-navy border border-white/10 p-3 rounded text-white" value="${esc(d.subtitle)}" data-field="hero.subtitle" placeholder="Subjudul">
      <input class="w-full bg-brand-navy border border-white/10 p-3 rounded text-white" value="${esc(d.cta1)}" data-field="hero.cta1" placeholder="Tombol 1">
      <input class="w-full bg-brand-navy border border-white/10 p-3 rounded text-white" value="${esc(d.cta2)}" data-field="hero.cta2" placeholder="Tombol 2">
      <button class="save-btn bg-brand-cyan text-brand-dark px-6 py-2 rounded font-bold">Simpan Hero</button>
    </div>
  `;
}

function formObject(key, obj, fields) {
  let html = '<div class="space-y-4">';
  fields.forEach((f) => {
    html += `<input class="w-full bg-brand-navy border border-white/10 p-3 rounded text-white" value="${esc(obj[f] || '')}" data-field="${key}.${f}" placeholder="${f}">`;
  });
  html += `<button class="save-btn bg-brand-cyan text-brand-dark px-6 py-2 rounded font-bold">Simpan</button></div>`;
  return html;
}

function formList(key, fields, items) {
  let html = `<div class="space-y-6"><div id="${key}-list">`;
  items.forEach((item, i) => {
    html += `<div class="bg-brand-navy p-4 rounded border border-white/5 mb-4" data-index="${i}">`;
    fields.forEach((f) => {
      if (f === "features") {
        const val = Array.isArray(item[f]) ? item[f].join(", ") : item[f] || "";
        html += `<input class="w-full bg-brand-dark border border-white/10 p-2 rounded text-white mb-2" value="${esc(val)}" data-field="${key}.${i}.${f}" placeholder="${f} (pisahkan dengan koma)">`;
      } else {
        html += `<input class="w-full bg-brand-dark border border-white/10 p-2 rounded text-white mb-2" value="${esc(item[f] || '')}" data-field="${key}.${i}.${f}" placeholder="${f}">`;
      }
    });
    html += `<button class="del-item-btn text-red-400 text-sm mt-2">Hapus</button></div>`;
  });
  html += `</div><button id="add-${key}-btn" class="text-brand-cyan underline">+ Tambah Item</button>
           <button class="save-btn bg-brand-cyan text-brand-dark px-6 py-2 rounded font-bold mt-4 block">Simpan Semua</button></div>`;
  return html;
}

// ---------- SAVE HANDLER ----------
function attachSaveListeners() {
  function syncInputsToSiteData() {
    const inputs = document.querySelectorAll("[data-field]");
    inputs.forEach((input) => {
      const path = input.dataset.field;
      const value = input.value;
      setNestedValue(siteData, path, value);
    });
  }

  document.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      syncInputsToSiteData();
      const newData = JSON.parse(JSON.stringify(siteData));

      const docRef = doc(db, "siteContent", "homepage");
      try {
        await setDoc(docRef, newData, { merge: true });
        siteData = newData;
        alert("Berhasil disimpan!");
      } catch (err) {
        alert("Gagal menyimpan: " + err.message);
      }
    });
  });

  document.querySelectorAll("button[id^='add-']").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncInputsToSiteData();
      const key = btn.id.replace("add-", "").replace("-btn", "");
      const template = getDefaultItem(key);
      if (!siteData[key]) siteData[key] = [];
      siteData[key].push(template);
      renderCurrentTab();
    });
  });

  document.querySelectorAll(".del-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      syncInputsToSiteData();
      const parent = e.target.closest("[data-index]");
      const idx = parseInt(parent.dataset.index);
      siteData[currentTab].splice(idx, 1);
      renderCurrentTab();
    });
  });
}

function getDefaultItem(key) {
  switch (key) {
    case "services":
      return { icon: "bi-star", title: "Judul", desc: "Deskripsi" };
    case "techstack":
      return { name: "Nama Teknologi", iconClass: "devicon-react-original colored text-6xl" };
    case "pricing":
      return { name: "Nama", price: "0", unit: "/proyek", desc: "Deskripsi", features: ["Fitur"] };
    case "testimonials":
      return { text: "Testimoni", by: "Nama", img: "https://i.pravatar.cc/150" };
    case "faq":
      return { q: "Pertanyaan", a: "Jawaban" };
    default:
      return {};
  }
}

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    let key = keys[i];
    if (!isNaN(keys[i + 1]) && Array.isArray(current[key])) {
      // biarkan
    }
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  const last = keys[keys.length - 1];
  if (last === "features" && typeof value === "string") {
    current[last] = value.split(",").map(s => s.trim()).filter(s => s !== "");
  } else {
    current[last] = value;
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- PORTFOLIO MANAGER ----------
async function loadPortfolios() {
  const container = document.getElementById("portfolio-list");
  if (!container) return;
  container.innerHTML = "Memuat...";
  const q = query(collection(db, "portfolios"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  container.innerHTML = "";
  snap.forEach((doc) => {
    const data = doc.data();
    container.innerHTML += `
      <div class="flex items-center justify-between bg-brand-navy p-3 rounded mb-2">
        <div>
          <p class="font-medium">${data.title}</p>
          <p class="text-xs text-gray-400">${data.category}</p>
        </div>
        <button class="del-porto-btn text-red-400 text-sm" data-id="${doc.id}">Hapus</button>
      </div>`;
  });
  document.querySelectorAll(".del-porto-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await deleteDoc(doc(db, "portfolios", id));
      loadPortfolios();
    });
  });
}

function portfolioManager() {
  return `
    <div class="mb-10">
      <h3 class="text-lg font-semibold mb-4">Tambah Baru</h3>
      <form id="add-portfolio-form" class="space-y-4" autocomplete="off" onsubmit="return false;">
        <input type="text" id="porto-title" required placeholder="Judul Proyek" class="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-cyan">
        <select id="porto-category" class="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-cyan">
          <option value="Web App">Web App</option>
          <option value="E-Commerce">E-Commerce</option>
          <option value="Company Profile">Company Profile</option>
          <option value="Landing Page">Landing Page</option>
        </select>
        <input type="url" id="porto-image-url" required placeholder="URL Gambar" class="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-cyan">
        <button type="button" id="btn-save-portfolio" class="bg-brand-cyan text-brand-dark font-bold py-2 px-6 rounded">Simpan</button>
      </form>
    </div>
    <div>
      <h3 class="text-lg font-semibold mb-4">Daftar Portofolio</h3>
      <div id="portfolio-list"></div>
    </div>`;
}

function attachPortfolioListener() {
  const btnSave = document.getElementById("btn-save-portfolio");
  if (!btnSave) return;
  btnSave.onclick = async () => {
    const title = document.getElementById("porto-title").value.trim();
    const category = document.getElementById("porto-category").value;
    const imgUrl = document.getElementById("porto-image-url").value.trim();

    if (!title || !imgUrl) {
      alert("Judul dan URL gambar wajib diisi.");
      return;
    }

    try {
      await addDoc(collection(db, "portfolios"), {
        title,
        category,
        imgUrl,
        createdAt: serverTimestamp(),
      });
      alert("Portofolio ditambahkan!");
      document.getElementById("add-portfolio-form").reset();
      loadPortfolios();
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    }
  };
}