import os
import sys
import json
from datetime import datetime
import webview
import urllib.request
import shutil
import uuid  # for cache-busting

remote_version = ""

# macOS biometric authentication (optional)
try:
    import objc
    from Foundation import NSObject
    from LocalAuthentication import LAContext
except ImportError:
    LAContext = None

# Path setup
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.join(sys._MEIPASS, 'web')
else:
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'web'))

DATA_FILE = os.path.join(os.path.dirname(__file__), 'diary.json')
REMOTE_BASE = "https://raw.githubusercontent.com/beckettwills/diary/main/web/"
LOCAL_WEB_FOLDER = BASE_DIR
VERSION_FILE = "version.txt"
PASSWORD = "Chompy#1"

def load_entries():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_entries(entries):
    with open(DATA_FILE, "w") as f:
        json.dump(entries, f, indent=2)

def load_raw_json():
    if not os.path.exists(DATA_FILE):
        return "[]"
    with open(DATA_FILE, "r") as f:
        return f.read()

def save_raw_json(raw):
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            with open(DATA_FILE, "w") as f:
                json.dump(parsed, f, indent=2)
            return {"success": True}
        else:
            return {"success": False, "error": "JSON must be a list of entries."}
    except json.JSONDecodeError as e:
        return {"success": False, "error": str(e)}

def fetch_url_nocache(url):
    # Append a unique query param to bust cache
    unique_url = f"{url}?_={uuid.uuid4()}"
    return urllib.request.urlopen(unique_url)

class Api:
    def get_entries(self):
        return load_entries()

    def save_entry(self, title, content):
        from datetime import datetime
        import time

        def get_day_with_suffix(day):
            if 11 <= day <= 13:
                return f"{day}th"
            last_digit = day % 10
            return f"{day}{['th','st','nd','rd','th','th','th','th','th','th'][last_digit]}" if day else ""

        now = datetime.now()
        month = now.strftime("%B")
        day_with_suffix = get_day_with_suffix(now.day)
        year = now.year
        time_str = now.strftime("%I:%M:%S %p").lstrip("0")
        formatted_date = f"{month} {day_with_suffix} {year} at {time_str}"
        tz_name = time.tzname[0] if time.tzname else ""

        entries = load_entries()
        entry = {
            "title": title,
            "content": content,
            "date": formatted_date,
            "timezone": tz_name
        }
        entries.append(entry)
        save_entries(entries)
        return "Saved!"

    def delete_entry(self, index):
        entries = load_entries()
        if 0 <= index < len(entries):
            del entries[-(index + 1)]
            save_entries(entries)
            return True
        return False

    def try_touch_id(self):
        try:
            from touch_auth import authenticate_with_touch_id
            return authenticate_with_touch_id()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_raw_json(self):
        return load_raw_json()

    def save_raw_json(self, raw):
        return save_raw_json(raw)

    def force_restart(self):
        return "Restarting..."

    def check_for_updates(self):
        local_version_path = os.path.join(LOCAL_WEB_FOLDER, VERSION_FILE)

        try:
            # Load local version
            if os.path.exists(local_version_path):
                with open(local_version_path, "r") as f:
                    local_version = f.read().strip()
            else:
                local_version = ""

            # Load remote version with cache busting
            with fetch_url_nocache(REMOTE_BASE + VERSION_FILE) as response:
                remote_version = response.read().decode("utf-8").strip()

            print("Local version:", local_version)
            print("Remote version:", remote_version)

            if local_version != remote_version:
                return {
                    "update_available": True,
                    "local_version": local_version,
                    "remote_version": remote_version
                }
            else:
                return {
                    "update_available": False,
                    "local_version": local_version,
                    "remote_version": remote_version
                }

        except Exception as e:
            return {"error": str(e)}

    def apply_update(self):
        try:
            # Get list of files from remote filelist.txt with cache busting
            with fetch_url_nocache(REMOTE_BASE + "filelist.txt") as response:
                files = response.read().decode("utf-8").splitlines()

            # Show update.html from main folder (outside web)
            window.load_url(os.path.join(os.path.dirname(__file__), "update.html"))

            # Set of expected file full paths after update
            expected_files = set(os.path.join(LOCAL_WEB_FOLDER, f) for f in files)

            # Download all files and overwrite
            for file in files:
                file_url = REMOTE_BASE + file
                local_path = os.path.join(LOCAL_WEB_FOLDER, file)
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                with fetch_url_nocache(file_url) as response, open(local_path, 'wb') as out_file:
                    shutil.copyfileobj(response, out_file)

            # Remove any files NOT in expected_files inside LOCAL_WEB_FOLDER recursively
            for root, dirs, filenames in os.walk(LOCAL_WEB_FOLDER):
                for filename in filenames:
                    full_path = os.path.join(root, filename)
                    if full_path not in expected_files:
                        os.remove(full_path)
                # Remove empty directories optionally
                for dir in dirs:
                    dir_path = os.path.join(root, dir)
                    if not os.listdir(dir_path):  # directory empty
                        os.rmdir(dir_path)

            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

if __name__ == '__main__':
    api = Api()
    global window
    window = webview.create_window(
        "My Diary",
        os.path.join(BASE_DIR, 'lock.html'),
        width=800,
        height=650,
        js_api=api
    )
    webview.start(debug=True)