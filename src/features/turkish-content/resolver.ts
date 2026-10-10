import { z } from "zod";

const text = z.string().refine(value => value.trim().length > 0);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const status = z.enum(["demo", "draft", "editorial-reviewed"]);
const entrySchema = z.object({
  source: z.object({
    type: z.enum(["kanji", "vocabulary", "kana_vocabulary"]), word: text,
    meaningsEn: z.array(text).min(1), readingsJa: z.array(text),
    level: z.number().int().min(1).max(60), updatedAt: z.string().nullable(), meaningBasisSha256: hash,
  }).strict(),
  meaning: z.object({ primary: text, alternatives: z.array(text), reviewStatus: status }).strict(),
  examples: z.array(z.object({
    source: z.object({ ja: text, en: text }).strict(), sourceSha256: hash,
    translation: text, usage: text, reviewStatus: status,
  }).strict()),
}).strict();
const packageSchema = z.object({
  $schema: text, schemaVersion: z.literal(1), packageId: text,
  language: z.literal("tr"), name: text, version: text,
  generatedAt: z.iso.datetime({ offset: true }),
  purpose: z.enum(["integration-demo", "learning-content"]), scope: z.literal("display-only"),
  subjects: z.record(z.string().regex(/^[1-9][0-9]*$/), entrySchema),
}).strict();
export type TranslationPackage = z.infer<typeof packageSchema>;
export interface DisplaySubject {
  id: number; object: string; characters: string;
  meanings: { meaning: string; primary?: boolean }[];
  readings: { reading: string; primary?: boolean }[];
}

// Compare original fields directly. Hashes are verified by the offline exporter,
// not treated as signatures or used in place of checking the current catalog.
export function parseTranslationPackage(value: unknown): TranslationPackage | null {
  const result = packageSchema.safeParse(value);
  if (!result.success || !Object.keys(result.data.subjects).length) return null;
  for (const entry of Object.values(result.data.subjects)) {
    const seen = new Set<string>();
    for (const example of entry.examples) {
      const key = JSON.stringify([example.source.ja, example.source.en]);
      if (seen.has(key)) return null;
      seen.add(key);
    }
  }
  return result.data;
}
function sameStrings(a: string[], b: string[]) {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}
function matchingEntry(packet: TranslationPackage | null, subject: DisplaySubject) {
  const entry = packet?.subjects[String(subject.id)];
  if (!entry || subject.id <= 0 || entry.source.type !== subject.object ||
    entry.source.word !== subject.characters ||
    !sameStrings(entry.source.meaningsEn, subject.meanings.map(m => m.meaning)) ||
    !sameStrings(entry.source.readingsJa, subject.readings.map(r => r.reading))) return null;
  return entry;
}
export function resolveTurkishMeaning(packet: TranslationPackage | null, subject: DisplaySubject) {
  const entry = matchingEntry(packet, subject);
  return entry?.meaning.reviewStatus === "editorial-reviewed" ? entry.meaning : null;
}
export function resolveTurkishSentence(packet: TranslationPackage | null, subject: DisplaySubject, source: {ja: string; en: string}) {
  const entry = matchingEntry(packet, subject);
  return entry?.examples.find(e => e.reviewStatus === "editorial-reviewed" &&
    e.source.ja === source.ja && e.source.en === source.en) ?? null;
}
