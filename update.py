import os
from datetime import datetime

WEB_FOLDER = "web"

def list_web_files():
    print("=== Files in /web/ ===")
    all_paths = []
    for root, _, files in os.walk(WEB_FOLDER):
        for file in sorted(files):
            if file == ".DS_Store":
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, WEB_FOLDER)
            all_paths.append(rel_path)
    
    for path in sorted(all_paths):
        print(path)
    print()

def create_update():
    version = input("Enter version (e.g., 1.0.1): ").strip()
    today = datetime.today().strftime("%B %-d, %Y")
    custom_date = input(f"Enter date [default: {today}]: ").strip()
    date = custom_date if custom_date else today

    print("Enter update description. End with a blank line.")
    lines = []
    while True:
        line = input()
        if line.strip() == "":
            break
        lines.append(line)

    text = " ".join(lines)

    print("\n=== COPY THIS HTML BELOW ===\n")
    print(f'<div class="version">v{version}</div>')
    print(f'<div class="date">{date}</div>')
    print(f'<div class="update">\n  {text}\n</div>')
    print('<div class="separator"></div>')
    print("\n=== END COPY ===\n")

def main():
    list_web_files()
    choice = input("Do you want to create a new update? (y/n): ").strip().lower()
    if choice == "y":
        create_update()
    else:
        print("✅ Done. No update created.")

if __name__ == "__main__":
    main()