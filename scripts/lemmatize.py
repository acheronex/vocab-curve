#!/usr/bin/env python3
"""
Batch German lemmatizer using simplemma.
Input: one word per line (lowercase).
Output: "stem\tdisplay" per line (tab-separated).

Strategy for German noun detection:
1. Lemmatize the lowercase form → get the base lemma
2. Check if simplemma returns a capitalized lemma for the lowercase input
   (simplemma knows German nouns: 'hand' → 'Hand', 'kinder' → 'Kind')
3. If the lemma is capitalized → it's a noun, display capitalized
4. If not → it's a verb/adj/etc, display lowercase
"""
import sys
import simplemma

def main():
    for line in sys.stdin:
        word = line.strip()
        if not word:
            print("\t")
            continue

        lemma = simplemma.lemmatize(word, lang="de")
        stem = lemma.lower()
        display = lemma

        print(f"{stem}\t{display}")
    sys.stdout.flush()

if __name__ == "__main__":
    main()
