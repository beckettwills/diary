async function loadJson() {
    try {
        const raw = await window.pywebview.api.get_raw_json();
        document.getElementById("json-editor").value = raw;
    } catch (e) {
        alert("Failed to load JSON: " + e.message);
    }
}

async function saveJson() {
    const raw = document.getElementById("json-editor").value;
    const res = await window.pywebview.api.save_raw_json(raw);
    if (res.success) {
        alert("JSON saved successfully.");
    } else {
        alert("Error: " + res.error);
    }
}

async function forceRestart() {
    await window.pywebview.api.force_restart();
    sessionStorage.removeItem("unlocked");
    window.location.href = "lock.html";
}

async function checkForUpdates() {
    const result = await window.pywebview.api.check_for_updates();
    if (result.error) {
        alert("Error checking updates: " + result.error);
        return;
    }

    if (result.update_available) {
        const confirmUpdate = confirm(
            `New version (${result.remote_version}) available. Update now?`
        );
        if (confirmUpdate) {
            const applyResult = await window.pywebview.api.apply_update();
            if (applyResult.success) {
                alert("Update complete! The app will now close.");
                window.pywebview.close();
            } else {
                alert("Update failed: " + applyResult.error);
            }
        }
    } else {
        alert("You're up to date!");
    }
}

async function loadVersion() {
    try {
        const res = await window.pywebview.api.check_for_updates();
        if (!res.error) {
            document.getElementById("version-container").textContent =
                "Version: " + (res.local_version || "unknown");
        } else {
            document.getElementById("version-container").textContent =
                "Version: unknown";
        }
    } catch {
        document.getElementById("version-container").textContent =
            "Version: unknown";
    }
}

window.addEventListener("pywebviewready", () => {
    loadJson();
    loadVersion();
    document.getElementById("save-json").onclick = saveJson;
    document.getElementById("force-restart").onclick = forceRestart;
});