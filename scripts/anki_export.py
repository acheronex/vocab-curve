#!/usr/bin/env python3
"""
Anki Vocabulary Exporter - frequency tier analysis & TSV export.

Usage:
    python3 scripts/anki_export.py [analysis_json] [options]

Arguments:
    analysis_json       Path to analysis JSON (e.g. output/lutherbibel-1912.json)

Options:
    --tier TIER         Tier to export: hapax, rare, medium, core, all (default: all)
    --dict-path PATH    Path to dictionary folder (default: anki-notes/dictionaries/UniversalDeRu)
    --output-dir DIR    Output directory for TSV files (default: anki-notes/export)
    --stats-only        Only show statistics, skip export
"""

import json
import os
import csv
import sys
import argparse
import hashlib
import glob
from typing import Optional

DICT_PATH = "./anki-notes/dictionaries/UniversalDeRu"
DEFAULT_ANALYSIS = "./output/analysis.json"
OUTPUT_DIR = "./anki-notes/export"

TIERS = [
    ("core",   "20+",  "01", lambda c: c >= 20),
    ("medium", "6-19", "02", lambda c: 6 <= c <= 19),
    ("rare",   "2-5",  "03", lambda c: 2 <= c <= 5),
    ("hapax",  "1",    "04", lambda c: c == 1),
]

HEADERS = [
    "sentence",
    "Sentence Furigana", 
    "Sentence Translation",
    "Sentence TTS",
    "Term",
    "Reading",
    "Meaning",
    "Notes",
    "Notes Audio",
    "Notes Translation",
    "Image",
    "audio",
    "Pitch Accent",
    "Furigana",
    "Expanded Meaning",
    "Collapsed Meaning",
    "Url",
    "cloze-body",
    "cloze-body-kana",
    "cloze-prefix",
    "close-suffix",
    "conjugation",
    "expression",
    "frequencies",
    "Tags",
]


def load_dictionary(dict_path: str) -> dict:
    """Load all term banks into a lowercased word → list of entries index."""
    bank_files = sorted(glob.glob(os.path.join(dict_path, "term_bank_*.json")))
    if not bank_files:
        print(f"  WARNING: No term banks found in {dict_path}", file=sys.stderr)
        return {}
    print(f"  Loading dictionary ({len(bank_files)} banks)...", end="", flush=True)
    index: dict[str, list] = {}
    total_entries = 0
    for bank_file in bank_files:
        with open(bank_file, encoding="utf-8") as f:
            bank = json.load(f)
        for entry in bank:
            term = entry[0].lower()
            if term not in index:
                index[term] = []
            index[term].append(entry)
            total_entries += 1
    print(f" {len(index):,} words ({total_entries:,} entries) loaded.")
    return index


def sc_to_html(node) -> str:
    """Recursively convert Yomitan structured-content JSON → HTML."""
    if node is None:
        return ""
    if isinstance(node, str):
        return node.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    if isinstance(node, list):
        return "".join(sc_to_html(c) for c in node)
    if isinstance(node, dict):
        if node.get("type") == "structured-content":
            return sc_to_html(node.get("content", ""))

        tag = node.get("tag", "")
        inner = sc_to_html(node.get("content", ""))

        if not tag:
            return inner

        attrs = ""

        href = node.get("href", "")
        if href:
            if href.startswith("?query="):
                attrs += f' href="#{href[7:]}"'
            else:
                attrs += f' href="{href}"'

        if "title" in node:
            attrs += f' title="{node["title"]}"'

        data = node.get("data", {})
        for k, v in data.items():
            attrs += f' data-sc-{k}="{v}"'

        style = node.get("style", {})
        if isinstance(style, dict) and style:
            style_str = "; ".join(f"{k}: {v}" for k, v in style.items())
            attrs += f' style="{style_str}"'

        if tag in ("br", "hr", "img"):
            return f"<{tag}{attrs}/>"

        return f"<{tag}{attrs}>{inner}</{tag}>"
    return ""


