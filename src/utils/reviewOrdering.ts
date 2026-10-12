import { uiT } from "../features/interface-language/runtime";
export type ReviewOrderSetting =
  | "random"
  | "ascendingSrsStage"
  | "descendingSrsStage"
  | "currentLevelFirst"
  | "lowestLevelFirst"
  | "newestAvailableFirst"
  | "oldestAvailableFirst"
  | "longestRelativeWait";

export type ReviewTypeOrderSetting = "radical" | "kanji" | "vocabulary";

export type ReviewQuestionType = "meaning" | "reading";

export interface ReviewQueueQuestion {
  type: ReviewQuestionType;
  itemId: number;
}

export interface ReviewOrderOption {
  value: ReviewOrderSetting;
  label: string;
  description: string;
}

export const DEFAULT_REVIEW_ORDER: ReviewOrderSetting = "random";
export const DEFAULT_CUSTOM_REVIEW_ORDER: ReviewOrderSetting = "random";
export const REVIEW_TYPE_ORDER_VALUES: readonly ReviewTypeOrderSetting[] = [
  "radical",
  "kanji",
  "vocabulary",
];
export const DEFAULT_REVIEW_TYPE_ORDER: ReviewTypeOrderSetting[] = [
  ...REVIEW_TYPE_ORDER_VALUES,
];
export const DEFAULT_MAX_QUESTION_GAP = 10;

export const REVIEW_ORDER_OPTIONS: readonly ReviewOrderOption[] = [
  {
    value: "random",
    get label() { return uiT("ui.random_67bc4844"); },
    get description() { return uiT("ui.shuffle_items_with_no_fixed_ordering_9f657403"); },
  },
  {
    value: "ascendingSrsStage",
    get label() { return uiT("ui.lower_srs_first_567c67fe"); },
    get description() { return uiT("ui.start_from_apprentice_then_guru_master_enlightened_and_burned_e3e67ed8"); },
  },
  {
    value: "descendingSrsStage",
    get label() { return uiT("ui.higher_srs_first_164b4f44"); },
    get description() { return uiT("ui.start_from_burned_enlightened_and_move_down_toward_apprentice_7f0acb6c"); },
  },
  {
    value: "currentLevelFirst",
    get label() { return uiT("ui.current_level_first_89d93c04"); },
    get description() { return uiT("ui.prioritize_higher_level_items_before_older_levels_74bfe8cb"); },
  },
  {
    value: "lowestLevelFirst",
    get label() { return uiT("ui.lowest_level_first_3968e619"); },
    get description() { return uiT("ui.prioritize_lower_level_older_items_first_0118de11"); },
  },
  {
    value: "newestAvailableFirst",
    get label() { return uiT("ui.newest_available_first_9ccc5fb9"); },
    get description() { return uiT("ui.show_items_that_became_available_most_recently_b6023795"); },
  },
  {
    value: "oldestAvailableFirst",
    get label() { return uiT("ui.oldest_available_first_07863d9e"); },
    get description() { return uiT("ui.show_items_that_have_been_waiting_the_longest_absolute_533baeb5"); },
  },
  {
    value: "longestRelativeWait",
    get label() { return uiT("ui.most_overdue_first_05a3d01d"); },
    get description() { return uiT("ui.prioritize_items_most_overdue_relative_to_their_srs_interval_5929b69a"); },
  },
];

export function getReviewOrderLabel(order: ReviewOrderSetting): string {
  return (
    REVIEW_ORDER_OPTIONS.find((option) => option.value === order)?.label ??
    REVIEW_ORDER_OPTIONS[0].label
  );
}

type SubjectType = "radical" | "kanji" | "vocabulary" | "kana_vocabulary";

interface OrderableReviewSubject {
  object: SubjectType;
  data: {
    level?: number;
    readings?: unknown;
  };
}

export interface OrderableReviewItem {
  id: number;
  subject: OrderableReviewSubject;
  srsStage?: number | null;
  availableAt?: string | null;
}

interface SortReviewItemsOptions {
  reviewOrder?: ReviewOrderSetting;
  reviewTypeOrderEnabled?: boolean;
  reviewTypeOrder?: ReviewTypeOrderSetting[];
  prioritizeCriticalItems?: boolean;
  userLevel?: number;
  now?: Date;
  randomFn?: () => number;
}

interface BuildReviewQueueOptions {
  groupQuestions?: boolean;
  backToBack?: boolean;
  maxQuestionGap?: number;
  questionTypeOrderEnabled?: boolean;
  questionTypeOrder?: ReviewQuestionType;
  randomFn?: () => number;
}

