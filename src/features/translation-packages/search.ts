import { rankSubjectsByQuery, getSubjectTypePriority, type SearchableSubjectLike } from "../../utils/subjectSearch";
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
export function rankTranslatedSubjects<T extends SearchableSubjectLike>(subjects: T[], query: string, display: Display, minScore: number) {
  const original = rankSubjectsByQuery(subjects, query, { minScore });
  if (!query.trim()) return original;
  const originals = new Map(subjects.map(subject => [subject.id, subject]));
  const aliases = subjects.flatMap(subject => {
    const values = translatedSearchMeanings(display, subject);
    return values.length ? [{ ...subject, data: { ...subject.data, characters: null, readings: [],
      meanings: values.map((value, index) => ({ meaning: translationSearchKey(value), primary: index === 0 })) } }] : [];
  });
  if (!aliases.length) return original;
  const translated = rankSubjectsByQuery(aliases, translationSearchKey(query), { minScore });
  const scores = new Map(original.map(item => [item.subject.id, item]));
  for (const item of translated) {
    const previous = scores.get(item.subject.id);
    if (!previous || item.score > previous.score) scores.set(item.subject.id, { subject: originals.get(item.subject.id)!, score: item.score });
  }
  return [...scores.values()].sort((a, b) => b.score - a.score || a.subject.data.level - b.subject.data.level || getSubjectTypePriority(a.subject.object) - getSubjectTypePriority(b.subject.object) || a.subject.id - b.subject.id);
}