def definition_to_html(entries: list) -> str:
    """Convert multiple dictionary entries' definitions into a single yomitan-glossary HTML block."""
    dict_name = "Universal (De-Ru)"
    items_html = ""

    for entry in entries:
        definitions = entry[5] if len(entry) > 5 else []
        for defn in definitions:
            if isinstance(defn, dict):
                inner = sc_to_html(defn)
                items_html += f'<li data-dictionary="{dict_name}"><span>{inner}</span></li>'
            elif isinstance(defn, str):
                items_html += f'<li data-dictionary="{dict_name}"><span>{defn}</span></li>'

    if not items_html:
        return ""

    return (
        f'<div style="text-align: left;" class="yomitan-glossary">'
        f"<ol>{items_html}</ol></div>"
    )


def lookup_word(stem: str, dict_index: dict) -> Optional[str]:
    """Try several lookup strategies and return HTML with all definitions, or None."""
    candidates = [
        stem.lower(),
        stem.lower().rstrip("n"),
        stem.lower().rstrip("en"),
    ]
    for c in candidates:
        if c and c in dict_index:
            return definition_to_html(dict_index[c])
    return None


def compute_stats(vocab: list) -> tuple[dict, int]:
    """Return per-tier stats dict and total token count."""
    total_tokens = sum(v["totalCount"] for v in vocab)
    stats = {}
    for tier_name, tier_label, tier_num, tier_fn in TIERS:
        words = [v for v in vocab if tier_fn(v["totalCount"])]
        tokens = sum(v["totalCount"] for v in words)
        stats[tier_name] = {
            "label": tier_label,
            "number": tier_num,
            "words": words,
            "word_count": len(words),
            "tokens": tokens,
            "pct": tokens / total_tokens * 100 if total_tokens else 0.0,
        }
    return stats, total_tokens


def print_stats(meta: dict, stats: dict, total_tokens: int):
    """Print frequency tier statistics table."""
    source = os.path.basename(meta.get("source", "unknown"))
    total_words_raw = meta.get("totalWords", "?")
    total_unique = meta.get("totalUniqueStems", "?")

    print()
    print("=" *65)
    print(f"  Source : {source}")
    print(f"  Raw word count   : {total_words_raw:,}" if isinstance(total_words_raw, int) else f"  Raw word count   : {total_words_raw}")
    print(f"  Unique lemmas    : {total_unique:,}" if isinstance(total_unique, int) else f"  Unique lemmas    : {total_unique}")
    print(f"  Tokens (counted) : {total_tokens:,}")
    print()
    print(f"  {'Tier':<8}  {'Unique words':>13}  {'Token count':>12}  {'% of text':>10}  Coverage bar")
    print("  " + "-" * 62)
    for tier_name, tier_label, tier_num, _ in TIERS:
        s = stats[tier_name]
        pct = s["pct"]
        bar = "█" * int(pct / 2)
        print(f"  {tier_label:<8}  {s['word_count']:>13,}  {s['tokens']:>12,}  {pct:>9.1f}%  {bar}")
    print("=" *65)
    print()


def make_cloze(sentence: str, stem: str, display_form: str, forms: dict) -> tuple[str, str, str]:
    """
    Find any inflected form of the word in sentence and create cloze parts.
    Returns (cloze_prefix, cloze_body, cloze_suffix).
    """
    if not sentence:
        return ("", display_form, "")
    
    forms_by_freq = sorted(forms.items(), key=lambda x: x[1], reverse=True)
    search_forms = [display_form] + [f for f, _ in forms_by_freq if f != display_form]
    
    sentence_lower = sentence.lower()
    
    for form in search_forms:
        form_lower = form.lower()
        pos = sentence_lower.find(form_lower)
        
        if pos != -1:
            end_pos = pos + len(form)
            prefix = sentence[:pos]
            body = sentence[pos:end_pos]
            suffix = sentence[end_pos:]
            return (prefix, body, suffix)
    
    return ("", display_form, "")


