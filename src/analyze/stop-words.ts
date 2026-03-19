export const GERMAN_STOP_WORDS = new Set([
  // Articles
  "der", "die", "das", "den", "dem", "des",
  "ein", "eine", "einen", "einem", "einer", "eines",
  // Pronouns
  "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mich", "dich", "sich", "uns", "euch",
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
  "und", "oder", "aber", "denn", "sondern", "weil", "dass",
  "wenn", "als", "ob", "obwohl", "damit", "bevor", "nachdem",
  "solange", "sowohl", "weder", "noch", "entweder",
  // Auxiliary / Modal verbs
  "ist", "sind", "war", "waren", "bin", "bist", "seid",
  "hat", "haben", "hatte", "hatten", "habe", "hast",
  "wird", "werden", "wurde", "wurden", "wirst", "werdet",
  "kann", "können", "konnte", "konnten", "kannst", "könnt",
  "muss", "müssen", "musste", "mussten", "musst", "müsst",
  "soll", "sollen", "sollte", "sollten", "sollst", "sollt",
  "will", "wollen", "wollte", "wollten", "willst", "wollt",
  "darf", "dürfen", "durfte", "durften", "darfst", "dürft",
  "mag", "mögen", "mochte", "mochten", "magst", "mögt",
  "möchte", "möchten", "möchtest", "möchtet",
  // Common adverbs / particles
  "nicht", "auch", "so", "da", "dort", "hier", "nur", "schon",
  "noch", "mehr", "sehr", "ganz", "ja", "nein", "doch",
  "dann", "nun", "mal", "eben", "halt", "wohl",
  "immer", "nie", "oft", "manchmal", "wieder",
  "jetzt", "heute", "gestern", "morgen",
  // Question words
  "was", "wer", "wen", "wem", "wessen", "wo", "wie", "warum", "wann",
  // Other function words
  "man", "kein", "keine", "keinen", "keinem", "keiner", "keines",
  "alle", "alles", "jeder", "jede", "jedes", "jeden", "jedem",
  "viel", "viele", "vielen", "vielem", "vieler",
  "etwas", "nichts",
  "selbst", "selber",
  "zum", "zur", "vom", "am", "im", "ins", "ans",
  "darüber", "dazu", "davon", "dabei", "dafür", "dagegen",
  "darum", "darauf", "daraus", "daran", "darin",
]);
