it("boots plural rules when Hermes lacks Locale, canonicalization and PluralRules", () => {
  const names = ["Locale", "getCanonicalLocales", "PluralRules"] as const;
  const originals = names.map(name => Object.getOwnPropertyDescriptor(Intl, name));
  try {
    for (const name of names) Reflect.deleteProperty(Intl, name);
    jest.isolateModules(() => {
      require("../startup-intl");
      expect(new Intl.PluralRules("en").select(1)).toBe("one");
      expect(new Intl.PluralRules("en").select(2)).toBe("other");
      expect(new Intl.PluralRules("tr").select(1)).toBe("one");
      expect(new Intl.PluralRules("tr").select(12)).toBe("other");
      const i18next = require("i18next").createInstance();
      i18next.init({initAsync:false, lng:"tr", resources:{tr:{translation:{ready_one:"{{count}} hazır",ready_other:"{{count}} hazır"}}}});
      expect(i18next.t("ready",{count:12})).toBe("12 hazır");
    });
  } finally {
    names.forEach((name, index) => {
      if (originals[index]) Object.defineProperty(Intl, name, originals[index]!);
      else Reflect.deleteProperty(Intl, name);
    });
  }
});
