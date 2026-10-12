import { uiT } from "../features/interface-language/runtime";
import { Subject } from "./api";
import { getSubjectTypePriority } from "./subjectSearch";

export const SUBJECT_LIST_ITEM_SORT_STORAGE_KEY =
  "subject_list_editor_selected_sort:v1";

export const SUBJECT_LIST_ITEM_SORT_MODES = [
  "addedDesc",
  "addedAsc",
  "levelAsc",
  "levelDesc",
  "type",
  "meaningAsc",
  "charactersAsc",
  "srsDesc",
  "srsAsc",
] as const;

export type SubjectListItemSortMode =
  (typeof SUBJECT_LIST_ITEM_SORT_MODES)[number];

export const DEFAULT_SUBJECT_LIST_ITEM_SORT_MODE: SubjectListItemSortMode =
  "levelAsc";

export const SUBJECT_LIST_ITEM_SORT_OPTIONS: {
  id: SubjectListItemSortMode;
  label: string;
}[] = [
  { id: "addedDesc", get label() { return uiT("ui.newest_added_41570f11"); } },
  { id: "addedAsc", get label() { return uiT("ui.oldest_added_025492e0"); } },
  { id: "levelAsc", get label() { return uiT("ui.level_low_high_5b73dc99"); } },
  { id: "levelDesc", get label() { return uiT("ui.level_high_low_f066c662"); } },
  { id: "type", get label() { return uiT("ui.subject_type_797e2154"); } },
  { id: "meaningAsc", get label() { return uiT("ui.meaning_a_z_415f6439"); } },
  { id: "charactersAsc", get label() { return uiT("ui.characters_a_z_cb615169"); } },
  { id: "srsDesc", get label() { return uiT("ui.srs_high_low_40e5a9c2"); } },
  { id: "srsAsc", get label() { return uiT("ui.srs_low_high_5b8a5bec"); } },
];

export function isSubjectListItemSortMode(
  value: unknown
): value is SubjectListItemSortMode {
  return (
    typeof value === "string" &&
    SUBJECT_LIST_ITEM_SORT_MODES.includes(value as SubjectListItemSortMode)
  );
}

export function getSubjectListItemSortLabel(
  mode: SubjectListItemSortMode
): string {
  return (
    SUBJECT_LIST_ITEM_SORT_OPTIONS.find((option) => option.id === mode)?.label ??
    "Level Low-High"
  );
}

function getPrimaryMeaning(subject: Subject): string {
  return (
    subject.data.meanings.find((meaning) => meaning.primary)?.meaning ??
    subject.data.meanings[0]?.meaning ??
    ""
  );
}

function compareByWaniKaniOrder(left: Subject, right: Subject): number {
  if (left.data.level !== right.data.level) {
    return left.data.level - right.data.level;
  }

  const leftType = getSubjectTypePriority(left.object);
  const rightType = getSubjectTypePriority(right.object);
  if (leftType !== rightType) {
    return leftType - rightType;
  }

  return left.id - right.id;
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right);
}

export function sortSubjectListItems(
  subjects: Subject[],
  sortMode: SubjectListItemSortMode,
  selectedSubjectOrderIndex: Map<number, number>,
  subjectSrsStageMap: Map<number, number>
): Subject[] {
  return [...subjects].sort((left, right) => {
    switch (sortMode) {
      case "addedDesc": {
        const leftIndex = selectedSubjectOrderIndex.get(left.id) ?? -1;
        const rightIndex = selectedSubjectOrderIndex.get(right.id) ?? -1;
        if (leftIndex !== rightIndex) {
          return rightIndex - leftIndex;
        }
        return compareByWaniKaniOrder(left, right);
      }
      case "addedAsc": {
        const leftIndex = selectedSubjectOrderIndex.get(left.id) ?? -1;
        const rightIndex = selectedSubjectOrderIndex.get(right.id) ?? -1;
        if (leftIndex !== rightIndex) {
          return leftIndex - rightIndex;
        }
        return compareByWaniKaniOrder(left, right);
      }
      case "levelDesc": {
        if (left.data.level !== right.data.level) {
          return right.data.level - left.data.level;
        }
        const leftType = getSubjectTypePriority(left.object);
        const rightType = getSubjectTypePriority(right.object);
        if (leftType !== rightType) {
          return leftType - rightType;
        }
        return left.id - right.id;
      }
      case "type": {
        const leftType = getSubjectTypePriority(left.object);
        const rightType = getSubjectTypePriority(right.object);
        if (leftType !== rightType) {
          return leftType - rightType;
        }
        return compareByWaniKaniOrder(left, right);
      }
      case "meaningAsc": {
        const byMeaning = compareText(
          getPrimaryMeaning(left),
          getPrimaryMeaning(right)
        );
        if (byMeaning !== 0) {
          return byMeaning;
        }
        return compareByWaniKaniOrder(left, right);
      }
      case "charactersAsc": {
        const leftCharacters = left.data.characters ?? getPrimaryMeaning(left);
        const rightCharacters = right.data.characters ?? getPrimaryMeaning(right);
        const byCharacters = compareText(leftCharacters, rightCharacters);
        if (byCharacters !== 0) {
          return byCharacters;
        }
        return compareByWaniKaniOrder(left, right);
      }
      case "srsDesc": {
        const leftStage = subjectSrsStageMap.get(left.id) ?? 0;
        const rightStage = subjectSrsStageMap.get(right.id) ?? 0;
        if (leftStage !== rightStage) {
          return rightStage - leftStage;
        }
        return compareByWaniKaniOrder(left, right);
      }
      case "srsAsc": {
        const leftStage = subjectSrsStageMap.get(left.id) ?? 0;
        const rightStage = subjectSrsStageMap.get(right.id) ?? 0;
        if (leftStage !== rightStage) {
          return leftStage - rightStage;
        }
        return compareByWaniKaniOrder(left, right);
      }
      case "levelAsc":
      default:
        return compareByWaniKaniOrder(left, right);
    }
  });
}
