import data from "../../../data/tr-learning-pilot.json";
import { parseTranslationPackage, resolveTurkishMeaning, resolveTurkishSentence, type DisplaySubject } from "../resolver";

const packet = parseTranslationPackage(data)!;
function subject(id: string): DisplaySubject {
  const source = packet.subjects[id].source;
  return {id: Number(id), object: source.type, characters: source.word,
    meanings: source.meaningsEn.map(meaning => ({meaning})),
    readings: source.readingsJa.map(reading => ({reading}))};
}

it("loads the pilot but only exposes reviewed content", () => {
  expect(packet).not.toBeNull();
  expect(Object.keys(packet.subjects)).toHaveLength(21);
  let count = 0;
  for (const [id, entry] of Object.entries(packet.subjects)) {
    for (const example of entry.examples) {
      if (resolveTurkishSentence(packet, subject(id), example.source)) count++;
    }
  }
  expect(count).toBe(35);
  const demo = packet.subjects["6479"].examples[0];
  expect(resolveTurkishSentence(packet, subject("6479"), demo.source)).toBeNull();
});
it("distinguishes identical kanji and vocabulary characters", () => {
  expect(resolveTurkishMeaning(packet, subject("440"))?.primary).toBe("bir");
  expect(resolveTurkishSentence(packet, subject("440"), packet.subjects["2467"].examples[0].source)).toBeNull();
  expect(resolveTurkishMeaning(packet, {...subject("2467"), object: "kanji"})).toBeNull();
});
it("matches sentences by exact text rather than position", () => {
  const entry = packet.subjects["2490"];
  for (const example of [...entry.examples].reverse()) {
    expect(resolveTurkishSentence(packet, subject("2490"), example.source)?.translation).toBe(example.translation);
  }
});
it.each(["ja", "en"] as const)("falls back when sentence %s changes", field => {
  const source = packet.subjects["2490"].examples[0].source;
  expect(resolveTurkishSentence(packet, subject("2490"), {...source, [field]: source[field] + " changed"})).toBeNull();
});
it("falls back independently for a missing subject, missing example and meaning-only entry", () => {
  expect(resolveTurkishMeaning(packet, {...subject("2490"), id: 999999})).toBeNull();
  expect(resolveTurkishSentence(packet, subject("2490"), {ja: "missing", en: "missing"})).toBeNull();
  expect(resolveTurkishMeaning(packet, subject("9207"))?.primary).toBe("ama");
  expect(resolveTurkishSentence(packet, subject("9207"), {ja: "でも、できないよ。", en: "But I can't."})).toBeNull();
});
it.each(["characters", "meanings", "readings"] as const)("rejects stale lexical %s", field => {
  const current = subject("2490");
  const changed = {...current, [field]: field === "characters" ? "違う" : [{[field === "meanings" ? "meaning" : "reading"]: "changed"}]} as DisplaySubject;
  expect(resolveTurkishMeaning(packet, changed)).toBeNull();
  expect(resolveTurkishSentence(packet, changed, packet.subjects["2490"].examples[0].source)).toBeNull();
});
it("does not invalidate translations on catalog reordering", () => {
  const current = subject("440");
  expect(resolveTurkishMeaning(packet, {...current, readings: [...current.readings].reverse()})).not.toBeNull();
});
it.each([null, {}, {...data, schemaVersion: 2}, {...data, scope: "write"}])("rejects unsupported or invalid package", value => {
  expect(parseTranslationPackage(value)).toBeNull();
});
it("rejects a malformed child and duplicate example instead of partially loading an invalid package", () => {
  const copy = JSON.parse(JSON.stringify(data));
  copy.subjects["2490"].examples.push(copy.subjects["2490"].examples[0]);
  expect(parseTranslationPackage(copy)).toBeNull();
  copy.subjects["2490"].examples = [{source: {ja: "", en: ""}}];
  expect(parseTranslationPackage(copy)).toBeNull();
});
it("falls back cleanly with an invalid package and never mutates originals", () => {
  const before = JSON.stringify(data);
  const current = subject("2490");
  expect(resolveTurkishMeaning(null, current)).toBeNull();
  resolveTurkishMeaning(packet, current);
  resolveTurkishSentence(packet, current, packet.subjects["2490"].examples[0].source);
  expect(JSON.stringify(data)).toBe(before);
});
