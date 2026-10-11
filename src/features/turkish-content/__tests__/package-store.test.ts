import { createPackageManager, PACKAGE_STORAGE_KEY } from "../package-store";
import { parsePackageText, packageSummary, resolveTurkishMeaning } from "../resolver";
import data from "../../../data/tr-learning-pilot.json";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {values.set(key, value);}),
    removeItem: jest.fn(async (key: string) => {values.delete(key);}),
    multiGet: jest.fn(async (keys: string[]) => keys.map(key => [key, values.get(key) ?? null] as [string, string | null])),
    multiSet: jest.fn(async (pairs: [string, string][]) => {pairs.forEach(([key, value]) => values.set(key, value));}),
    multiRemove: jest.fn(async (keys: string[]) => {keys.forEach(key => values.delete(key));}),
  };
}
const packet = parsePackageText(JSON.stringify(data));
it("persists chunked content across restart and restores bundled content", async () => {
  const storage = memoryStorage();
  const manager = createPackageManager(storage as any);
  await manager.activate(packet);
  expect(manager.state.getState().packet?.version).toBe(packet.version);
  const restarted = createPackageManager(storage as any);
  await restarted.hydrate();
  expect(restarted.state.getState().packet).toEqual(packet);
  await restarted.reset();
  expect(restarted.state.getState().packet).toBeNull();
  expect(storage.values.size).toBe(0);
});
it("preserves both active and saved content when a new write fails", async () => {
  const storage = memoryStorage(); const manager = createPackageManager(storage as any);
  await manager.activate(packet);
  const before = storage.values.get(PACKAGE_STORAGE_KEY);
  storage.multiSet.mockRejectedValueOnce(new Error("disk full"));
  await expect(manager.activate({...packet, version: "new"})).rejects.toThrow("disk full");
  expect(manager.state.getState().packet).toEqual(packet);
  expect(storage.values.get(PACKAGE_STORAGE_KEY)).toBe(before);
  const restarted = createPackageManager(storage as any); await restarted.hydrate();
  expect(restarted.state.getState().packet).toEqual(packet);
});
it("keeps old pointer after index write failure", async () => {
  const storage = memoryStorage(); const manager = createPackageManager(storage as any);
  await manager.activate(packet);
  storage.setItem.mockRejectedValueOnce(new Error("disk full"));
  await expect(manager.activate({...packet, version: "new"})).rejects.toThrow();
  const restarted = createPackageManager(storage as any); await restarted.hydrate();
  expect(restarted.state.getState().packet).toEqual(packet);
});
it("falls back safely for damaged cache and can then import a valid package", async () => {
  const storage = memoryStorage(); storage.values.set(PACKAGE_STORAGE_KEY, "bad json");
  const manager = createPackageManager(storage as any); await manager.hydrate();
  expect(manager.state.getState().packet).toBeNull();
  expect(manager.state.getState().error).not.toBeNull();
  await manager.activate(packet); expect(manager.state.getState().error).toBeNull();
});
it("supports image radicals by ID and null characters in schema 2", () => {
  const entry = JSON.parse(JSON.stringify(packet.subjects["440"]));
  entry.source.type = "radical"; entry.source.word = null; entry.source.readingsJa = [];
  const radical = parsePackageText(JSON.stringify({...packet, schemaVersion: 2, subjects: {"1": entry}}));
  expect(packageSummary(radical).radical).toBe(1);
  expect(resolveTurkishMeaning(radical, {id: 1, object: "radical", characters: null, meanings: entry.source.meaningsEn.map((meaning: string) => ({meaning}))})).not.toBeNull();
  expect(() => parsePackageText(JSON.stringify({...radical, schemaVersion: 1}))).toThrow();
  entry.source.type = "kanji";
  expect(() => parsePackageText(JSON.stringify({...radical, subjects: {"1": entry}}))).toThrow();
});
it("rejects malformed, unsupported and oversized files", () => {
  expect(() => parsePackageText("broken")).toThrow("JSON");
  expect(() => parsePackageText(JSON.stringify({...packet, scope: "write"}))).toThrow();
  expect(() => parsePackageText("x".repeat(20 * 1024 * 1024 + 1))).toThrow("20 MB");
});

it("loads the real level 8 import with 34 kanji and all 409 examples", () => {
  const {readFileSync} = require("node:fs");
  const {resolve} = require("node:path");
  const loaded = parsePackageText(readFileSync(resolve(process.cwd(), "tests/fixtures/translation-packages/wanikani-tr-seviye-08.json"), "utf8"));
  expect(packageSummary(loaded)).toEqual({radical: 0, kanji: 34, vocabulary: 127, kana_vocabulary: 6, sentences: 409, levels: [8]});
  for (const [id, entry] of Object.entries(loaded.subjects)) {
    const subject = {id: Number(id), object: entry.source.type, characters: entry.source.word,
      meanings: entry.source.meaningsEn.map(meaning => ({meaning})), readings: entry.source.readingsJa.map(reading => ({reading}))};
    expect(resolveTurkishMeaning(loaded, subject)?.primary).toBe(entry.meaning.primary);
  }
});

it("persists the full 1–60 package with level 8 sentences across restart", async () => {
  const {readFileSync} = require("node:fs");
  const {resolve} = require("node:path");
  const combined = parsePackageText(readFileSync(resolve(process.cwd(), "tests/fixtures/translation-packages/wanikani-tr-01-60-seviye08-cumleler.json"), "utf8"));
  const storage = memoryStorage(); const manager = createPackageManager(storage as any);
  await manager.activate(combined);
  const restarted = createPackageManager(storage as any); await restarted.hydrate();
  expect(Object.keys(restarted.state.getState().packet!.subjects)).toHaveLength(8918);
  expect(packageSummary(restarted.state.getState().packet!).sentences).toBe(409);
  await restarted.reset(); expect(storage.values.size).toBe(0);
});
