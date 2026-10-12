import { uiPluralSuffix, uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getSubjectLists,
  SubjectList,
  SubjectListTransferMode,
  SubjectListTransferResult,
  syncSubjectListsNow,
  transferSubjectsBetweenLists,
} from "../utils/subjectLists";
import { useTheme } from "../utils/theme";

export interface TransferSubjectListsModalProps {
  visible: boolean;
  sourceListId: string;
  sourceListName: string;
  subjectIds: number[];
  onClose: () => void;
  onTransferred: (result: SubjectListTransferResult) => void | Promise<void>;
}

function normalizeSubjectIds(subjectIds: number[]): number[] {
  const normalized: number[] = [];
  const seen = new Set<number>();

  subjectIds.forEach((value) => {
    if (!Number.isFinite(value)) {
      return;
    }

    const subjectId = Math.trunc(value);
    if (subjectId <= 0 || seen.has(subjectId)) {
      return;
    }

    seen.add(subjectId);
    normalized.push(subjectId);
  });

  return normalized;
}

export default function TransferSubjectListsModal({
  visible,
  sourceListId,
  sourceListName,
  subjectIds,
  onClose,
  onTransferred,
}: TransferSubjectListsModalProps) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const loadGenerationRef = useRef(0);
  const [lists, setLists] = useState<SubjectList[]>([]);
  const [destinationListId, setDestinationListId] = useState<string | null>(
    null
  );
  const [mode, setMode] = useState<SubjectListTransferMode>("copy");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetSubjectIds = useMemo(
    () => normalizeSubjectIds(subjectIds),
    [subjectIds]
  );
  const sourceLabel = sourceListName.trim() || "this list";
  const selectedDestination = useMemo(
    () => lists.find((list) => list.id === destinationListId) ?? null,
    [destinationListId, lists]
  );
  const canSubmit =
    !isLoading &&
    !isSubmitting &&
    targetSubjectIds.length > 0 &&
    selectedDestination !== null;

  const updateDestinationLists = useCallback(
    (allLists: SubjectList[]) => {
      const nextLists = allLists.filter((list) => list.id !== sourceListId);
      setLists(nextLists);
      setDestinationListId((currentId) =>
        currentId && nextLists.some((list) => list.id === currentId)
          ? currentId
          : null
      );
    },
    [sourceListId]
  );

  const loadLists = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const cachedLists = await getSubjectLists();
      if (loadGenerationRef.current !== generation) {
        return;
      }

      updateDestinationLists(cachedLists);
      setIsLoading(false);

      try {
        await syncSubjectListsNow();
        const syncedLists = await getSubjectLists();
        if (loadGenerationRef.current === generation) {
          updateDestinationLists(syncedLists);
        }
      } catch (syncError) {
        console.warn(
          "Failed to refresh transfer destination lists after sync:",
          syncError
        );
      }
    } catch (loadError) {
      if (loadGenerationRef.current !== generation) {
        return;
      }

      console.error("Failed to load transfer destination lists:", loadError);
      setLists([]);
      setError(uiT("ui.message_db742932781c"));
      setIsLoading(false);
    }
  }, [updateDestinationLists]);

  useEffect(() => {
    if (!visible) {
      loadGenerationRef.current += 1;
      return;
    }

    setDestinationListId(null);
    setMode("copy");
    setError(null);
    void loadLists();
  }, [loadLists, visible]);

  const requestClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleTransfer = async () => {
    if (!canSubmit || !destinationListId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await transferSubjectsBetweenLists({
        sourceListId,
        destinationListId,
        subjectIds: targetSubjectIds,
        mode,
      });

      if (!result) {
        setError(
          uiT("ui.message_88f8404b883a")
        );
        return;
      }

      await onTransferred(result);
      onClose();
    } catch (transferError) {
      console.error("Failed to transfer subjects between lists:", transferError);
      setError(uiT("ui.message_9a3cd67fadaf"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectCountLabel = `${targetSubjectIds.length} subject${
    targetSubjectIds.length === 1 ? "" : "s"
  }`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={requestClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={uiT("ui.close_transfer_subjects_modal_42f7537a")}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          style={styles.backdropPressable}
          onPress={requestClose}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.container,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: theme.textColor }]}>
                {uiT("ui.transfer_subjects_e89ddc4d")} </Text>
              <Text
                style={[styles.subtitle, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {subjectCountLabel} {uiT("ui.from_75857a45")} {sourceLabel}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={uiT("ui.close_transfer_subjects_modal_42f7537a")}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={requestClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            {uiT("ui.action_64cff131")} </Text>
          <View
            style={[
              styles.modeSelector,
              {
                backgroundColor: theme.backgroundColor,
                borderColor: theme.border,
              },
            ]}
          >
            {(["copy", "move"] as SubjectListTransferMode[]).map(
              (option) => {
                const isSelected = mode === option;
                const optionColor =
                  option === "move" ? theme.error : theme.primary;
                const label = option === "move" ? "Move" : "Copy";

                return (
                  <TouchableOpacity
                    key={option}
                    accessibilityLabel={`${label} subjects`}
                    accessibilityRole="radio"
                    accessibilityState={{
                      disabled: isSubmitting,
                      selected: isSelected,
                    }}
                    activeOpacity={0.75}
                    disabled={isSubmitting}
                    onPress={() => setMode(option)}
                    style={[
                      styles.modeButton,
                      isSelected && {
                        backgroundColor: `${optionColor}18`,
                        borderColor: `${optionColor}66`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option === "move" ? "arrow-forward" : "copy-outline"}
                      size={17}
                      color={isSelected ? optionColor : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.modeButtonText,
                        {
                          color: isSelected
                            ? optionColor
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {mode === "move" ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.warning,
                {
                  backgroundColor: `${theme.error}12`,
                  borderColor: `${theme.error}44`,
                },
              ]}
            >
              <Ionicons name="warning-outline" size={18} color={theme.error} />
              <Text style={[styles.warningText, { color: theme.textColor }]}>
                {uiT("ui.moving_removes_these_subjects_from_00a81cfa")} {sourceLabel} {uiT("ui.after_adding_them_to_the_destination_9049ebe9")} </Text>
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            {uiT("ui.destination_293d404a")} </Text>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.stateText, { color: theme.textSecondary }]}>
                {uiT("ui.loading_lists_ab8a0c9b")} </Text>
            </View>
          ) : lists.length === 0 ? (
            <View style={styles.stateContainer}>
              <Ionicons
                name={error ? "alert-circle-outline" : "list-outline"}
                size={28}
                color={error ? theme.error : theme.textSecondary}
              />
              <Text style={[styles.stateText, { color: theme.textSecondary }]}>
                {error
                  ? error
                  : uiT("ui.no_other_lists_are_available_create_another_subject_list_first_b52455e1")}
              </Text>
              {error ? (
                <TouchableOpacity
                  accessibilityLabel={uiT("ui.retry_loading_destination_lists_9b9b9f8d")}
                  accessibilityRole="button"
                  onPress={() => void loadLists()}
                  style={[
                    styles.retryButton,
                    { borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[styles.retryButtonText, { color: theme.textColor }]}
                  >
                    {uiT("ui.retry_942087cc")} </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            >
              {lists.map((list) => {
                const isSelected = list.id === destinationListId;
                return (
                  <TouchableOpacity
                    key={list.id}
                    accessibilityHint={uiT("ui.sets_this_list_as_the_transfer_destination_5b9a492b")}
                    accessibilityLabel={`${list.name}, ${list.subjectIds.length} subject${
                      list.subjectIds.length === 1 ? "" : "s"
                    }`}
                    accessibilityRole="radio"
                    accessibilityState={{
                      disabled: isSubmitting,
                      selected: isSelected,
                    }}
                    activeOpacity={0.75}
                    disabled={isSubmitting}
                    onPress={() => setDestinationListId(list.id)}
                    style={[
                      styles.listRow,
                      {
                        backgroundColor: theme.backgroundColor,
                        borderColor: theme.border,
                      },
                      isSelected && {
                        backgroundColor: `${theme.primary}18`,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <View style={styles.listMeta}>
                      <Text
                        style={[styles.listName, { color: theme.textColor }]}
                        numberOfLines={1}
                      >
                        {list.name}
                      </Text>
                      <Text
                        style={[
                          styles.listCount,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {list.subjectIds.length} {uiT("ui.subject_a9491f4c")} {uiPluralSuffix(list.subjectIds.length === 1 ? "" : "s")}
                      </Text>
                    </View>
                    <Ionicons
                      name={
                        isSelected ? "radio-button-on" : "radio-button-off"
                      }
                      size={22}
                      color={
                        isSelected ? theme.primary : theme.textSecondary
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {lists.length > 0 && error ? (
            <Text
              accessibilityRole="alert"
              style={[styles.errorText, { color: theme.error }]}
            >
              {error}
            </Text>
          ) : null}

          <View style={styles.footer}>
            <TouchableOpacity
              accessibilityLabel={uiT("ui.cancel_subject_transfer_3eeaa608")}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={requestClose}
              style={[styles.footerButton, { borderColor: theme.border }]}
            >
              <Text
                style={[styles.footerButtonText, { color: theme.textColor }]}
              >
                {uiT("ui.cancel_19766ed6")} </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={`${mode === "move" ? "Move" : "Copy"} ${
                targetSubjectIds.length
              } subjects${
                selectedDestination ? ` to ${selectedDestination.name}` : ""
              }`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
              activeOpacity={0.8}
              disabled={!canSubmit}
              onPress={() => void handleTransfer()}
              style={[
                styles.footerButton,
                styles.submitButton,
                {
                  backgroundColor:
                    mode === "move" ? theme.error : theme.primary,
                  opacity: canSubmit ? 1 : 0.5,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === "move" ? uiT("ui.move_subjects_4c4d5be6") : uiT("ui.copy_subjects_f7d9d894")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    maxHeight: "86%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "600",
  },
  modeSelector: {
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  modeButton: {
    minHeight: 44,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 9,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
    marginBottom: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  listContainer: {
    maxHeight: 320,
  },
  listContent: {
    gap: 8,
  },
  listRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  listMeta: {
    flex: 1,
    paddingRight: 12,
  },
  listName: {
    fontSize: 15,
    fontWeight: "600",
  },
  listCount: {
    marginTop: 2,
    fontSize: 12,
  },
  stateContainer: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 16,
  },
  footerButton: {
    minHeight: 46,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    borderColor: "transparent",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
