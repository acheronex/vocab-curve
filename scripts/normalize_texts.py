#!/usr/bin/env python3
"""
Normalize all texts in for-analysis/ folder.

Rules:
- Only # (title) and ## (chapters) allowed
- No empty ## sections
- 25-35 sections per file
- Combine same-author works
- Clean formatting: proper paragraphs, no unnecessary line breaks
- Poetry/songs keep their line breaks
"""

import re
import os
import sys
import glob
from html.parser import HTMLParser
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
FOR_ANALYSIS = BASE_DIR / "for-analysis"
ADDITIONAL = BASE_DIR / "additional-literature"
TMP_DIR = Path("/tmp/additional-converted")

def word_count(text: str) -> int:
    return len(text.split())

def clean_text(text: str) -> str:
    """Normalize whitespace while preserving intentional line breaks."""
    # Remove trailing whitespace on each line
    lines = [line.rstrip() for line in text.split('\n')]
    text = '\n'.join(lines)
    # Collapse 3+ newlines to 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text

def merge_sections_to_target(sections: list[tuple[str, str]], target_min=25, target_max=35) -> list[tuple[str, str]]:
    """
    Merge sections to reach target count.
    sections: list of (title, content) tuples
    Returns merged sections.
    """
    if target_min <= len(sections) <= target_max:
        return sections
    
    if len(sections) < target_min:
        # Too few sections - can't split without AI, just return as-is
        print(f"  WARNING: Only {len(sections)} sections, target is {target_min}-{target_max}")
        return sections
    
    # Too many sections - merge smallest adjacent pairs
    while len(sections) > target_max:
        # Find the pair with smallest combined word count
        min_combined = float('inf')
        min_idx = 0
        for i in range(len(sections) - 1):
            combined = word_count(sections[i][1]) + word_count(sections[i+1][1])
            if combined < min_combined:
                min_combined = combined
                min_idx = i
        
        # Merge sections[min_idx] and sections[min_idx+1]
        title1, content1 = sections[min_idx]
        title2, content2 = sections[min_idx + 1]
        merged_title = f"{title1} / {title2}"
        merged_content = f"{content1}\n\n{content2}"
        sections = sections[:min_idx] + [(merged_title, merged_content)] + sections[min_idx+2:]
    
    return sections

def remove_empty_sections(sections: list[tuple[str, str]]) -> list[tuple[str, str]]:
    """Remove sections with no actual text content."""
    result = []
    for title, content in sections:
        # Check if content has actual words (not just whitespace)
        if word_count(content.strip()) > 10:
            result.append((title, content))
        else:
            # Merge this section's title info into the next section if possible
            print(f"  Removing empty section: '{title}'")
    return result

def build_markdown(title: str, sections: list[tuple[str, str]]) -> str:
    """Build final markdown from title and sections."""
    lines = [f"# {title}\n"]
    for sec_title, sec_content in sections:
        lines.append(f"\n## {sec_title}\n")
        lines.append(sec_content.strip())
        lines.append("")
    return '\n'.join(lines)


