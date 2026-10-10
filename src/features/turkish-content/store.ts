import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ContentLanguage = "en" | "tr";
interface ContentSettings {
  language: ContentLanguage;
  setLanguage: (language: ContentLanguage) => void;
}
export const useLearningContentStore = create<ContentSettings>()(persist(
  (set) => ({language: "tr", setLanguage: (language) => set({language})}),
  {name: "kakehashi-tr-content-settings-v1", storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({language: state.language}),
    merge: (saved, current) => ({...current, language:
      (saved as Partial<ContentSettings> | null)?.language === "en" ? "en" : "tr"}),
  },
));
