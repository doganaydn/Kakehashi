import { rankSubjectsByQuery, getSubjectTypePriority, createSubjectSearchIndex, type SubjectSearchIndex, type SearchableSubjectLike } from "../../utils/subjectSearch";
import type { learningDisplay } from "./display";

type Display = Pick<ReturnType<typeof learningDisplay>, "resolveMeaning">;

// Fold Turkish casing and optional keyboard accents only for translated aliases.
export function translationSearchKey(value: string): string {
  return value.normalize("NFKD").toLocaleLowerCase("tr").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").trim();
}
export function translatedSearchMeanings(display: Display, subject: unknown): string[] {
  const meaning = display.resolveMeaning(subject);
  return meaning ? [meaning.primary, ...meaning.alternatives] : [];
}
export function matchesTranslatedSearch(display: Display, subject: unknown, query: string, exact = false): boolean {
  const key = translationSearchKey(query);
  return !!key && translatedSearchMeanings(display, subject).some(value => {
    const candidate = translationSearchKey(value);
    return exact ? candidate === key : candidate.includes(key);
  });
}
export function createTranslatedSearchIndex<T extends SearchableSubjectLike>(subjects: T[], display: Display) {
  const aliases = new Map<number, SearchableSubjectLike>();
  for (const subject of subjects) {
    const values = translatedSearchMeanings(display, subject);
    if (values.length) aliases.set(subject.id, { ...subject, data: { ...subject.data, characters: null, readings: [],
      meanings: values.map((value, index) => ({ meaning: translationSearchKey(value), primary: index === 0 })) } });
  }
  return { aliases, index: createSubjectSearchIndex([...aliases.values()]) };
}
export function rankTranslatedSubjects<T extends SearchableSubjectLike>(subjects: T[], query: string, display: Display, minScore: number, index?: SubjectSearchIndex, translatedIndex?: ReturnType<typeof createTranslatedSearchIndex>) {
  const original = rankSubjectsByQuery(subjects, query, { minScore, index });
  if (!query.trim()) return original;
  const originals = new Map(subjects.map(subject => [subject.id, subject]));
  const prepared = translatedIndex ?? createTranslatedSearchIndex(subjects, display);
  const aliases = subjects.flatMap(subject => {
    const alias = prepared.aliases.get(subject.id);
    return alias ? [alias] : [];
  });
  if (!aliases.length) return original;
  const translated = rankSubjectsByQuery(aliases, translationSearchKey(query), { minScore, index: prepared.index });
  const scores = new Map(original.map(item => [item.subject.id, item]));
  for (const item of translated) {
    const previous = scores.get(item.subject.id);
    if (!previous || item.score > previous.score) scores.set(item.subject.id, { subject: originals.get(item.subject.id)!, score: item.score });
  }
  return [...scores.values()].sort((a, b) => b.score - a.score || a.subject.data.level - b.subject.data.level || getSubjectTypePriority(a.subject.object) - getSubjectTypePriority(b.subject.object) || a.subject.id - b.subject.id);
}
