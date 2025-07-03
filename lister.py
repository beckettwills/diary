import os

WEB_FOLDER = "web"
OUTPUT_FILE = os.path.join(WEB_FOLDER, "filelist.txt")

def list_all_files(base_folder):
    file_paths = []
    for root, _, files in os.walk(base_folder):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, base_folder)
            file_paths.append(rel_path.replace("\\", "/"))  # normalize for GitHub
    return sorted(file_paths)

if __name__ == "__main__":
    files = list_all_files(WEB_FOLDER)
    with open(OUTPUT_FILE, "w") as f:
        f.write("\n".join(files))
    print(f"Wrote {len(files)} files to {OUTPUT_FILE}")