# ============================================================
# GOETHE: Combine Lehrjahre + Wanderjahre
# ============================================================
def process_goethe():
    print("\n=== GOETHE ===")
    
    # Read both files
    with open(FOR_ANALYSIS / "goethe-wilhelm-meisters-lehrjahre.md", 'r') as f:
        lehr = f.read()
    with open(FOR_ANALYSIS / "goethe-wilhelm-meisters-wanderjahre.md", 'r') as f:
        wander = f.read()
    
    sections = []
    
    # Process Lehrjahre: 8 books, 99 chapters → combine chapters within books
    lehr_parts = re.split(r'^## ', lehr, flags=re.MULTILINE)[1:]
    
    # Group by book
    books = {}
    for part in lehr_parts:
        title = part.split('\n')[0].strip()
        content = '\n'.join(part.split('\n')[1:]).strip()
        
        if 'Bekenntnisse einer schönen Seele' in title:
            book_name = 'Lehrjahre: Bekenntnisse einer schönen Seele'
            books.setdefault(book_name, []).append(content)
        else:
            match = re.match(r'((?:Erstes|Zweites|Drittes|Viertes|Fünftes|Sechstes|Siebentes|Achtes) Buch)', title)
            if match:
                book_name = f"Lehrjahre: {match.group(1)}"
                books.setdefault(book_name, []).append(content)
    
    for book_name, chapters in books.items():
        combined = '\n\n'.join(chapters)
        sections.append((book_name, combined))
    
    # Process Wanderjahre: 3 books, 44 chapters
    wander_parts = re.split(r'^## ', wander, flags=re.MULTILINE)[1:]
    
    wander_books = {}
    current_book = None
    for part in wander_parts:
        title = part.split('\n')[0].strip()
        content = '\n'.join(part.split('\n')[1:]).strip()
        
        # Check if this is a book header (empty content)
        if re.match(r'(Erstes|Zweites|Drittes) Buch$', title):
            current_book = title
            continue
        
        if current_book:
            book_key = f"Wanderjahre: {current_book}"
        else:
            # Extract book from chapter title
            match = re.match(r'((?:Erstes|Zweites|Drittes) Buch)', title)
            if match:
                book_key = f"Wanderjahre: {match.group(1)}"
            else:
                book_key = f"Wanderjahre: Unbekannt"
        
        wander_books.setdefault(book_key, []).append(content)
    
    for book_name, chapters in wander_books.items():
        combined = '\n\n'.join(chapters)
        sections.append((book_name, combined))
    
    # Remove empty sections
    sections = remove_empty_sections(sections)
    
    # We should have ~11 sections (8 Lehrjahre books + 3 Wanderjahre books)
    # Need to split the larger ones to reach 25-35
    final_sections = []
    for title, content in sections:
        wc = word_count(content)
        if wc > 15000:
            # Split this section roughly in half by finding paragraph breaks
            paragraphs = content.split('\n\n')
            mid_words = wc // 2
            running = 0
            split_idx = 0
            for i, p in enumerate(paragraphs):
                running += word_count(p)
                if running >= mid_words:
                    split_idx = i
                    break
            
            if wc > 30000:
                # Split into thirds
                third = wc // 3
                running = 0
                splits = []
                for i, p in enumerate(paragraphs):
                    running += word_count(p)
                    if running >= third and len(splits) < 2:
                        splits.append(i)
                        running = 0
                
                if len(splits) == 2:
                    part1 = '\n\n'.join(paragraphs[:splits[0]+1])
                    part2 = '\n\n'.join(paragraphs[splits[0]+1:splits[1]+1])
                    part3 = '\n\n'.join(paragraphs[splits[1]+1:])
                    final_sections.append((f"{title}, Teil 1", part1))
                    final_sections.append((f"{title}, Teil 2", part2))
                    final_sections.append((f"{title}, Teil 3", part3))
                else:
                    part1 = '\n\n'.join(paragraphs[:split_idx+1])
                    part2 = '\n\n'.join(paragraphs[split_idx+1:])
                    final_sections.append((f"{title}, Teil 1", part1))
                    final_sections.append((f"{title}, Teil 2", part2))
            else:
                part1 = '\n\n'.join(paragraphs[:split_idx+1])
                part2 = '\n\n'.join(paragraphs[split_idx+1:])
                final_sections.append((f"{title}, Teil 1", part1))
                final_sections.append((f"{title}, Teil 2", part2))
        else:
            final_sections.append((title, content))
    
    # Remove any empty sections
    final_sections = [(t, c) for t, c in final_sections if word_count(c) > 10]
    
    result = build_markdown("Goethe: Wilhelm Meisters Lehr- und Wanderjahre", final_sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "goethe-gesammelte-werke.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(final_sections)}")
    print(f"  Words: {word_count(result)}")
    for t, c in final_sections:
        print(f"    {t}: {word_count(c)} words")


# ============================================================
# FONTANE: Combine Effi Briest + Der Stechlin
# ============================================================
def process_fontane():
    print("\n=== FONTANE ===")
    
    with open(FOR_ANALYSIS / "fontane-effi-briest.md", 'r') as f:
        effi = f.read()
    with open(FOR_ANALYSIS / "fontane-der-stechlin.md", 'r') as f:
        stechlin = f.read()
    
    sections = []
    
    # Effi Briest: 36 chapters → group into ~15 sections of 2-3 chapters each
    effi_parts = re.split(r'^## ', effi, flags=re.MULTILINE)[1:]
    effi_chapters = []
    for part in effi_parts:
        title = part.split('\n')[0].strip()
        content = '\n'.join(part.split('\n')[1:]).strip()
        effi_chapters.append((title, content))
    
    # Group every 3 chapters
    group_size = 3
    for i in range(0, len(effi_chapters), group_size):
        group = effi_chapters[i:i+group_size]
        if len(group) == 1:
            t, c = group[0]
            sections.append((f"Effi Briest: {t}", c))
        else:
            titles = [t for t, c in group]
            # Extract chapter numbers
            first_num = titles[0].replace('Kapitel', '').strip()
            last_num = titles[-1].replace('Kapitel', '').strip()
            combined_content = '\n\n'.join(c for _, c in group)
            sections.append((f"Effi Briest: Kapitel {first_num}–{last_num}", combined_content))
    
    # Der Stechlin: 46 chapters → group into ~15 sections of 3 chapters each
    stechlin_parts = re.split(r'^## ', stechlin, flags=re.MULTILINE)[1:]
    stechlin_chapters = []
    for part in stechlin_parts:
        title = part.split('\n')[0].strip()
        content = '\n'.join(part.split('\n')[1:]).strip()
        stechlin_chapters.append((title, content))
    
    group_size = 3
    for i in range(0, len(stechlin_chapters), group_size):
        group = stechlin_chapters[i:i+group_size]
        if len(group) == 1:
            t, c = group[0]
            sections.append((f"Der Stechlin: {t}", c))
        else:
            titles = [t for t, c in group]
            first_num = titles[0].replace('Kapitel', '').strip()
            last_num = titles[-1].replace('Kapitel', '').strip()
            combined_content = '\n\n'.join(c for _, c in group)
            sections.append((f"Der Stechlin: Kapitel {first_num}–{last_num}", combined_content))
    
    sections = remove_empty_sections(sections)
    
    result = build_markdown("Fontane: Effi Briest / Der Stechlin", sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "fontane-gesammelte-werke.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(sections)}")
    print(f"  Words: {word_count(result)}")


