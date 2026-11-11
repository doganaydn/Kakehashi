import { File, Paths } from "expo-file-system";
import { parsePackageText, type TranslationPackage } from "./resolver";

export interface PackageFiles {
  read(): Promise<TranslationPackage | null>;
  write(text: string): Promise<void>;
  remove(): Promise<void>;
}

const active = () => new File(Paths.document, "learning-package.json");
const previous = () => new File(Paths.document, "learning-package.previous.json");
const pending = () => new File(Paths.document, "learning-package.pending.json");

function removeIfPresent(file: File) {
  if (file.exists) file.delete();
}

export const nativePackageFiles: PackageFiles = {
  async read() {
    const current = active();
    if (current.exists) return parsePackageText(await current.text());
    const backup = previous();
    return backup.exists ? parsePackageText(await backup.text()) : null;
  },
  async write(text) {
    const staging = pending();
    removeIfPresent(staging);
    await staging.write(text);

    // Both moves stay in the same directory. A restart between moves reads the backup.
    const current = active();
    if (current.exists) {
      removeIfPresent(previous());
      await current.move(previous());
    }
    await staging.move(active());

    try { removeIfPresent(previous()); } catch { /* The new file is already committed. */ }
  },
  async remove() {
    removeIfPresent(pending());
    removeIfPresent(previous());
    removeIfPresent(active());
  },
};