interface RebuildReviewQueueAfterSkipOptions<T extends OrderableReviewItem> {
  items: T[];
  remainingQuestions: ReviewQueueQuestion[];
  skippedItemId: number;
  skippedItemIds?: number[];
  skippedQuestionType?: ReviewQuestionType;
  groupQuestions?: boolean;
  backToBack?: boolean;
  maxQuestionGap?: number;
  questionTypeOrderEnabled?: boolean;
  questionTypeOrder?: ReviewQuestionType;
  randomFn?: () => number;
}

interface RebuildReviewQueueAfterSkipResult {
  queue: ReviewQueueQuestion[];
  skippedItemIds: number[];
}

const SUBJECT_TYPE_FALLBACK_ORDER: Record<SubjectType, number> = {
  radical: 0,
  kanji: 1,
  vocabulary: 2,
  kana_vocabulary: 3,
};

const SRS_STAGE_INTERVAL_HOURS: Record<number, number> = {
  1: 4,
  2: 8,
  3: 23,
  4: 47,
  5: 167,
  6: 335,
  7: 719,
  8: 2879,
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_STAGE_INTERVAL_HOURS = 4;

function shuffleArray<T>(array: T[], randomFn: () => number): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function isCriticalItem(item: OrderableReviewItem, userLevel: number): boolean {
  if (item.subject.data.level !== userLevel) return false;
  if (item.subject.object !== "radical" && item.subject.object !== "kanji") {
    return false;
  }
  const srsStage = item.srsStage ?? 0;
  return srsStage >= 1 && srsStage <= 4;
}

function getFallbackSubjectTypeOrder(item: OrderableReviewItem): number {
  return SUBJECT_TYPE_FALLBACK_ORDER[item.subject.object] ?? 0;
}

function getTypeOrderBucket(item: OrderableReviewItem): ReviewTypeOrderSetting {
  if (item.subject.object === "kana_vocabulary") {
    return "vocabulary";
  }
  return item.subject.object;
}

export function normalizeReviewTypeOrder(
  reviewTypeOrder?: ReviewTypeOrderSetting[]
): ReviewTypeOrderSetting[] {
  if (!reviewTypeOrder || reviewTypeOrder.length === 0) {
    return [...DEFAULT_REVIEW_TYPE_ORDER];
  }

  const seen = new Set<ReviewTypeOrderSetting>();
  const normalized: ReviewTypeOrderSetting[] = [];

  reviewTypeOrder.forEach((value) => {
    if (!REVIEW_TYPE_ORDER_VALUES.includes(value) || seen.has(value)) {
      return;
    }
    seen.add(value);
    normalized.push(value);
  });

  REVIEW_TYPE_ORDER_VALUES.forEach((value) => {
    if (!seen.has(value)) {
      normalized.push(value);
    }
  });

  return normalized;
}

function parseDateToMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareDateAscending(
  left: string | null | undefined,
  right: string | null | undefined
): number {
  const leftTime = parseDateToMs(left);
  const rightTime = parseDateToMs(right);

  if (leftTime === null && rightTime === null) return 0;
  if (leftTime === null) return 1;
  if (rightTime === null) return -1;
  return leftTime - rightTime;
}

function compareDateDescending(
  left: string | null | undefined,
  right: string | null | undefined
): number {
  return compareDateAscending(right, left);
}

function getSrsIntervalMs(stage: number): number {
  const intervalHours =
    SRS_STAGE_INTERVAL_HOURS[stage] ?? DEFAULT_STAGE_INTERVAL_HOURS;
  return intervalHours * ONE_HOUR_MS;
}

function getRelativeWaitRatio(item: OrderableReviewItem, now: Date): number {
  const availableAtMs = parseDateToMs(item.availableAt);
  if (availableAtMs === null) return Number.NEGATIVE_INFINITY;

  // Use coarse granularity by rounding "now" to the hour.
  const truncatedNowMs = Math.floor(now.getTime() / ONE_HOUR_MS) * ONE_HOUR_MS;
  const elapsedMs = Math.max(0, truncatedNowMs - availableAtMs);
  const srsIntervalMs = getSrsIntervalMs(item.srsStage ?? 1);
  if (srsIntervalMs <= 0) return Number.NEGATIVE_INFINITY;

  return elapsedMs / srsIntervalMs;
}

function compareByReviewOrder(
  left: OrderableReviewItem,
  right: OrderableReviewItem,
  reviewOrder: ReviewOrderSetting,
  now: Date
): number {
  switch (reviewOrder) {
    case "random":
      return 0;
    case "ascendingSrsStage":
      return (left.srsStage ?? 0) - (right.srsStage ?? 0);
    case "descendingSrsStage":
      return (right.srsStage ?? 0) - (left.srsStage ?? 0);
    case "currentLevelFirst":
      return (right.subject.data.level ?? 0) - (left.subject.data.level ?? 0);
    case "lowestLevelFirst":
      return (left.subject.data.level ?? 0) - (right.subject.data.level ?? 0);
    case "newestAvailableFirst":
      return compareDateDescending(left.availableAt, right.availableAt);
    case "oldestAvailableFirst":
      return compareDateAscending(left.availableAt, right.availableAt);
    case "longestRelativeWait":
      return getRelativeWaitRatio(right, now) - getRelativeWaitRatio(left, now);
    default:
      return 0;
  }
}

export function sortReviewItemsForQueue<T extends OrderableReviewItem>(
  items: T[],
  options: SortReviewItemsOptions = {}
): T[] {
  const {
    reviewOrder = DEFAULT_REVIEW_ORDER,
    reviewTypeOrderEnabled = false,
    reviewTypeOrder = DEFAULT_REVIEW_TYPE_ORDER,
    prioritizeCriticalItems = false,
    userLevel = 1,
    now = new Date(),
    randomFn = Math.random,
  } = options;

  const normalizedTypeOrder = normalizeReviewTypeOrder(reviewTypeOrder);
  const typeOrderMap = new Map<ReviewTypeOrderSetting, number>();
  normalizedTypeOrder.forEach((subjectType, index) => {
    typeOrderMap.set(subjectType, index);
  });

  const shuffledItems = shuffleArray(items, randomFn);
  const shuffledIndex = new Map<number, number>();
  shuffledItems.forEach((item, index) => {
    shuffledIndex.set(item.id, index);
  });

  return [...shuffledItems].sort((left, right) => {
    if (prioritizeCriticalItems) {
      const leftIsCritical = isCriticalItem(left, userLevel);
      const rightIsCritical = isCriticalItem(right, userLevel);
      if (leftIsCritical && !rightIsCritical) return -1;
      if (!leftIsCritical && rightIsCritical) return 1;
    }

    if (reviewOrder === "random" && !reviewTypeOrderEnabled) {
      return (shuffledIndex.get(left.id) ?? 0) - (shuffledIndex.get(right.id) ?? 0);
    }

    if (reviewTypeOrderEnabled) {
      const leftTypeOrder = typeOrderMap.get(getTypeOrderBucket(left)) ?? 0;
      const rightTypeOrder = typeOrderMap.get(getTypeOrderBucket(right)) ?? 0;
      const typeOrderComparison = leftTypeOrder - rightTypeOrder;

      if (typeOrderComparison !== 0) return typeOrderComparison;

      if (reviewOrder === "random") {
        return (shuffledIndex.get(left.id) ?? 0) - (shuffledIndex.get(right.id) ?? 0);
      }

      const reviewOrderComparison = compareByReviewOrder(
        left,
        right,
        reviewOrder,
        now
      );
      if (reviewOrderComparison !== 0) return reviewOrderComparison;

      return (shuffledIndex.get(left.id) ?? 0) - (shuffledIndex.get(right.id) ?? 0);
    }

    const reviewOrderComparison = compareByReviewOrder(
      left,
      right,
      reviewOrder,
      now
    );
    if (reviewOrderComparison !== 0) return reviewOrderComparison;

    const subjectTypeComparison =
      getFallbackSubjectTypeOrder(left) - getFallbackSubjectTypeOrder(right);
    if (subjectTypeComparison !== 0) return subjectTypeComparison;

    return (shuffledIndex.get(left.id) ?? 0) - (shuffledIndex.get(right.id) ?? 0);
  });
}

function hasReadingQuestion(item: OrderableReviewItem): boolean {
  if (item.subject.object === "radical") return false;

  const readings = item.subject.data.readings;
  if (item.subject.object === "vocabulary" || item.subject.object === "kana_vocabulary") {
    if (!readings) return false;
    if (Array.isArray(readings) && readings.length === 0) return false;
  }

  return true;
}

function getMeaningQuestion(itemId: number): ReviewQueueQuestion {
  return { type: "meaning", itemId };
}

function getReadingQuestion(itemId: number): ReviewQueueQuestion {
  return { type: "reading", itemId };
}

function getQuestionByType(
  questionType: ReviewQuestionType,
  itemId: number
): ReviewQueueQuestion {
  return questionType === "reading"
    ? getReadingQuestion(itemId)
    : getMeaningQuestion(itemId);
}

export function generateReviewQuestions<T extends OrderableReviewItem>(
  items: T[],
  options: { groupQuestions?: boolean } = {}
): ReviewQueueQuestion[] {
  const { groupQuestions = false } = options;
  const questions: ReviewQueueQuestion[] = [];

  items.forEach((item) => {
    questions.push(getMeaningQuestion(item.id));
    if (!groupQuestions && hasReadingQuestion(item)) {
      questions.push(getReadingQuestion(item.id));
    }
  });

  return questions;
}

function generateBackToBackQuestions<T extends OrderableReviewItem>(
  items: T[],
  groupQuestions: boolean,
  questionTypeOrder: ReviewQuestionType
): ReviewQueueQuestion[] {
  const questions: ReviewQueueQuestion[] = [];

  items.forEach((item) => {
    const meaningQuestion = getMeaningQuestion(item.id);

    if (groupQuestions || !hasReadingQuestion(item)) {
      questions.push(meaningQuestion);
      return;
    }

    const readingQuestion = getReadingQuestion(item.id);
    if (questionTypeOrder === "reading") {
      questions.push(readingQuestion);
      questions.push(meaningQuestion);
    } else {
      questions.push(meaningQuestion);
      questions.push(readingQuestion);
    }
  });

  return questions;
}

function generateSpreadQuestions<T extends OrderableReviewItem>(
  items: T[],
  groupQuestions: boolean,
  maxQuestionGap: number,
  randomFn: () => number,
  questionTypeOrderEnabled: boolean,
  questionTypeOrder: ReviewQuestionType
): ReviewQueueQuestion[] {
  const questions: ReviewQueueQuestion[] = [];
  const pendingQuestions: ReviewQueueQuestion[] = [];

  items.forEach((item) => {
    const meaningQuestion = getMeaningQuestion(item.id);

    if (groupQuestions || !hasReadingQuestion(item)) {
      questions.push(meaningQuestion);
      return;
    }

    const readingQuestion = getReadingQuestion(item.id);
    if (questionTypeOrderEnabled) {
      if (questionTypeOrder === "reading") {
        questions.push(readingQuestion);
        pendingQuestions.push(meaningQuestion);
      } else {
        questions.push(meaningQuestion);
        pendingQuestions.push(readingQuestion);
      }
    } else if (randomFn() < 0.5) {
      questions.push(meaningQuestion);
      pendingQuestions.push(readingQuestion);
    } else {
      questions.push(readingQuestion);
      pendingQuestions.push(meaningQuestion);
    }
  });

  pendingQuestions.forEach((pendingQuestion) => {
    const relatedIndex = questions.findIndex(
      (question) => question.itemId === pendingQuestion.itemId
    );
    if (relatedIndex < 0) {
      questions.push(pendingQuestion);
      return;
    }

    const minPosition = Math.min(questions.length, relatedIndex + 2);
    const maxPosition = Math.min(questions.length, relatedIndex + maxQuestionGap);
    if (minPosition > maxPosition) {
      questions.push(pendingQuestion);
      return;
    }

    const insertPosition =
      minPosition +
      Math.floor(randomFn() * (maxPosition - minPosition + 1));
    questions.splice(insertPosition, 0, pendingQuestion);
  });

  return questions;
}

export function buildReviewQuestionQueue<T extends OrderableReviewItem>(
  items: T[],
  options: BuildReviewQueueOptions = {}
): ReviewQueueQuestion[] {
  const {
    groupQuestions = false,
    backToBack = false,
    maxQuestionGap = DEFAULT_MAX_QUESTION_GAP,
    questionTypeOrderEnabled = false,
    questionTypeOrder = "meaning",
    randomFn = Math.random,
  } = options;
  const normalizedQuestionTypeOrder =
    questionTypeOrder === "reading" ? "reading" : "meaning";
  const shouldForceQuestionTypeOrder = questionTypeOrderEnabled && !groupQuestions;

  if (backToBack) {
    return generateBackToBackQuestions(
      items,
      groupQuestions,
      shouldForceQuestionTypeOrder ? normalizedQuestionTypeOrder : "meaning"
    );
  }

  return generateSpreadQuestions(
    items,
    groupQuestions,
    maxQuestionGap,
    randomFn,
    shouldForceQuestionTypeOrder,
    normalizedQuestionTypeOrder
  );
}

function buildSkippedReviewQuestionTail<T extends OrderableReviewItem>(
  items: T[],
  {
    groupQuestions,
    maxQuestionGap,
    questionTypeOrderEnabled,
    questionTypeOrder,
    firstQuestionTypeByItemId,
    randomFn,
  }: {
    groupQuestions: boolean;
    maxQuestionGap: number;
    questionTypeOrderEnabled: boolean;
    questionTypeOrder: ReviewQuestionType;
    firstQuestionTypeByItemId: Map<number, ReviewQuestionType>;
    randomFn: () => number;
  }
): ReviewQueueQuestion[] {
  const queue: ReviewQueueQuestion[] = [];
  const batchSize = Math.max(1, Math.floor(maxQuestionGap));
  const normalizedQuestionTypeOrder =
    questionTypeOrder === "reading" ? "reading" : "meaning";
  const shouldForceQuestionTypeOrder = questionTypeOrderEnabled && !groupQuestions;

  for (let startIndex = 0; startIndex < items.length; startIndex += batchSize) {
    const batch = items.slice(startIndex, startIndex + batchSize);
    const secondPassQuestions: ReviewQueueQuestion[] = [];

    batch.forEach((item) => {
      const itemHasReadingQuestion = hasReadingQuestion(item);

      if (groupQuestions || !itemHasReadingQuestion) {
        queue.push(getMeaningQuestion(item.id));
        return;
      }

      const firstQuestionType = shouldForceQuestionTypeOrder
        ? normalizedQuestionTypeOrder
        : firstQuestionTypeByItemId.get(item.id) ??
          (randomFn() < 0.5 ? "meaning" : "reading");
      const secondQuestionType =
        firstQuestionType === "meaning" ? "reading" : "meaning";

      queue.push(getQuestionByType(firstQuestionType, item.id));
      secondPassQuestions.push(getQuestionByType(secondQuestionType, item.id));
    });

    queue.push(...secondPassQuestions);
  }

  return queue;
}

export function rebuildReviewQueueAfterSkip<T extends OrderableReviewItem>({
  items,
  remainingQuestions,
  skippedItemId,
  skippedItemIds = [],
  skippedQuestionType,
  groupQuestions = false,
  backToBack = false,
  maxQuestionGap = DEFAULT_MAX_QUESTION_GAP,
  questionTypeOrderEnabled = false,
  questionTypeOrder = "meaning",
  randomFn = Math.random,
}: RebuildReviewQueueAfterSkipOptions<T>): RebuildReviewQueueAfterSkipResult {
  const itemById = new Map<number, T>();
  items.forEach((item) => {
    itemById.set(item.id, item);
  });

  const remainingItemIds = new Set(
    remainingQuestions.map((question) => question.itemId)
  );
  const skippedOrder = [
    ...skippedItemIds.filter((itemId) => itemId !== skippedItemId),
    skippedItemId,
  ].filter(
    (itemId) =>
      itemById.has(itemId) &&
      (itemId === skippedItemId || remainingItemIds.has(itemId))
  );
  const skippedItemIdSet = new Set(skippedOrder);
  const firstQuestionTypeByItemId = new Map<number, ReviewQuestionType>();

  remainingQuestions.forEach((question) => {
    if (
      skippedItemIdSet.has(question.itemId) &&
      !firstQuestionTypeByItemId.has(question.itemId)
    ) {
      firstQuestionTypeByItemId.set(question.itemId, question.type);
    }
  });

  if (skippedQuestionType) {
    firstQuestionTypeByItemId.set(skippedItemId, skippedQuestionType);
  }

  const baseQueue = remainingQuestions.filter(
    (question) => !skippedItemIdSet.has(question.itemId)
  );
  const skippedItems = skippedOrder
    .map((itemId) => itemById.get(itemId))
    .filter((item): item is T => item !== undefined);
  const skippedTail = backToBack
    ? buildReviewQuestionQueue(skippedItems, {
        groupQuestions,
        backToBack: true,
        maxQuestionGap,
        questionTypeOrderEnabled,
        questionTypeOrder,
        randomFn,
      })
    : buildSkippedReviewQuestionTail(skippedItems, {
        groupQuestions,
        maxQuestionGap,
        questionTypeOrderEnabled,
        questionTypeOrder,
        firstQuestionTypeByItemId,
        randomFn,
      });

  return {
    queue: [...baseQueue, ...skippedTail],
    skippedItemIds: skippedOrder,
  };
}