# ============================================================
# KARL MAY: Combine Wüste + Kurdistan
# ============================================================
def process_karl_may():
    print("\n=== KARL MAY ===")
    
    with open(FOR_ANALYSIS / "karl-may-durch-wueste-und-harem.md", 'r') as f:
        wueste = f.read()
    with open(FOR_ANALYSIS / "karl-may-durchs-wilde-kurdistan.md", 'r') as f:
        kurdistan = f.read()
    
    sections = []
    
    # Wüste: 12 chapters + 1 Vorwort = 13 sections
    wueste_parts = re.split(r'^## ', wueste, flags=re.MULTILINE)[1:]
    for part in wueste_parts:
        title = part.split('\n')[0].strip()
        content = '\n'.join(part.split('\n')[1:]).strip()
        if word_count(content) > 10:
            sections.append((f"Durch Wüste und Harem: {title}", content))
    
    # Kurdistan: 7 chapters
    kurdistan_parts = re.split(r'^## ', kurdistan, flags=re.MULTILINE)[1:]
    for part in kurdistan_parts:
        title = part.split('\n')[0].strip()
        content = '\n'.join(part.split('\n')[1:]).strip()
        if word_count(content) > 10:
            sections.append((f"Durchs wilde Kurdistan: {title}", content))
    
    # Total: ~20 sections. Some Kurdistan chapters are very long (20K+ words).
    # Split chapters over 15000 words
    final_sections = []
    for title, content in sections:
        wc = word_count(content)
        if wc > 15000:
            paragraphs = content.split('\n\n')
            mid = wc // 2
            running = 0
            split_idx = 0
            for i, p in enumerate(paragraphs):
                running += word_count(p)
                if running >= mid:
                    split_idx = i
                    break
            part1 = '\n\n'.join(paragraphs[:split_idx+1])
            part2 = '\n\n'.join(paragraphs[split_idx+1:])
            final_sections.append((f"{title}, Teil 1", part1))
            final_sections.append((f"{title}, Teil 2", part2))
        else:
            final_sections.append((title, content))
    
    final_sections = remove_empty_sections(final_sections)
    
    result = build_markdown("Karl May: Orientzyklus", final_sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "karl-may-orientzyklus.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(final_sections)}")
    print(f"  Words: {word_count(result)}")


# ============================================================
# BUDDENBROOKS: Restructure 11 → 25-35 sections
# ============================================================
def process_buddenbrooks():
    print("\n=== BUDDENBROOKS ===")
    
    with open(FOR_ANALYSIS / "thomas-mann-buddenbrooks.md", 'r') as f:
        content = f.read()
    
    parts = re.split(r'^## ', content, flags=re.MULTILINE)[1:]
    
    # 11 parts (Teile), each 15-30K words. Split each into 2-3 subsections.
    final_sections = []
    ordinals = {
        'Erster': 1, 'Zweiter': 2, 'Dritter': 3, 'Vierter': 4,
        'Fünfter': 5, 'Sechster': 6, 'Siebenter': 7, 'Achter': 8,
        'Neunter': 9, 'Zehnter': 10, 'Elfter': 11
    }
    
    for part in parts:
        title = part.split('\n')[0].strip()
        text = '\n'.join(part.split('\n')[1:]).strip()
        wc = word_count(text)
        
        # Extract part number
        part_num = title.replace('Teil', '').strip()
        for name, num in ordinals.items():
            if name in title:
                part_num = str(num)
                break
        
        if wc > 25000:
            # Split into 3
            paragraphs = text.split('\n\n')
            third = wc // 3
            running = 0
            splits = []
            for i, p in enumerate(paragraphs):
                running += word_count(p)
                if running >= third and len(splits) < 2:
                    splits.append(i)
                    running = 0
            
            if len(splits) == 2:
                p1 = '\n\n'.join(paragraphs[:splits[0]+1])
                p2 = '\n\n'.join(paragraphs[splits[0]+1:splits[1]+1])
                p3 = '\n\n'.join(paragraphs[splits[1]+1:])
                final_sections.append((f"Teil {part_num}, Abschnitt 1", p1))
                final_sections.append((f"Teil {part_num}, Abschnitt 2", p2))
                final_sections.append((f"Teil {part_num}, Abschnitt 3", p3))
            else:
                mid = wc // 2
                running = 0
                split_idx = len(paragraphs) // 2
                for i, p in enumerate(paragraphs):
                    running += word_count(p)
                    if running >= mid:
                        split_idx = i
                        break
                p1 = '\n\n'.join(paragraphs[:split_idx+1])
                p2 = '\n\n'.join(paragraphs[split_idx+1:])
                final_sections.append((f"Teil {part_num}, Abschnitt 1", p1))
                final_sections.append((f"Teil {part_num}, Abschnitt 2", p2))
        elif wc > 15000:
            # Split into 2
            paragraphs = text.split('\n\n')
            mid = wc // 2
            running = 0
            split_idx = len(paragraphs) // 2
            for i, p in enumerate(paragraphs):
                running += word_count(p)
                if running >= mid:
                    split_idx = i
                    break
            p1 = '\n\n'.join(paragraphs[:split_idx+1])
            p2 = '\n\n'.join(paragraphs[split_idx+1:])
            final_sections.append((f"Teil {part_num}, Abschnitt 1", p1))
            final_sections.append((f"Teil {part_num}, Abschnitt 2", p2))
        else:
            final_sections.append((f"Teil {part_num}", text))
    
    final_sections = remove_empty_sections(final_sections)
    
    result = build_markdown("Thomas Mann: Buddenbrooks", final_sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "thomas-mann-buddenbrooks.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(final_sections)}")
    print(f"  Words: {word_count(result)}")


