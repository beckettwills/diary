console.log("Script loaded");

function showToast(message, duration = 1500) {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function fadeOutPage(callback) {
  const fade = document.createElement("div");
  fade.style.position = "fixed";
  fade.style.inset = "0";
  fade.style.background = "rgba(0, 0, 0, 0.9)";
  fade.style.zIndex = "99999";
  fade.style.opacity = "0";
  fade.style.transition = "opacity 0.5s ease";
  document.body.appendChild(fade);

  requestAnimationFrame(() => fade.style.opacity = "1");
  setTimeout(callback, 500);
}

function navigateTo(path) {
  fadeOutPage(() => window.location.href = path);
}

function setupExpandableButtons() {
  document.querySelectorAll(".btn-fab").forEach(btn => {
    btn.style.transition = "width 0.4s ease, padding 0.4s ease";

    btn.addEventListener("mouseenter", () => {
      btn.style.width = "130px";
      btn.style.borderRadius = "999px";
      btn.style.paddingLeft = "16px";
      btn.style.paddingRight = "20px";
      const span = btn.querySelector("span");
      if (span) {
        span.style.opacity = "1";
        span.style.marginLeft = "12px";
        span.style.maxWidth = "150px";
      }
      const defIcon = btn.querySelector(".icon-default");
      const hoverIcon = btn.querySelector(".icon-hover");
      if (defIcon) defIcon.style.opacity = "0";
      if (hoverIcon) hoverIcon.style.opacity = "1";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.width = "40px";
      btn.style.borderRadius = "50%";
      btn.style.paddingLeft = "0";
      btn.style.paddingRight = "0";
      const span = btn.querySelector("span");
      if (span) {
        span.style.opacity = "0";
        span.style.marginLeft = "0";
        span.style.maxWidth = "0";
      }
      const defIcon = btn.querySelector(".icon-default");
      const hoverIcon = btn.querySelector(".icon-hover");
      if (defIcon) defIcon.style.opacity = "1";
      if (hoverIcon) hoverIcon.style.opacity = "0";
    });
  });
}

function insertThemeToggle() {
  const header = document.querySelector(".header-buttons");
  if (!header) return;

  const btn = document.createElement("div");
  btn.className = "btn-fab";
  btn.id = "themeToggle";
  btn.innerHTML = `
    <div class="icon-wrap">
      <img class="icon-default" src="" alt="mode" />
      <img class="icon-hover" src="" alt="mode" />
    </div>
    <span></span>
  `;
  btn.onclick = toggleTheme;
  header.appendChild(btn);

  const mode = localStorage.getItem("theme") || "dark";
  updateThemeToggleIcon(mode);
}

function updateThemeToggleIcon(mode) {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const def = btn.querySelector(".icon-default");
  const hover = btn.querySelector(".icon-hover");
  const span = btn.querySelector("span");

  if (mode === "dark") {
    def.src = "img/svg/dark.svg";
    hover.src = "img/svg/light.svg";
    span.textContent = "Light Mode";
  } else {
    def.src = "img/svg/light.svg";
    hover.src = "img/svg/dark.svg";
    span.textContent = "Dark Mode";
  }
}

function toggleTheme() {
  const current = document.body.classList.contains("light") ? "light" : "dark";
  const next = current === "light" ? "dark" : "light";
  setTheme(next);
}

function setTheme(mode) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(mode);
  localStorage.setItem("theme", mode);
  updateThemeToggleIcon(mode);
}

// === Page Actions ===
function loadEntries() {
  const container = document.getElementById("entries");
  if (!container) return;

  window.pywebview.api.get_entries().then((entries) => {
    container.innerHTML = "";
    entries.reverse().forEach((entry) => {
      const div = document.createElement("div");
      div.className = "entry";
      div.innerHTML = `
        <h3>${entry.title}</h3>
        <p>${entry.content}</p>
        <small>${entry.date}</small>
      `;
      container.appendChild(div);
    });
  });
}

function saveEntry() {
  const saveBtn = document.getElementById("save-button");
  if (saveBtn.disabled) return;

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();

  if (!title || !content) {
    showToast("Title and content are required.");
    return;
  }

  saveBtn.disabled = true;

  window.pywebview.api.save_entry(title, content).then(() => {
    showToast("Entry saved!");
    setTimeout(() => navigateTo("index.html"), 1200);
  }).finally(() => {
    setTimeout(() => saveBtn.disabled = false, 1000);
  });
}