def export_tier(tier_name: str, tier_label: str, tier_number: str, tier_words: list, dict_index: dict, output_dir: str, source_name: str) -> str:
    """Export one tier to a tab-separated file for Anki import."""
    from datetime import datetime
    
    os.makedirs(output_dir, exist_ok=True)
    
    source_base = os.path.splitext(os.path.basename(source_name))[0]
    timestamp = datetime.now().strftime("%Y-%m-%d-%H%M")
    output_path = os.path.join(output_dir, f"{source_base}_{timestamp}_{tier_number}-{tier_name}-{tier_label}.tsv")

    words_sorted = sorted(tier_words, key=lambda v: v["totalCount"], reverse=True)
    skipped_count = 0
    exported_count = 0

    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t", quotechar='"', quoting=csv.QUOTE_MINIMAL)
        
        writer.writerow(HEADERS)

        for v in words_sorted:
            stem = v["stem"]
            display = v.get("displayForm", stem)
            forms = v.get("forms", {display: 1})
            total_count = v.get("totalCount", 0)
            sentence = v.get("exampleSentence", "")

            meaning_html = lookup_word(stem, dict_index)
            if not meaning_html:
                skipped_count += 1
                continue

            exported_count += 1

            if sentence:
                cloze_prefix, cloze_body, cloze_suffix = make_cloze(sentence, stem, display, forms)
            else:
                sentence = display
                cloze_prefix, cloze_body, cloze_suffix = "", display, ""

            row = [
                sentence,
                sentence,
                "",
                "",
                stem,
                display,
                meaning_html,
                "",
                "",
                "",
                "",
                "",
                "",
                display,
                "",
                "",
                "",
                cloze_body,
                "",
                cloze_prefix,
                cloze_suffix,
                "",
                "",
                str(total_count),
                f"Tier_{tier_label}",
            ]
            writer.writerow(row)

    print(f"  Tier {tier_label:<6}  {exported_count:>5} exported  "
          f"({skipped_count} skipped, no dict match)  →  {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Anki vocabulary exporter with frequency tier analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "analysis",
        nargs="?",
        default=DEFAULT_ANALYSIS,
        help=f"Path to analysis JSON (default: {DEFAULT_ANALYSIS})",
    )
    parser.add_argument(
        "--tier",
        choices=["hapax", "rare", "medium", "core", "all"],
        default="all",
        help="Which tier(s) to export (default: all)",
    )
    parser.add_argument(
        "--dict-path",
        default=DICT_PATH,
        help=f"Path to dictionary folder (default: {DICT_PATH})",
    )
    parser.add_argument(
        "--output-dir",
        default=OUTPUT_DIR,
        help=f"Output directory for TSV files (default: {OUTPUT_DIR})",
    )
    parser.add_argument(
        "--stats-only",
        action="store_true",
        help="Only show statistics, skip export",
    )
    args = parser.parse_args()

    if not os.path.exists(args.analysis):
        print(f"ERROR: Analysis file not found: {args.analysis}", file=sys.stderr)
        print("Available files:", file=sys.stderr)
        for f in glob.glob("./output/*.json"):
            print(f"  {f}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading: {args.analysis}")
    with open(args.analysis, encoding="utf-8") as f:
        data = json.load(f)

    meta = data["meta"]
    vocab = data["vocabulary"]

    stats, total_tokens = compute_stats(vocab)
    print_stats(meta, stats, total_tokens)

    if args.stats_only:
        return

    print("Loading dictionary...")
    dict_index = load_dictionary(args.dict_path)

    tiers_to_export = [name for name, _, _, _ in TIERS] if args.tier == "all" else [args.tier]

    print(f"\nExporting {len(tiers_to_export)} tier(s) → {args.output_dir}/")
    for tier_name in tiers_to_export:
        export_tier(
            tier_name, 
            stats[tier_name]["label"],
            stats[tier_name]["number"],
            stats[tier_name]["words"], 
            dict_index, 
            args.output_dir,
            meta.get("source", "unknown")
        )

    print("\nDone. Import the .tsv files into Anki via File → Import.")
    print("Note: In Anki, select 'Tab' as separator and ensure 'Allow HTML in fields' is checked.")


if __name__ == "__main__":
    main()