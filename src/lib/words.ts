export const pool = [
    "quick", "brown", "fox", "jumps", "lazy", "dog", "runs", "field", "practice", "perfect",
    "permanent", "correctly", "typing", "fast", "means", "nothing", "fingers", "forget", "letters", "live",
    "calm", "mind", "types", "faster", "hurried", "every", "single", "time", "speed", "comes",
    "rhythm", "rushing", "press", "sky", "above", "city", "turned", "orange", "before", "storm",
    "arrived", "good", "habits", "compound", "slowly", "bad", "just", "ocean", "stretches", "farther",
    "than", "eye", "ever", "hope", "follow", "quiet", "mornings", "often", "hide", "loudest",
    "thoughts", "person", "great", "structure", "begins", "line", "drawn", "intent", "patience", "waiting",
    "about", "how", "wait", "fastest", "way", "through", "sometimes", "stand", "still", "first",
    "wind", "moves", "silent", "trees", "answer", "shadows", "grow", "long", "afternoon", "fades",
    "river", "carves", "stone", "without", "asking", "clock", "ticks", "steady", "unbothered", "chaos",
    "small", "steps", "eventually", "build", "mountains", "words", "carry", "weight", "when", "chosen",
    "well", "silence", "speaks", "louder", "noise", "often", "does", "focus", "sharpens", "over",
    "hesitation", "dulls", "morning", "light", "cuts", "through", "curtains", "gently", "waking", "world",
    "roads", "curve", "unseen", "reasons", "trust", "takes", "years", "break", "seconds", "clear",
    "sky", "reflects", "calm", "waters", "below", "birds", "trace", "invisible", "paths", "above",
    "cities", "hum", "never", "truly", "sleep", "at", "night", "stars", "burn", "long",
    "after", "they", "die", "questions", "linger", "longer", "than", "any", "answer", "given"
];

export function generate(count = 14): string {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count);
    return chosen.join(" ");
}