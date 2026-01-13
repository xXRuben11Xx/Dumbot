/* =========================
   BUSCADOR
========================= */

let engine = "google";

const engines = {
    google: "https://www.google.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q=",
    bing: "https://www.bing.com/search?q="
};

document.querySelectorAll(".engines button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".engines button")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
        engine = btn.dataset.engine;

        // --- NUEVA LÓGICA PARA EL PLACEHOLDER ---
        const searchInput = document.getElementById("query");
        // Capitalizamos la primera letra (google -> Google)
        const engineName = engine.charAt(0).toUpperCase() + engine.slice(1);
        searchInput.placeholder = `Buscar en ${engineName}...`;
    };
});

document.getElementById("searchForm").onsubmit = e => {
    e.preventDefault();
    const q = query.value.trim();
    if (!q) return;
    location.href = engines[engine] + encodeURIComponent(q);
};

/* =========================
   RELOJ
========================= */

const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");

function updateClock() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
    dateEl.textContent = now.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
}

updateClock();
setInterval(updateClock, 1000);

/* =========================
   CLIMA
========================= */

const WEATHER_API_KEY = "4bc0a9bce8c24b32bca11718250807";
const weatherTemp = document.getElementById("weather-temp");
const weatherCity = document.getElementById("weather-city");
const weatherIcon = document.getElementById("weather-icon");

navigator.geolocation.getCurrentPosition(
    pos => {
        fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${pos.coords.latitude},${pos.coords.longitude}&lang=es`)
            .then(r => r.json())
            .then(d => {
                weatherTemp.textContent = Math.round(d.current.temp_c) + "°";
                weatherCity.textContent = d.location.name;
                weatherIcon.src = "https:" + d.current.condition.icon;
            });
    },
    () => document.getElementById("weather").style.display = "none"
);

/* =========================
   ACCESOS DIRECTOS
========================= */

const shortcutsEl = document.getElementById("shortcuts");

let shortcuts = JSON.parse(localStorage.getItem("shortcuts")) || [
    { name: "Google", url: "https://google.com" },
    { name: "YouTube", url: "https://youtube.com" }
];

function saveShortcuts() {
    localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
}

function normalizeUrl(url) {
    return url.startsWith("http") ? url : "https://" + url;
}

function getFavicon(url) {
    try {
        return `https://www.google.com/s2/favicons?sz=128&domain=${new URL(url).hostname}`;
    } catch {
        return "";
    }
}

/* =========================
   MODAL
========================= */

const modal = document.getElementById("shortcutModal");
const modalTitle = document.getElementById("modalTitle");
const modalName = document.getElementById("modalName");
const modalUrl = document.getElementById("modalUrl");
const saveBtn = document.getElementById("saveShortcut");
const deleteBtn = document.getElementById("deleteShortcut");
const cancelBtn = document.getElementById("cancelShortcut");

let editingIndex = null;

/* =========================
   RENDER + DRAG
========================= */

let dragIndex = null;

function renderShortcuts() {
    shortcutsEl.innerHTML = "";

    shortcuts.forEach((s, index) => {
        const safeUrl = normalizeUrl(s.url);

        const div = document.createElement("div");
        div.className = "shortcut";
        div.draggable = true;
        div.dataset.index = index;

        div.innerHTML = `
            <img src="${getFavicon(safeUrl)}">
            <span>${s.name}</span>
            <div class="menu">⋮</div>
        `;

        div.onclick = () => location.href = safeUrl;

        div.querySelector(".menu").onclick = e => {
            e.stopPropagation();
            openModal(index);
        };

        /* DRAG */
        div.ondragstart = () => {
            dragIndex = index;
            div.style.opacity = "0.4";
        };

        div.ondragend = () => div.style.opacity = "1";

        div.ondragover = e => e.preventDefault();

        div.ondrop = () => {
            const moved = shortcuts.splice(dragIndex, 1)[0];
            shortcuts.splice(index, 0, moved);
            saveShortcuts();
            renderShortcuts();
        };

        shortcutsEl.appendChild(div);
    });

    /* BOTÓN + */
    const add = document.createElement("div");
    add.className = "shortcut-add";
    add.textContent = "+";
    add.onclick = addShortcut;
    shortcutsEl.appendChild(add);
}

/* =========================
   ACCIONES
========================= */

function addShortcut() {
    editingIndex = shortcuts.length;
    modalTitle.textContent = "Nuevo acceso";
    modalName.value = "";
    modalUrl.value = "";
    deleteBtn.style.display = "none";
    modal.classList.remove("hidden");
}

function openModal(index) {
    editingIndex = index;
    modalTitle.textContent = "Editar acceso";
    modalName.value = shortcuts[index].name;
    modalUrl.value = shortcuts[index].url;
    deleteBtn.style.display = "";
    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
    editingIndex = null;
}

saveBtn.onclick = () => {
    const name = modalName.value.trim();
    let url = modalUrl.value.trim();

    if (!name || !url) return alert("Completá todo");

    url = normalizeUrl(url);
    try { new URL(url); } catch { return alert("URL inválida"); }

    shortcuts[editingIndex] = { name, url };
    saveShortcuts();
    renderShortcuts();
    closeModal();
};

deleteBtn.onclick = () => {
    if (!confirm("¿Eliminar acceso?")) return;
    shortcuts.splice(editingIndex, 1);
    saveShortcuts();
    renderShortcuts();
    closeModal();
};

cancelBtn.onclick = closeModal;

/* =========================
   TEMA GUARDADO
========================= */

const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

const savedTheme = localStorage.getItem("theme") || "dark";
root.dataset.theme = savedTheme;
themeToggle.textContent = savedTheme === "dark" ? "🌙" : "☀️";

themeToggle.onclick = () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
    themeToggle.textContent = next === "dark" ? "🌙" : "☀️";
};

/* =========================
   INIT
========================= */

renderShortcuts();

/* =========================
   BLUR DINÁMICO MOUSE
========================= */

document.addEventListener("mousemove", e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;

    document.body.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
});