function initAuthPage() {
  const pwBtn = document.getElementById("pwBtn");
  const touchBtn = document.getElementById("touchBtn");

  pwBtn.onclick = () => {
    const pw = document.getElementById("pw").value;
    if (pw === "Chompy#1") {
      markUnlocked();
      navigateTo("index.html");
    } else {
      alert("Wrong password");
    }
  };

  touchBtn.onclick = () => {
    window.pywebview.api.try_touch_id().then((res) => {
      if (res.success) {
        markUnlocked();
        navigateTo("index.html");
      } else {
        alert(res.error || "Touch ID failed.");
      }
    });
  };
}

function markUnlocked() {
  window.unlocked = true;
  sessionStorage.setItem("unlocked", "true");
}

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("theme") || "dark";
  setTheme(saved);
});

window.addEventListener("pywebviewready", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => preloader.remove(), 400);
  }

  const container = document.querySelector(".container");
  if (container) container.classList.add("loaded");

  setupExpandableButtons();
  insertThemeToggle();

  if (document.getElementById("entries")) loadEntries();
  if (document.getElementById("save-button")) document.getElementById("save-button").onclick = saveEntry;
  if (document.getElementById("pwBtn")) initAuthPage();
});

// === Block access if not unlocked ===
window.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  const isLockPage = currentPage === "lock.html";
  const unlocked = sessionStorage.getItem("unlocked") === "true";

  if (!unlocked && !isLockPage) {
    window.location.href = "lock.html";
  }

  const saved = localStorage.getItem("theme") || "dark";
  setTheme(saved);
});

function refreshBackgroundImage() {
  const mode = document.body.classList.contains("light") ? "light" : "dark";
  const bgPath = document.body.dataset[`bg${mode.charAt(0).toUpperCase() + mode.slice(1)}`];
  if (!bgPath) return;

  document.body.style.backgroundImage = "none";
  setTimeout(() => {
    document.body.style.backgroundImage = `url("${bgPath}")`;
  }, 10);
}

// Reload on fullscreen or when user comes back to tab
document.addEventListener("fullscreenchange", refreshBackgroundImage);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshBackgroundImage();
  }
});

function showToast(message, duration = 1500) {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function navigateTo(page) {
  const isUnlocked = sessionStorage.getItem("unlocked") === "true";
  const restrictedPages = ["settings.html", "index.html", "new.html"];

  if (restrictedPages.includes(page) && !isUnlocked) {
    showToast("Need to unlock first");
    return;
  }

  // Fade out before navigating (optional)
  const fade = document.createElement("div");
  fade.style.position = "fixed";
  fade.style.inset = "0";
  fade.style.background = "rgba(0, 0, 0, 0.9)";
  fade.style.zIndex = "99999";
  fade.style.opacity = "0";
  fade.style.transition = "opacity 0.5s ease";
  document.body.appendChild(fade);

  requestAnimationFrame(() => {
    fade.style.opacity = "1";
  });

  setTimeout(() => {
    window.location.href = page;
  }, 400);
}

// === Keyboard Shortcuts ===
window.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const isCmd = e.metaKey || e.ctrlKey;
  const key = e.key.toLowerCase();

  if (!isCmd) return;

  e.preventDefault();

  switch (key) {
    case "s":
      navigateTo("settings.html");
      break;
    case "h":
      navigateTo("index.html");
      break;
    case "n":
      navigateTo("new.html");
      break;
    case "r":
      const isUnlocked = sessionStorage.getItem("unlocked") === "true";
      if (!isUnlocked) {
        showToast("Need to unlock first");
        return;
      }

      if (window.pywebview?.api?.force_restart) {
        window.pywebview.api.force_restart().then(() => {
          sessionStorage.removeItem("unlocked");
          navigateTo("lock.html");
        }).catch(() => {
          sessionStorage.removeItem("unlocked");
          navigateTo("lock.html");
        });
      } else {
        sessionStorage.removeItem("unlocked");
        navigateTo("lock.html");
      }
      break;
  }
});
document.addEventListener("contextmenu", (e) => {
  const tag = e.target.tagName.toLowerCase();
  if (tag !== "textarea" && tag !== "input") {
    e.preventDefault();
  }
});