# ============================================================
# KANT: Fix broken empty sections
# ============================================================
def process_kant():
    print("\n=== KANT ===")
    
    with open(FOR_ANALYSIS / "kant-kritik-der-reinen-vernunft.md", 'r') as f:
        content = f.read()
    
    parts = re.split(r'^## ', content, flags=re.MULTILINE)[1:]
    
    sections = []
    pending_prefix = ""
    
    for part in parts:
        title = part.split('\n')[0].strip()
        text = '\n'.join(part.split('\n')[1:]).strip()
        
        if word_count(text) <= 10:
            # Empty section — accumulate its title as prefix
            if pending_prefix:
                pending_prefix += " — " + title
            else:
                pending_prefix = title
        else:
            if pending_prefix:
                full_title = f"{pending_prefix} — {title}"
                pending_prefix = ""
            else:
                full_title = title
            # Truncate very long titles
            if len(full_title) > 100:
                full_title = full_title[:97] + "..."
            sections.append((full_title, text))
    
    # Now merge sections to reach 25-35 target
    # Currently we might have ~45 non-empty sections
    # Merge smallest adjacent sections
    sections = merge_sections_to_target(sections, 25, 35)
    sections = remove_empty_sections(sections)
    
    result = build_markdown("Kant: Kritik der reinen Vernunft", sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "kant-kritik-der-reinen-vernunft.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(sections)}")
    print(f"  Words: {word_count(result)}")


# ============================================================
# KAFKA: Process from extracted HTML
# ============================================================
class KafkaHTMLExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.in_body = False
        self.skip_tags = {'style', 'script', 'svg', 'image'}
        self.skip_depth = 0
        
    def handle_starttag(self, tag, attrs):
        if tag == 'body':
            self.in_body = True
        if tag in self.skip_tags:
            self.skip_depth += 1
        if self.in_body and self.skip_depth == 0:
            if tag == 'p':
                self.text_parts.append('\n\n')
            elif tag == 'br':
                self.text_parts.append('\n')
            
    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.skip_depth -= 1
            
    def handle_data(self, data):
        if self.in_body and self.skip_depth == 0:
            self.text_parts.append(data)
            
    def get_text(self):
        return ''.join(self.text_parts)


