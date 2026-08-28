export type GradeResult = "correct" | "close" | "incorrect";

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/ü/g, "v")
    .replace(/u:/g, "v")
    .replace(/ā/g, "a1")
    .replace(/á/g, "a2")
    .replace(/ǎ/g, "a3")
    .replace(/à/g, "a4")
    .replace(/ē/g, "e1")
    .replace(/é/g, "e2")
    .replace(/ě/g, "e3")
    .replace(/è/g, "e4")
    .replace(/ī/g, "i1")
    .replace(/í/g, "i2")
    .replace(/ǐ/g, "i3")
    .replace(/ì/g, "i4")
    .replace(/ō/g, "o1")
    .replace(/ó/g, "o2")
    .replace(/ǒ/g, "o3")
    .replace(/ò/g, "o4")
    .replace(/ū/g, "u1")
    .replace(/ú/g, "u2")
    .replace(/ǔ/g, "u3")
    .replace(/ù/g, "u4")
    .replace(/ǖ/g, "v1")
    .replace(/ǘ/g, "v2")
    .replace(/ǚ/g, "v3")
    .replace(/ǜ/g, "v4")
    .replace(/\s+/g, "");
}

function stripTones(normalized: string): string {
  return normalized.replace(/[1-5]/g, "");
}

export function gradePinyinAnswer(userInput: string, pinyinNumbered: string): GradeResult {
  const user = normalize(userInput);
  const target = normalize(pinyinNumbered);

  if (!user) return "incorrect";
  if (user === target) return "correct";
  if (stripTones(user) === stripTones(target)) return "close";
  return "incorrect";
}
