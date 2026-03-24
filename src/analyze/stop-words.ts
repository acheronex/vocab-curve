export const GERMAN_STOP_WORDS = new Set([
  // Articles
  "der", "die", "das", "den", "dem", "des",
  "ein", "eine", "einen", "einem", "einer", "eines",
  // Pronouns
  "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mich", "dich", "ihn", "sich", "uns", "euch",
  "mir", "dir", "ihm", "ihnen",
  "mein", "meine", "meinen", "meinem", "meiner", "meines",
  "dein", "deine", "deinen", "deinem", "deiner", "deines",
  "sein", "seine", "seinen", "seinem", "seiner", "seines",
  "ihr", "ihre", "ihren", "ihrem", "ihrer", "ihres",
  "unser", "unsere", "unseren", "unserem", "unserer", "unseres",
  "euer", "eure", "euren", "eurem", "eurer", "eures",
  // Demonstratives / Relatives
  "dieser", "diese", "dieses", "diesen", "diesem",
  "jener", "jene", "jenes", "jenen", "jenem",
  "welcher", "welche", "welches", "welchen", "welchem",
  // Prepositions
  "in", "an", "auf", "aus", "bei", "mit", "nach", "von", "zu",
  "für", "über", "unter", "vor", "hinter", "neben", "zwischen",
  "um", "durch", "gegen", "ohne", "bis", "seit", "während",
  // Conjunctions
  "und", "oder", "aber", "denn", "sondern", "weil", "dass", "daß",
  "wenn", "als", "ob", "obwohl", "damit", "bevor", "nachdem",
  "solange", "sowohl", "weder", "noch", "entweder",
  // Common adverbs / particles
  "nicht", "auch", "so", "da", "dort", "hier", "ja", "nein",
  // Question words
  "was", "wer", "wen", "wem", "wessen", "wo", "wie", "warum", "wann",
  // Other function words
  "zum", "zur", "vom", "am", "im", "ins", "ans",
  "darüber", "dazu", "davon", "dabei", "dafür", "dagegen",
  "darum", "darauf", "daraus", "daran", "darin",
]);
