# ============================================================================
# PYTHON ENVIRONMENT SETUP
# ============================================================================
# If you are unsure which Python interpreter or virtual environment to use
# for running this script, we recommend using "uv" -- a fast, modern Python
# package and virtual environment manager built by Astral.
#
# Search online for "uv Python package manager" or visit:
#   https://github.com/astral-sh/uv
#
# Quick start:
#   1. Install uv (see their docs for the latest method)
#   2. Create a virtual environment:  uv venv
#   3. Activate it:                   source .venv/bin/activate
#   4. Install dependencies:          uv pip install -r requirements.txt
#   5. Run this script:               python scripts/sync_content.py
#
# For the cron job, point directly at the venv's Python interpreter:
#   */2 * * * * /path/to/pberg-engineers/.venv/bin/python /path/to/pberg-engineers/scripts/sync_content.py >> /var/log/pberg-sync.log 2>&1
# ============================================================================

#!/usr/bin/env python3
"""Content sync watcher for the PBerg Engineers website.

Monitors an external directory for new meetup photos and an external plain-text
file for new lightning talks. When changes are detected, this script:

  Photos:
    1. Scans the incoming photos directory for image files
    2. Resizes them to max 1200px wide
    3. Converts them to optimized JPEG at quality 85
    4. Names them MonthYear.jpeg based on the current date (e.g. February2026.jpeg)
    5. Copies them into photos/ in the repo
    6. Adds the month entry to data/photos.json
    7. Deletes the original from the incoming directory

  Lightning Talks:
    1. Reads talks.txt (alternating speaker / topic lines)
    2. Compares against data/talks.json to find new entries
    3. Prepends new entries with the current month
    4. Regenerates talks.txt so it stays in sync with the repo

  After any changes:
    - Commits all modified files
    - Pushes to origin to trigger GitHub Pages deploy

Intended to run as a cron job every 2 minutes:

  */2 * * * * /path/to/.venv/bin/python /path/to/pberg-engineers/scripts/sync_content.py >> /var/log/pberg-sync.log 2>&1

Dependencies: Pillow (see requirements.txt)
For HEIC/HEIF support (common on iPhones): pip install pillow-heif
"""

import datetime
import fcntl
import json
import os
import subprocess
import sys

from pathlib import Path

sys.path.insert(0, "/root/scripts")
from tg_notify import tg_send, tg_error

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is not installed. Run: pip install Pillow")
    sys.exit(1)

# Try to register HEIC/HEIF support (optional)
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

# ============================================================================
# CONFIGURATION -- adjust these paths for your server
# ============================================================================
INCOMING_PHOTOS_DIR = os.environ.get(
    "PBERG_INCOMING_PHOTOS",
    os.path.expanduser("~/pberg-incoming/photos"),
)
TALKS_FILE_PATH = os.environ.get(
    "PBERG_TALKS_FILE",
    os.path.expanduser("~/pberg-incoming/talks.txt"),
)
REPO_DIR = os.environ.get(
    "PBERG_REPO_DIR",
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
)

LOCK_FILE = "/tmp/pberg-sync.lock"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
MAX_WIDTH = 1200
JPEG_QUALITY = 85
MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]
MONTH_ABBREVS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


# ============================================================================
# Helpers
# ============================================================================

