import data from "../../data/tr-learning-pilot.json";
import { parseTranslationPackage } from "./resolver";

// Bundled and offline for the first prototype; invalid content falls back to English.
export const turkishContent = parseTranslationPackage(data);
