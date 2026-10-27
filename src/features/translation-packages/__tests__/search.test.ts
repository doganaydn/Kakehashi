import { learningDisplay } from "../display";
import { parsePackageText } from "../resolver";
import { rankTranslatedSubjects, matchesTranslatedSearch, createTranslatedSearchIndex } from "../search";
import data from "../../../../tests/fixtures/translation-packages/tr-learning-pilot.json";
const packet = parsePackageText(JSON.stringify(data));
const entry = packet.subjects["2761"];
entry.meaning.primary = "Işık";
entry.meaning.alternatives = ["İnci", "Gölet"];
const subject = { id: 2761, object: entry.source.type, data: { level: entry.source.level, characters: entry.source.word,
  meanings: entry.source.meaningsEn.map(meaning => ({ meaning, primary: true })),
  readings: entry.source.readingsJa.map(reading => ({ reading, primary: true })) } };
it.each(["ışık", "IŞIK", "isik", "İNCİ", "inci", "gölet", "golet"])("searches reviewed translated meanings with Turkish case and keyboard folding: %s", query => {
 const before = JSON.stringify(subject);
 const display = learningDisplay(packet, true);
 expect(rankTranslatedSubjects([subject], query, display, 980)[0]?.subject).toBe(subject);
 expect(matchesTranslatedSearch(display, subject, query, true)).toBe(true);
 expect(JSON.stringify(subject)).toBe(before);
});
it("excludes disabled, missing, draft and source-mismatched translations", () => {
 for (const display of [learningDisplay(packet, false), learningDisplay(null, true)])
  expect(rankTranslatedSubjects([subject], "ışık", display, 980)).toEqual([]);
 const stale = { ...subject, data: { ...subject.data, readings: [{ reading: "changed" }] } };
 expect(rankTranslatedSubjects([stale], "ışık", learningDisplay(packet, true), 980)).toEqual([]);
 const draft = JSON.parse(JSON.stringify(packet)); draft.subjects["2761"].meaning.reviewStatus = "draft";
 expect(rankTranslatedSubjects([subject], "ışık", learningDisplay(draft, true), 980)).toEqual([]);
});
it("keeps Japanese and English searchable and deduplicates results", () => {
 const display = learningDisplay(packet, true);
 for (const query of [entry.source.word!, entry.source.meaningsEn[0], "ışık"])
  expect(rankTranslatedSubjects([subject], query, display, 980).map(item => item.subject.id)).toEqual([subject.id]);
 expect(matchesTranslatedSearch(display, subject, "", false)).toBe(false);
});

it("reuses source-validated aliases across searches and respects filtered subjects and package replacement", () => {
 const display = learningDisplay(packet, true);
 const index = createTranslatedSearchIndex([subject], display);
 for (const query of ["ışık", "inci", "golet", "pond"]) {
  expect(rankTranslatedSubjects([subject], query, display, 620, undefined, index)).toEqual(rankTranslatedSubjects([subject], query, display, 620));
 }
 expect(rankTranslatedSubjects([], "ışık", display, 620, undefined, index)).toEqual([]);
 const disabled = learningDisplay(packet, false);
 const newIndex = createTranslatedSearchIndex([subject], disabled);
 expect(rankTranslatedSubjects([subject], "ışık", disabled, 980, undefined, newIndex)).toEqual([]);
});