def log(message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")


def git(args, cwd=None):
    """Run a git command and return stdout. Raises on failure."""
    result = subprocess.run(
        ["git"] + args,
        cwd=cwd or REPO_DIR,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"git {' '.join(args)} failed (exit {result.returncode}):\n"
            f"  stdout: {result.stdout.strip()}\n"
            f"  stderr: {result.stderr.strip()}"
        )
    return result.stdout.strip()




def ensure_clean_state():
    """Ensure repo is in a clean state by committing any pending changes."""
    try:
        status = git(["status", "--porcelain"])
        if status.strip():
            log("Found uncommitted changes, committing them first...")
            git(["add", "-A"])
            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            git(["commit", "-m", f"Auto-commit pending changes before sync ({now})"])
            log("Committed pending changes")
    except Exception as e:
        log(f"Warning: Could not check/commit pending changes: {e}")

def current_month_label():
    """Return e.g. 'February 2026' for photos.json."""
    now = datetime.datetime.now()
    return f"{MONTH_NAMES[now.month - 1]} {now.year}"


def current_month_short():
    """Return e.g. 'Feb 2026' for talks.json."""
    now = datetime.datetime.now()
    return f"{MONTH_ABBREVS[now.month - 1]} {now.year}"


def month_label_to_filename(label):
    """'February 2026' -> 'February2026.jpeg'"""
    return label.replace(" ", "") + ".jpeg"


# ============================================================================
# Photo processing
# ============================================================================

def process_incoming_photos():
    """Scan incoming dir, resize/convert photos, update repo. Returns list of changed files."""
    incoming = Path(INCOMING_PHOTOS_DIR)
    if not incoming.is_dir():
        return []

    image_files = [
        f for f in incoming.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    ]
    if not image_files:
        return []

    photos_dir = Path(REPO_DIR) / "photos"
    photos_dir.mkdir(exist_ok=True)

    photos_json_path = Path(REPO_DIR) / "data" / "photos.json"
    with open(photos_json_path, "r") as f:
        photos_list = json.load(f)

    label = current_month_label()
    filename = month_label_to_filename(label)
    dest_path = photos_dir / filename

    changed_files = []

    for img_file in sorted(image_files):
        log(f"Processing photo: {img_file.name}")
        try:
            img = Image.open(img_file)
            img = img.convert("RGB")

            if img.width > MAX_WIDTH:
                ratio = MAX_WIDTH / img.width
                new_height = int(img.height * ratio)
                img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
                log(f"  Resized to {MAX_WIDTH}x{new_height}")

            img.save(dest_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
            log(f"  Saved as {dest_path}")

            img_file.unlink()
            log(f"  Deleted original: {img_file.name}")

        except Exception as e:
            log(f"  ERROR processing {img_file.name}: {e}")
            continue

    if dest_path.exists():
        changed_files.append(str(dest_path.relative_to(REPO_DIR)))

        if label not in photos_list:
            photos_list.append(label)
            with open(photos_json_path, "w") as f:
                json.dump(photos_list, f, indent=2)
                f.write("\n")
            changed_files.append("data/photos.json")
            log(f"  Added '{label}' to photos.json")

    return changed_files


# ============================================================================
# Talks sync
# ============================================================================

def parse_talks_txt(path):
    """Parse talks.txt into list of (speaker, topic) tuples."""
    txt_path = Path(path)
    if not txt_path.is_file():
        return []

    lines = txt_path.read_text(encoding="utf-8").strip().splitlines()
    pairs = []
    i = 0
    while i + 1 < len(lines):
        speaker = lines[i].strip()
        topic = lines[i + 1].strip()
        if speaker and topic:
            pairs.append((speaker, topic))
        i += 2
    return pairs


def generate_talks_txt(talks):
    """Generate talks.txt content from talks.json data."""
    lines = []
    for talk in talks:
        lines.append(talk["speaker"])
        lines.append(talk["topic"])
    return "\n".join(lines) + "\n"


def sync_talks():
    """Compare talks.txt with talks.json, sync new entries. Returns list of changed files."""
    talks_json_path = Path(REPO_DIR) / "data" / "talks.json"

    with open(talks_json_path, "r") as f:
        talks = json.load(f)

    txt_pairs = parse_talks_txt(TALKS_FILE_PATH)
    if not txt_pairs:
        return []

    existing_pairs = {(t["speaker"], t["topic"]) for t in talks}

    new_pairs = [p for p in txt_pairs if p not in existing_pairs]

    changed_files = []

    if new_pairs:
        month = current_month_short()
        new_entries = [
            {"month": month, "speaker": speaker, "topic": topic}
            for speaker, topic in new_pairs
        ]
        talks = new_entries + talks

        with open(talks_json_path, "w") as f:
            json.dump(talks, f, indent=2, ensure_ascii=False)
            f.write("\n")

        log(f"Added {len(new_pairs)} new talk(s) for {month}:")
        for speaker, topic in new_pairs:
            log(f"  - {speaker}: {topic}")

        changed_files.append("data/talks.json")

    updated_txt = generate_talks_txt(talks)
    txt_path = Path(TALKS_FILE_PATH)
    current_txt = txt_path.read_text(encoding="utf-8") if txt_path.is_file() else ""

    if updated_txt != current_txt:
        txt_path.parent.mkdir(parents=True, exist_ok=True)
        txt_path.write_text(updated_txt, encoding="utf-8")
        log("Regenerated talks.txt to match repo state")

    return changed_files


# ============================================================================
# Git operations
# ============================================================================

def git_sync(changed_files):
    """Add, commit, and push changed files."""
    if not changed_files:
        return

    for f in changed_files:
        git(["add", f])

    file_list = ", ".join(changed_files)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    commit_msg = f"sync: update content ({now})\n\nChanged files: {file_list}"

    git(["commit", "-m", commit_msg])
    log(f"Committed: {file_list}")

    git(["push"])
    log("Pushed to origin")


# ============================================================================
# Main
# ============================================================================

def main():
    lock_fd = None
    try:
        lock_fd = open(LOCK_FILE, "w")
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except (IOError, OSError):
        print("Another instance is already running. Exiting.")
        sys.exit(0)

    try:
        log("=== Starting content sync ===")
        log(f"Repo:     {REPO_DIR}")
        log(f"Photos:   {INCOMING_PHOTOS_DIR}")
        log(f"Talks:    {TALKS_FILE_PATH}")

        # Ensure clean state and pull latest before processing
        ensure_clean_state()
        log("Pulling latest from origin...")
        git(["pull", "--rebase"])

        all_changed = []

        photo_changes = process_incoming_photos()
        all_changed.extend(photo_changes)

        talk_changes = sync_talks()
        all_changed.extend(talk_changes)

        if all_changed:
            git_sync(all_changed)
            log(f"Done. {len(all_changed)} file(s) synced.")

            # Build notification
            n_photos = len(photo_changes)
            n_talks = len(talk_changes)
            parts = []
            if n_photos:
                parts.append(f"📷 <b>{n_photos} photo file(s)</b> updated")
            if n_talks:
                # Re-read talks.json to show what was added
                try:
                    import json as _json
                    talks_json = _json.loads(
                        (Path(REPO_DIR) / "data" / "talks.json").read_text()
                    )
                    recent = talks_json[:n_talks // 2 or 1]  # roughly the new ones
                    talk_lines = "\n".join(
                        f"  • {t['speaker']}: {t['topic']}" for t in recent
                    )
                    parts.append(f"🎤 <b>{n_talks // 2 or 1} new talk(s)</b>:\n{talk_lines}")
                except Exception:
                    parts.append(f"🎤 <b>talks.json</b> updated")

            file_lines = "\n".join(f"  • {f}" for f in all_changed)
            tg_send(
                f"🏗️ <b>PBerg Engineers – content synced</b>\n\n"
                + "\n".join(parts) + "\n\n"
                f"📁 Changed files:\n{file_lines}\n\n"
                f"🚀 Pushed → GitHub Pages deploying\n"
                f"🔗 <a href='https://jarvis-claw-ai.github.io/pberg-engineers/'>pberg-engineers site</a>"
            )
        else:
            log("No changes detected.")

        log("=== Finished ===")

    except Exception as e:
        log(f"FATAL ERROR: {e}")
        tg_error("PBerg Engineers – Content Sync", str(e))
        sys.exit(1)

    finally:
        if lock_fd:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)
            lock_fd.close()
            try:
                os.unlink(LOCK_FILE)
            except OSError:
                pass


if __name__ == "__main__":
    main()
