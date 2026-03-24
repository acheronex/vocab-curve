"""Convert Lutherbibel 1912 read-aloud text files into a single markdown for analysis.

Groups small books into sections so every section is 10K-20K tokens.
"""

import os
import re
from collections import defaultdict

INPUT_DIR = "/tmp/deu1912"
OUTPUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "for-analysis", "lutherbibel-1912.md")

# ── Section grouping rules ───────────────────────────────────────
# Each entry: (section_title, [book_codes])
# Books >= 10K standalone, books < 10K merged by genre/tradition.

SECTION_GROUPS = [
    # Old Testament
    ("Das 1. Buch Mose (Genesis)", ["GEN"]),
    ("Das 2. Buch Mose (Exodus)", ["EXO"]),
    ("Das 3. Buch Mose (Levitikus)", ["LEV"]),
    ("Das 4. Buch Mose (Numeri)", ["NUM"]),
    ("Das 5. Buch Mose (Deuteronomium)", ["DEU"]),
    ("Josua, Richter, Ruth", ["JOS", "JDG", "RUT"]),
    ("Das erste Buch Samuel", ["1SA"]),
    ("2. Samuel + 1. Chronik", ["2SA", "1CH"]),
    ("Das erste Buch der Könige", ["1KI"]),
    ("Das zweite Buch der Könige", ["2KI"]),
    ("Das zweite Buch der Chronik", ["2CH"]),
    ("Esra, Nehemia, Esther", ["EZR", "NEH", "EST"]),
    ("Hiob + Sprüche", ["JOB", "PRO"]),
    ("Die Psalmen", ["PSA"]),
    ("Prediger, Hohelied, Klagelieder, Daniel", ["ECC", "SNG", "LAM", "DAN"]),
    ("Der Prophet Jesaja", ["ISA"]),
    ("Der Prophet Jeremia", ["JER"]),
    ("Der Prophet Hesekiel", ["EZK"]),
    ("Die kleinen Propheten", ["HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"]),
    # New Testament
    ("Das Evangelium nach Matthäus", ["MAT"]),
    ("Markus + Johannes", ["MRK", "JHN"]),
    ("Das Evangelium nach Lukas", ["LUK"]),
    ("Die Apostelgeschichte", ["ACT"]),
    ("Römer, 1-2 Korinther", ["ROM", "1CO", "2CO"]),
    ("Galater bis Hebräer", ["GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB"]),
    ("Jakobus bis Offenbarung", ["JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"]),
]

# ── Collect files grouped by book code ───────────────────────────

files_by_book: dict[str, list[tuple[int, str]]] = defaultdict(list)

for fname in os.listdir(INPUT_DIR):
    if not fname.endswith("_read.txt") or "_000_" in fname:
        continue
    parts = fname.replace("_read.txt", "").split("_")
    book_code = parts[2]
    chapter_num = int(parts[3])
    files_by_book[book_code].append((chapter_num, os.path.join(INPUT_DIR, fname)))

# Sort chapters within each book
for chapters in files_by_book.values():
    chapters.sort(key=lambda x: x[0])

# ── Build markdown ───────────────────────────────────────────────

lines_out = ["# Lutherbibel 1912\n"]

for section_title, book_codes in SECTION_GROUPS:
    lines_out.append(f"\n## {section_title}\n")

    for code in book_codes:
        chapters = files_by_book.get(code, [])
        for chap_num, chap_path in chapters:
            with open(chap_path, "r", encoding="utf-8-sig") as f:
                content = f.read().strip()

            # Skip first 2 lines (book name + chapter number)
            content_lines = content.split("\n")
            text_lines = [line.strip() for line in content_lines[2:] if line.strip()]
            text = "\n".join(text_lines)

            if text:
                lines_out.append(text)
                lines_out.append("")

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines_out))

word_count = len("\n".join(lines_out).split())
print(f"Sections: {len(SECTION_GROUPS)}")
print(f"Words: {word_count:,}")
print(f"Output: {OUTPUT}")
