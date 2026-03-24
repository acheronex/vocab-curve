#!/usr/bin/env python3
"""Convert raw PDF text (layout mode) to structured markdown."""

import re

INPUT = "/tmp/input-layout.txt"
OUTPUT = "./for-analysis/output.md"

# Section breaks: (paragraph-start text, section title)
# Identified from the novella's narrative structure.
SECTION_BREAKS = [
    ("Sohn eines blutarmen südslawischen", "Czentovics Kindheit"),
    ("Nach einem halben Jahre beherrschte Mirko", "Czentovics Karriere"),
    ("Und nun war ein solches Phänomen", "Der Erzähler und McConnor"),
    ("Am nächsten Tage war unsere kleine Gruppe", "Die Simultanpartie"),
    ("Unwillkürlich wandten wir uns alle um.", "Der geheimnisvolle Fremde"),
    ("Doch nun ereignete sich etwas Unvorhergesehenes.", "Dr. B. stellt sich vor"),
    ("Er hatte auf den Deckchair neben sich gedeutet.", "Dr. B.s Geschichte"),
    ("Nun hatten die Nationalsozialisten", "Verhaftung und Isolation"),
    ("Dieser eigentlich unbeschreibbare Zustand", "Die Folter des Nichts"),
    ("In dieser äußersten Not ereignete sich", "Das Schachbuch"),
    ("Ich weiß nun nicht, bis zu welchem Grade", "Schachvergiftung"),
    ("Wie dieser grauenhafte, dieser unbeschreibbare", "Genesung"),
    ("Pünktlich um die vereinbarte Stunde", "Die letzte Partie"),
]


def extract_paragraphs(raw: str) -> list[str]:
    """Parse layout-mode pdftotext output into paragraphs."""
    lines = raw.split("\n")

    # Find where text starts
    start_idx = 0
    for i, line in enumerate(lines):
        if "uf dem großen Passagierdampfer" in line:
            start_idx = i
            break

    lines = lines[start_idx:]

    # Phase 1: Classify each line
    text_lines = []  # (line_text, is_paragraph_start)
    after_skip = False  # Track if we just skipped a header/page-break
    for line in lines:
        # Form feed = page break
        if "\x0c" in line:
            line = line.replace("\x0c", "")
            after_skip = True

        stripped = line.strip()
        # Skip empty lines
        if not stripped:
            after_skip = True
            continue
        # Skip page numbers
        if re.match(r"^\d+$", stripped):
            after_skip = True
            continue
        # Skip headers (may appear as "Stefan Zweig" or "Schachnovelle" or combined)
        if stripped in ("Stefan Zweig", "Schachnovelle", "Stefan Zweig Schachnovelle"):
            after_skip = True
            continue
        # Also skip if line is just the header at the right side
        if re.match(r"^(Stefan Zweig\s+)?Schachnovelle$", stripped):
            after_skip = True
            continue

        # Detect paragraph-start: indentation OR first line after page/header skip
        is_indent = line.startswith("   ") and not line.startswith("      ")
        is_para_start = is_indent or after_skip
        after_skip = False

        text_lines.append((stripped, is_para_start))

    # Phase 2: Join into paragraphs
    # A line after a page break is only a new paragraph if the previous
    # text ended with sentence-ending punctuation.
    paragraphs = []
    current = []
    for text, is_para_start in text_lines:
        if is_para_start and current:
            last_text = " ".join(current).rstrip()
            # If previous text doesn't end with sentence punctuation,
            # this is a mid-sentence page break, not a new paragraph.
            if last_text and last_text[-1] in ".!?«»":
                paragraphs.append(last_text)
                current = [text]
            else:
                current.append(text)
        else:
            current.append(text)
    if current:
        paragraphs.append(" ".join(current))

    # Phase 3: Clean up
    result = []
    for p in paragraphs:
        p = re.sub(r"\s{2,}", " ", p).strip()
        if not p:
            continue
        result.append(p)

    # Fix drop cap variants
    if result:
        result[0] = re.sub(r"^A\s+uf dem großen", "Auf dem großen", result[0])
        result[0] = re.sub(r"^uf dem großen", "Auf dem großen", result[0])
        if result[0] == "A" and len(result) > 1:
            result[0] = "A" + result[1]
            result.pop(1)

    return result


def split_sections(paragraphs: list[str]) -> list[tuple[str, list[str]]]:
    """Split paragraphs into named sections."""
    sections = [("Auf dem Dampfer", [])]

    for para in paragraphs:
        for break_text, section_title in SECTION_BREAKS:
            if para.startswith(break_text):
                sections.append((section_title, []))
                break
        sections[-1][1].append(para)

    return sections


def write_markdown(sections: list[tuple[str, list[str]]], output_path: str):
    """Write sections as markdown."""
    with open(output_path, "w", encoding="utf-8") as f:
        for i, (title, paragraphs) in enumerate(sections, 1):
            f.write(f"## Abschnitt {i}: {title}\n\n")
            for para in paragraphs:
                f.write(para + "\n\n")

    total_words = 0
    print(f"Written {len(sections)} sections to {output_path}")
    for i, (title, paras) in enumerate(sections, 1):
        wc = sum(len(p.split()) for p in paras)
        total_words += wc
        print(f"  Abschnitt {i:2d}: {title:<30s} ({len(paras):3d} paras, ~{wc:5d} words)")
    print(f"\n  Total: {sum(len(s[1]) for s in sections)} paragraphs, ~{total_words} words")


def main():
    with open(INPUT, "r", encoding="utf-8") as f:
        raw = f.read()

    paragraphs = extract_paragraphs(raw)
    print(f"Extracted {len(paragraphs)} paragraphs")

    sections = split_sections(paragraphs)
    write_markdown(sections, OUTPUT)


if __name__ == "__main__":
    main()
