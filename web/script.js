// --- SCRIPT.JS ---
console.log("Script loaded");

function showToast(message, duration = 1500) {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function loadEntries() {
  const container = document.getElementById("entries");
  if (!container) return;

  window.pywebview.api.get_entries().then((entries) => {
    container.innerHTML = "";
    entries.reverse().forEach((entry, index) => {
      const div = document.createElement("div");
      div.className = "entry";
      div.innerHTML = `
        <h3>${entry.title}</h3>
        <p>${entry.content}</p>
        <small>${entry.date}</small>
      `;

      container.appendChild(div);
    });
  }).catch(err => {
    console.error("Failed to load entries:", err);
  });
}

function saveEntry() {
  const saveBtn = document.getElementById("save-button");
  if (saveBtn.disabled) return;

  const titleInput = document.getElementById("title");
  const contentInput = document.getElementById("content");
  const title = titleInput?.value.trim();
  const content = contentInput?.value.trim();

  if (!title || !content) {
    showToast("Title and content are required.");
    return;
  }

  saveBtn.disabled = true;

  window.pywebview.api.save_entry(title, content).then(() => {
    titleInput.value = "";
    contentInput.value = "";
    showToast("Entry saved!");
    setTimeout(() => {
      fadeOutPage(() => {
        window.location.href = "index.html";
      });
    }, 1200);
  }).catch(err => {
    console.error("Failed to save entry:", err);
    showToast("Something went wrong.");
  }).finally(() => {
    setTimeout(() => {
      saveBtn.disabled = false;
    }, 1000);
  });
}

function initAuthPage() {
  const pwBtn = document.getElementById("pwBtn");
  const touchBtn = document.getElementById("touchBtn");

  pwBtn.onclick = () => {
    const pw = document.getElementById("pw").value;
    if (pw === "Chompy#1") {
      markUnlocked();
      fadeOutPage(() => window.location.href = "index.html");
    } else {
      alert("Wrong password");
    }
  };

  touchBtn.onclick = () => {
    if (!window.pywebview) return;
    window.pywebview.api.try_touch_id().then((res) => {
      if (res.success) {
        markUnlocked();
        fadeOutPage(() => window.location.href = "index.html");
      } else {
        alert(res.error || "Touch ID failed.");
      }
    });
  };
}

function setupExpandableButtons() {
  const buttons = document.querySelectorAll(".btn-fab");
  buttons.forEach(btn => {
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
    });
  });
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

  requestAnimationFrame(() => {
    fade.style.opacity = "1";
  });

  setTimeout(callback, 500);
}

document.addEventListener("contextmenu", (e) => {
  const tag = e.target.tagName.toLowerCase();
  if (tag !== "textarea" && tag !== "input") {
    e.preventDefault();
  }
});

window.addEventListener("pywebviewready", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => preloader.remove(), 400);
  }

  const container = document.querySelector(".container");
  if (container) {
    container.classList.add("loaded");
  }

  setupExpandableButtons();

  if (document.getElementById("entries")) loadEntries();
  if (document.getElementById("save-button")) document.getElementById("save-button").onclick = saveEntry;
  if (document.getElementById("pwBtn")) initAuthPage();
});

function markUnlocked() {
  window.unlocked = true;
  sessionStorage.setItem("unlocked", "true");
}

window.unlocked = sessionStorage.getItem("unlocked") === "true";

function cmdFAIL(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

window.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const isCmd = e.metaKey || e.ctrlKey;
  const key = e.key.toLowerCase();
  const page = window.location.pathname.split('/').pop();

  if ((isMac && e.metaKey && key === 's') || (!isMac && e.ctrlKey && key === 's')) {
    if (["index.html", "new.html"].includes(page)) {
      e.preventDefault();
      if (window.unlocked) {
        if (page === "settings.html") {
          showToast("Page successfully reloaded");
          window.location.reload();
        } else {
          window.location.href = "settings.html";
        }
      } else {
        cmdFAIL("Need to unlock first");
      }
    }
  }

  if (!isCmd) return;

  if (key === 'r') {
    e.preventDefault();
    if (window.unlocked) {
      if (window.pywebview?.api?.force_restart) {
        window.pywebview.api.force_restart().then(() => {
          sessionStorage.removeItem("unlocked");
          window.location.href = 'lock.html';
        }).catch(() => {
          sessionStorage.removeItem("unlocked");
          window.location.href = 'lock.html';
        });
      } else {
        sessionStorage.removeItem("unlocked");
        window.location.href = 'lock.html';
      }
    } else {
      cmdFAIL("Need to unlock first");
    }
  }

  if (key === 'h') {
    if (["new.html", "settings.html"].includes(page)) {
      e.preventDefault();
      if (window.unlocked) {
        if (page === "index.html") {
          showToast("Page successfully reloaded");
          window.location.reload();
        } else {
          window.location.href = "index.html";
        }
      } else {
        cmdFAIL("Need to unlock first");
      }
    }
  }

  if (key === 'n') {
    if (["index.html", "settings.html"].includes(page)) {
      e.preventDefault();
      if (window.unlocked) {
        if (page === "new.html") {
          showToast("Page successfully reloaded");
          window.location.reload();
        } else {
          window.location.href = "new.html";
        }
      } else {
        cmdFAIL("Need to unlock first");
      }
    }
  }
});