def process_kafka():
    print("\n=== KAFKA ===")
    
    kafka_dir = TMP_DIR / "kafka-src" / "Kafka, Franz - Gesammelte Werke (Vollständige und illustrierte Ausgaben_ Die Verwandlung, Das Urteil, Der Prozess u.v.m.) (German Edition) (2016) - libgen.li_markup"
    
    if not kafka_dir.exists():
        print("  ERROR: Kafka source directory not found. Run mobitool extraction first.")
        return
    
    # Extract text from each HTML file
    html_files = sorted(kafka_dir.glob('part*.html'))
    
    all_parts = []
    for f in html_files:
        with open(f, 'rb') as fh:
            raw = fh.read()
        html_content = raw.decode('utf-8', errors='replace').replace('\ufffd', '')
        
        parser = KafkaHTMLExtractor()
        parser.feed(html_content)
        text = parser.get_text().strip()
        if text:
            all_parts.append(text)
    
    full_text = '\n\n'.join(all_parts)
    
    # Clean up the TOC and extract work structure from the known Kafka TOC
    works = {
        'Die Verwandlung': None,
        'Amerika': None,
        'Das Schloß': None,
        'Der Prozeß': None,
        'Blumfeld, ein älterer Junggeselle': None,
        'Das Urteil': None,
        'Der Bau': None,
        'Der Gruftwächter': None,
        'In der Strafkolonie': None,
        'Kleine Fabel': None,
        'Erzählungen': None,
        'Betrachtungen über Sünde, Leid, Hoffnung und den wahren Weg': None,
        'Er': None,
        'Brief an den Vater': None,
        'Briefe an Max Brod': None,
        'Briefe an Ottla und die Familie': None,
        'Briefe an Felice': None,
        'Briefe an Milena': None,
        'Tagebücher': None,
    }
    
    # Find work boundaries by searching for their titles after the TOC
    # Skip the TOC (first ~700 lines / first occurrence of "Die Verwandlung" as text)
    toc_end = full_text.find('\nDie Verwandlung\n')
    if toc_end == -1:
        toc_end = full_text.find('Die Verwandlung')
    
    # After TOC, the actual text of Verwandlung starts  
    # Find the second occurrence of "Die Verwandlung" followed by "Als Gregor Samsa"
    verwandlung_start = full_text.find('Als Gregor Samsa')
    if verwandlung_start > 0:
        # Search backwards from here for the title
        search_region = full_text[max(0, verwandlung_start-500):verwandlung_start]
        title_pos = search_region.rfind('Die Verwandlung')
        if title_pos >= 0:
            text_start = max(0, verwandlung_start-500) + title_pos
        else:
            text_start = verwandlung_start
    else:
        text_start = 0
    
    main_text = full_text[text_start:]
    
    # Define the major works and their approximate start markers
    work_markers = [
        ('Die Verwandlung', 'Als Gregor Samsa eines Morgens'),
        ('Amerika', 'Als der sechzehnjährige Karl Roßmann'),
        ('Das Schloß', 'Es war spät abends, als K. ankam'),
        ('Der Prozeß', 'Jemand mußte Josef K. verleumdet haben'),
        ('Blumfeld, ein älterer Junggeselle', 'Eines Abends hatte Blumfeld'),
        ('Das Urteil', 'Es war an einem Sonntagvormittag'),
        ('Der Bau', 'Ich habe den Bau eingerichtet'),
        ('In der Strafkolonie', 'Es ist ein eigentümlicher Apparat'),
        ('Erzählungen und kurze Prosa', 'Der Schlag ans Hoftor'),
        ('Betrachtungen über Sünde', 'Betrachtungen über Sünde'),
        ('Brief an den Vater', 'Liebster Vater'),
        ('Briefe', 'Briefe an Max Brod'),
        ('Tagebücher', 'Tagebücher 1910'),
    ]
    
    # Split text into major works
    found_works = []
    for i, (title, marker) in enumerate(work_markers):
        pos = main_text.find(marker)
        if pos >= 0:
            found_works.append((title, pos))
    
    # Sort by position
    found_works.sort(key=lambda x: x[1])
    
    # Extract each work's text
    sections = []
    for i, (title, start) in enumerate(found_works):
        if i + 1 < len(found_works):
            end = found_works[i+1][1]
        else:
            end = len(main_text)
        work_text = main_text[start:end].strip()
        wc = word_count(work_text)
        
        if wc > 30000:
            # Split large works (Amerika ~120K, Das Schloß ~110K, Der Prozeß ~85K)
            paragraphs = work_text.split('\n\n')
            n_parts = max(2, wc // 25000)
            chunk_size = wc // n_parts
            
            running = 0
            current_paras = []
            part_num = 1
            
            for p in paragraphs:
                current_paras.append(p)
                running += word_count(p)
                if running >= chunk_size and part_num < n_parts:
                    sections.append((f"{title}, Teil {part_num}", '\n\n'.join(current_paras)))
                    current_paras = []
                    running = 0
                    part_num += 1
            
            if current_paras:
                sections.append((f"{title}, Teil {part_num}", '\n\n'.join(current_paras)))
        elif wc > 100:
            sections.append((title, work_text))
    
    sections = remove_empty_sections(sections)
    
    # If we still have too many or too few, adjust
    if len(sections) > 35:
        sections = merge_sections_to_target(sections, 25, 35)
    
    result = build_markdown("Kafka: Gesammelte Werke", sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "kafka-gesammelte-werke.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(sections)}")
    print(f"  Words: {word_count(result)}")
    for t, c in sections:
        print(f"    {t}: {word_count(c)} words")


# ============================================================
# FREUD: Process from epub conversion
# ============================================================
def process_freud():
    print("\n=== FREUD ===")
    
    freud_md = TMP_DIR / "freud.md"
    if not freud_md.exists():
        print("  ERROR: Freud markdown not found. Run pandoc conversion first.")
        return
    
    with open(freud_md, 'r') as f:
        content = f.read()
    
    # Strip calibre/epub markup artifacts
    content = re.sub(r'\{[^}]*\}', '', content)
    content = re.sub(r'\[?\]\([^)]*\)', '', content)
    content = re.sub(r'\*\*I\[NHALT\]\{\.small\}\*\*', '', content)
    
    # Known Freud works in this collection
    work_markers = [
        ('Die Traumdeutung', 'Die Traumdeutung'),
        ('Der Witz und seine Beziehung zum Unbewußten', 'Der Witz und seine Beziehung'),
        ('Totem und Tabu', 'Totem und Tabu'),
        ('Massenpsychologie und Ich-Analyse', 'Massenpsychologie'),
        ('Das Ich und das Es', 'Das Ich und das Es'),
        ('Das Unbehagen in der Kultur', 'Das Unbehagen in der Kultur'),
        ('Abriss der Psychoanalyse', 'Abriss der Psychoanalyse'),
    ]
    
    # Find each work's position
    found_works = []
    for title, marker in work_markers:
        # Find the marker that appears as a section header (after ## line)
        pattern = re.compile(r'^##.*?' + re.escape(marker[:20]), re.MULTILINE)
        match = pattern.search(content)
        if match:
            found_works.append((title, match.start()))
        else:
            # Try plain text
            pos = content.find(marker)
            if pos > 0:
                found_works.append((title, pos))
    
    found_works.sort(key=lambda x: x[1])
    
    # Extract each work
    sections = []
    for i, (title, start) in enumerate(found_works):
        if i + 1 < len(found_works):
            end = found_works[i+1][1]
        else:
            # Find end - look for Quellenverzeichnis or end of file
            quellen = content.find('Quellenverzeichnis', start)
            end = quellen if quellen > 0 else len(content)
        
        work_text = content[start:end].strip()
        # Clean markdown artifacts
        work_text = re.sub(r'^#+\s+.*$', '', work_text, flags=re.MULTILINE)  # Remove existing headers
        work_text = re.sub(r'\{[^}]*\}', '', work_text)
        work_text = re.sub(r'\[\]\([^)]*\)', '', work_text)
        work_text = re.sub(r'\[([^\]]*)\]\{[^}]*\}', r'\1', work_text)
        work_text = re.sub(r'\n{3,}', '\n\n', work_text)
        work_text = work_text.strip()
        
        wc = word_count(work_text)
        
        if wc > 15000:
            paragraphs = work_text.split('\n\n')
            n_parts = max(2, wc // 14000)
            chunk_size = wc // n_parts
            
            running = 0
            current_paras = []
            part_num = 1
            
            for p in paragraphs:
                current_paras.append(p)
                running += word_count(p)
                if running >= chunk_size and part_num < n_parts:
                    sections.append((f"{title}, Teil {part_num}", '\n\n'.join(current_paras)))
                    current_paras = []
                    running = 0
                    part_num += 1
            
            if current_paras:
                sections.append((f"{title}, Teil {part_num}", '\n\n'.join(current_paras)))
        elif wc > 500:
            sections.append((title, work_text))
    
    sections = remove_empty_sections(sections)
    
    if len(sections) > 35:
        sections = merge_sections_to_target(sections, 25, 35)
    
    result = build_markdown("Freud: Gesammelte Werke", sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "freud-gesammelte-werke.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(sections)}")
    print(f"  Words: {word_count(result)}")
    for t, c in sections:
        print(f"    {t}: {word_count(c)} words")


# ============================================================
# SCHOPENHAUER: Combine Wille + Parerga
# ============================================================
def process_schopenhauer():
    print("\n=== SCHOPENHAUER ===")
    
    wille_md = TMP_DIR / "schopenhauer-wille.md"
    parerga_md = TMP_DIR / "schopenhauer-parerga.md"
    
    if not wille_md.exists() or not parerga_md.exists():
        print("  ERROR: Schopenhauer markdown files not found.")
        return
    
    with open(wille_md, 'r') as f:
        wille = f.read()
    with open(parerga_md, 'r') as f:
        parerga = f.read()
    
    # Clean calibre markup
    for text_ref in [wille, parerga]:
        pass
    
    def clean_epub_markup(text):
        text = re.sub(r'\{[^}]*\}', '', text)
        text = re.sub(r'\[\]\([^)]*\)', '', text)
        text = re.sub(r'\[([^\]]*)\]\{[^}]*\}', r'\1', text)
        text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text
    
    wille = clean_epub_markup(wille)
    parerga = clean_epub_markup(parerga)
    
    # Wille und Vorstellung has these major sections from our earlier analysis:
    # Erstes Buch, Zweites Buch, Drittes Buch, Viertes Buch, Anhang (Kantische Philosophie)
    # Zweiter Band: Ergänzungen 1-4
    wille_section_markers = [
        ('Die Welt als Wille und Vorstellung: Erstes Buch', 'Erstes Buch. Der Welt als Vorstellung erste Betrachtung'),
        ('Die Welt als Wille und Vorstellung: Zweites Buch', 'Zweites Buch. Der Welt als Wille erste Betrachtung'),
        ('Die Welt als Wille und Vorstellung: Drittes Buch', 'Drittes Buch. Der Welt als Vorstellung zweite Betrachtung'),
        ('Die Welt als Wille und Vorstellung: Viertes Buch', 'Viertes Buch. Der Welt als Wille zweite Betrachtung'),
        ('Die Welt als Wille und Vorstellung: Kritik der Kantischen Philosophie', 'Anhang. Kritik der Kantischen Philosophie'),
        ('Die Welt als Wille und Vorstellung: Ergänzungen zum ersten Buch', 'Ergänzungen zum ersten Buch'),
        ('Die Welt als Wille und Vorstellung: Ergänzungen zum zweiten Buch', 'Ergänzungen zum zweiten Buch'),
        ('Die Welt als Wille und Vorstellung: Ergänzungen zum dritten Buch', 'Ergänzungen zum dritten Buch'),
        ('Die Welt als Wille und Vorstellung: Ergänzungen zum vierten Buch', 'Ergänzungen zum vierten Buch'),
    ]
    
    sections = []
    
    # Extract Wille sections
    found_wille = []
    for title, marker in wille_section_markers:
        pos = wille.find(marker)
        if pos >= 0:
            found_wille.append((title, pos))
    
    found_wille.sort(key=lambda x: x[1])
    
    for i, (title, start) in enumerate(found_wille):
        if i + 1 < len(found_wille):
            end = found_wille[i+1][1]
        else:
            end = len(wille)
        work_text = wille[start:end].strip()
        # Remove existing headers
        work_text = re.sub(r'^#+\s+.*$', '', work_text, flags=re.MULTILINE)
        work_text = re.sub(r'\n{3,}', '\n\n', work_text).strip()
        
        wc = word_count(work_text)
        if wc > 30000:
            paragraphs = work_text.split('\n\n')
            mid = wc // 2
            running = 0
            split_idx = len(paragraphs) // 2
            for j, p in enumerate(paragraphs):
                running += word_count(p)
                if running >= mid:
                    split_idx = j
                    break
            p1 = '\n\n'.join(paragraphs[:split_idx+1])
            p2 = '\n\n'.join(paragraphs[split_idx+1:])
            sections.append((f"{title}, Teil 1", p1))
            sections.append((f"{title}, Teil 2", p2))
        elif wc > 500:
            sections.append((title, work_text))
    
    # Extract Parerga sections
    # Parerga has: Skitze einer Geschichte, Fragmente zur Geschichte der Philosophie,
    # Ueber die Universitäts Philosophie, Transscendente Spekulation, Aphorismen,
    # and Band 2 topics
    parerga_marker_searches = [
        ('Parerga: Vorwort', 'Vorwort zur ersten Auflage'),
        ('Parerga: Geschichte der Lehre vom Idealen und Realen', 'Skitze einer Geschichte der Lehre'),
        ('Parerga: Fragmente zur Geschichte der Philosophie', 'Fragmente zur Geschichte der Philosophie'),
        ('Parerga: Über die Universitäts-Philosophie', 'Ueber die Universitäts'),
        ('Parerga: Transzendente Spekulation', 'Transscendente Spekulation'),
        ('Parerga: Aphorismen zur Lebensweisheit', 'Aphorismen zur Lebensweisheit'),
    ]
    
    found_parerga = []
    for title, marker in parerga_marker_searches:
        pos = parerga.find(marker)
        if pos >= 0:
            found_parerga.append((title, pos))
    
    found_parerga.sort(key=lambda x: x[1])
    
    for i, (title, start) in enumerate(found_parerga):
        if i + 1 < len(found_parerga):
            end = found_parerga[i+1][1]
        else:
            end = len(parerga)
        work_text = parerga[start:end].strip()
        work_text = re.sub(r'^#+\s+.*$', '', work_text, flags=re.MULTILINE)
        work_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', work_text)  # Remove bold markers
        work_text = re.sub(r'\n{3,}', '\n\n', work_text).strip()
        
        wc = word_count(work_text)
        if wc > 40000:
            paragraphs = work_text.split('\n\n')
            n_parts = max(2, wc // 25000)
            chunk_size = wc // n_parts
            running = 0
            current_paras = []
            part_num = 1
            for p in paragraphs:
                current_paras.append(p)
                running += word_count(p)
                if running >= chunk_size and part_num < n_parts:
                    sections.append((f"{title}, Teil {part_num}", '\n\n'.join(current_paras)))
                    current_paras = []
                    running = 0
                    part_num += 1
            if current_paras:
                sections.append((f"{title}, Teil {part_num}", '\n\n'.join(current_paras)))
        elif wc > 500:
            sections.append((title, work_text))
    
    sections = remove_empty_sections(sections)
    
    if len(sections) > 35:
        sections = merge_sections_to_target(sections, 25, 35)
    
    result = build_markdown("Schopenhauer: Gesammelte Werke", sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "schopenhauer-gesammelte-werke.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(sections)}")
    print(f"  Words: {word_count(result)}")
    for t, c in sections:
        print(f"    {t}: {word_count(c)} words")


# ============================================================
# GRIMM: Combine Märchen (full epub) + Sagen
# ============================================================
def process_grimm():
    print("\n=== GRIMM ===")
    
    # Use the full Märchen from epub (347K words, 200+ tales)
    # Plus Sagen (199K words)
    maerchen_md = TMP_DIR / "grimm-maerchen-full.md"
    sagen_md = TMP_DIR / "grimm-sagen.md"
    
    if not maerchen_md.exists():
        print("  ERROR: Grimm Märchen full markdown not found.")
        return
    
    with open(maerchen_md, 'r') as f:
        maerchen = f.read()
    
    with open(sagen_md, 'r') as f:
        sagen = f.read()
    
    # Clean epub markup
    def clean_epub(text):
        text = re.sub(r'\{[^}]*\}', '', text)
        text = re.sub(r'\[\]\([^)]*\)', '', text)
        text = re.sub(r'\[([^\]]*)\]\{[^}]*\}', r'\1', text)
        text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
        text = re.sub(r'!\[.*?\]\(.*?\)', '', text)  # Remove images
        text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
        text = re.sub(r'`[^`]*`', '', text)  # Remove code
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text
    
    maerchen = clean_epub(maerchen)
    sagen = clean_epub(sagen)
    
    # For Märchen: find all tale titles (# headers in the epub conversion)
    # Group tales into sections of ~20K words each
    maerchen_tales = re.split(r'^# ', maerchen, flags=re.MULTILINE)
    
    # Skip preamble (TOC, prefaces etc)
    # Find first actual tale
    tale_start = 0
    tale_keywords = ['Froschkönig', 'Katz und Maus', 'Marienkind', 'Schneewittchen']
    for i, tale in enumerate(maerchen_tales):
        first_line = tale.split('\n')[0].strip()
        for kw in tale_keywords:
            if kw in first_line:
                tale_start = i
                break
        if tale_start > 0:
            break
    
    actual_tales = maerchen_tales[tale_start:]
    
    # Group tales into chunks of ~20K words
    maerchen_sections = []
    current_tales = []
    current_words = 0
    chunk_num = 1
    target_chunk = 20000
    
    for tale in actual_tales:
        lines = tale.split('\n')
        title = lines[0].strip() if lines else 'Unbekannt'
        text = '\n'.join(lines[1:]).strip()
        wc = word_count(text)
        
        if wc < 50:  # Skip empty/tiny entries
            continue
        
        current_tales.append(text)
        current_words += wc
        
        if current_words >= target_chunk:
            combined = '\n\n'.join(current_tales)
            maerchen_sections.append((f"Märchen, Sammlung {chunk_num}", combined))
            current_tales = []
            current_words = 0
            chunk_num += 1
    
    if current_tales:
        combined = '\n\n'.join(current_tales)
        maerchen_sections.append((f"Märchen, Sammlung {chunk_num}", combined))
    
    # Process Sagen: no headers, but tales are separated by numbers or titles
    # The Sagen text has tales as continuous text with numbers like "1.", "2.", etc.
    # Let's split by blank-line-separated sections and group
    sagen_paragraphs = [p.strip() for p in sagen.split('\n\n') if p.strip()]
    
    # Skip preamble (publisher info, title pages etc.)
    # Find where actual sagen content starts (after "Vorrede" or similar)
    sagen_start = 0
    for i, p in enumerate(sagen_paragraphs):
        if 'Vorrede' in p or len(p) > 500:
            if len(p) > 500:
                sagen_start = i
                break
    
    sagen_text = '\n\n'.join(sagen_paragraphs[sagen_start:])
    sagen_wc = word_count(sagen_text)
    
    # Split sagen into ~7 sections to complement märchen sections
    sagen_sections = []
    if sagen_wc > 1000:
        n_sagen_parts = max(5, sagen_wc // 25000)
        sagen_paras = sagen_text.split('\n\n')
        chunk_size = sagen_wc // n_sagen_parts
        running = 0
        current = []
        part_num = 1
        
        for p in sagen_paras:
            current.append(p)
            running += word_count(p)
            if running >= chunk_size and part_num < n_sagen_parts:
                sagen_sections.append((f"Deutsche Sagen, Sammlung {part_num}", '\n\n'.join(current)))
                current = []
                running = 0
                part_num += 1
        if current:
            sagen_sections.append((f"Deutsche Sagen, Sammlung {part_num}", '\n\n'.join(current)))
    
    # Combine
    sections = maerchen_sections + sagen_sections
    sections = remove_empty_sections(sections)
    
    if len(sections) > 35:
        sections = merge_sections_to_target(sections, 25, 35)
    
    result = build_markdown("Brüder Grimm: Märchen und Sagen", sections)
    result = clean_text(result)
    
    out_path = FOR_ANALYSIS / "grimm-gesammelte-werke.md"
    with open(out_path, 'w') as f:
        f.write(result)
    
    print(f"  Output: {out_path}")
    print(f"  Sections: {len(sections)}")
    print(f"  Words: {word_count(result)}")
    for t, c in sections:
        print(f"    {t}: {word_count(c)} words")


# ============================================================
# MAIN
# ============================================================
if __name__ == '__main__':
    targets = sys.argv[1:] if len(sys.argv) > 1 else ['all']
    
    processors = {
        'goethe': process_goethe,
        'fontane': process_fontane,
        'karl_may': process_karl_may,
        'buddenbrooks': process_buddenbrooks,
        'kant': process_kant,
        'kafka': process_kafka,
        'freud': process_freud,
        'schopenhauer': process_schopenhauer,
        'grimm': process_grimm,
    }
    
    if 'all' in targets:
        for name, func in processors.items():
            func()
    else:
        for t in targets:
            if t in processors:
                processors[t]()
            else:
                print(f"Unknown target: {t}")
                print(f"Available: {', '.join(processors.keys())}")
    
    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for f in sorted(FOR_ANALYSIS.glob('*.md')):
        with open(f, 'r') as fh:
            content = fh.read()
        wc = word_count(content)
        sections = len(re.findall(r'^## ', content, re.MULTILINE))
        empty = 0
        parts = re.split(r'^## ', content, flags=re.MULTILINE)[1:]
        for p in parts:
            text = '\n'.join(p.split('\n')[1:]).strip()
            if word_count(text) <= 10:
                empty += 1
        status = "✓" if 25 <= sections <= 35 and empty == 0 else "⚠"
        if f.name == 'lutherbibel-1912.md':
            status = "✓"  # Bible is special case
        print(f"  {status} {f.name}: {wc:,} words, {sections} sections" + (f", {empty} empty!" if empty else ""))
