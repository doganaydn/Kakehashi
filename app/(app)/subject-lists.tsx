import { uiPluralSuffix, uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { useLearningDisplay } from "../../src/features/turkish-content/display";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import type { GestureResponderEvent } from "react-native";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GlassButton } from "../../src/components/GlassButton";
import { getAllSubjects } from "../../src/utils/cache";
import { fontStyles } from "../../src/utils/fonts";
import { getSubjectTypeColor } from "../../src/utils/subjectColors";
import { useTheme } from "../../src/utils/theme";
import {
  createSubjectList,
  deleteSubjectList,
  getSubjectLists,
  renameSubjectList,
  reorderSubjectLists,
  syncSubjectListsNow,
  SubjectList,
} from "../../src/utils/subjectLists";
const noListsIllustration = require("../../assets/images/NoLists.png");
const SUBJECT_LISTS_SHOW_PREVIEW_KEY = "subject_lists:show_preview";
const SUBJECT_LISTS_SHOW_REORDER_CONTROLS_KEY =
  "subject_lists:show_reorder_controls";

function getItemTypeColor(itemType: string): string {
  if (itemType === "radical" || itemType === "kanji" || itemType === "vocabulary" || itemType === "kana_vocabulary") {
    return getSubjectTypeColor(itemType);
  }

  return "#64748b";
}

function getSubjectPreviewLabel(subject: any, translatedMeaning: string): string {
  const characters =
    typeof subject?.data?.characters === "string"
      ? subject.data.characters.trim()
      : "";
  if (characters) {
    return characters;
  }

  const meaning =
    typeof subject?.data?.meanings?.[0]?.meaning === "string"
      ? translatedMeaning.trim()
      : "";
  return meaning ? meaning.slice(0, 2).toLocaleUpperCase("tr-TR") : "•";
}

function formatUpdatedAt(updatedAt: string): string {
  try {
    return new Date(updatedAt).toLocaleDateString();
  } catch {
    return "";
  }
}

export default function SubjectListsScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const display = useLearningDisplay();
  const [lists, setLists] = useState<SubjectList[]>([]);
  const [subjectsById, setSubjectsById] = useState<Map<number, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showItemPreview, setShowItemPreview] = useState(true);
  const [showReorderControls, setShowReorderControls] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SubjectList | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      AsyncStorage.getItem(SUBJECT_LISTS_SHOW_PREVIEW_KEY),
      AsyncStorage.getItem(SUBJECT_LISTS_SHOW_REORDER_CONTROLS_KEY),
    ])
      .then(([storedPreviewValue, storedReorderValue]) => {
        if (!isMounted) {
          return;
        }

        if (storedPreviewValue !== null) {
          setShowItemPreview(storedPreviewValue !== "false");
        }
        if (storedReorderValue !== null) {
          setShowReorderControls(storedReorderValue === "true");
        }
      })
      .catch((error) => {
        console.warn("Failed to load subject list settings:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setNewListName("");
    setIsCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
    setNewListName("");
  };

  const openRenameModal = (list: SubjectList) => {
    setRenameTarget(list);
    setRenameValue(list.name);
  };

  const closeRenameModal = () => {
    if (isRenaming) return;
    setRenameTarget(null);
    setRenameValue("");
  };

  const handlePreviewToggle = (value: boolean) => {
    setShowItemPreview(value);
    AsyncStorage.setItem(SUBJECT_LISTS_SHOW_PREVIEW_KEY, value ? "true" : "false").catch(
      (error) => {
        console.warn("Failed to save subject list preview preference:", error);
      }
    );
  };

  const handleReorderControlsToggle = (value: boolean) => {
    setShowReorderControls(value);
    AsyncStorage.setItem(
      SUBJECT_LISTS_SHOW_REORDER_CONTROLS_KEY,
      value ? "true" : "false"
    ).catch((error) => {
      console.warn("Failed to save subject list reorder setting:", error);
    });
  };

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedLists, cachedSubjects] = await Promise.all([
        getSubjectLists(),
        getAllSubjects(),
      ]);
      setLists(loadedLists);

      const nextSubjectsById = new Map<number, any>();
      if (Array.isArray(cachedSubjects)) {
        cachedSubjects.forEach((subject) => {
          if (subject?.id) {
            nextSubjectsById.set(subject.id, subject);
          }
        });
      }
      setSubjectsById(nextSubjectsById);

      // Keep UI cache-first, then refresh once cloud sync completes so
      // cross-device changes appear without leaving/re-entering the screen.
      void (async () => {
        try {
          await syncSubjectListsNow();
          const syncedLists = await getSubjectLists();
          setLists(syncedLists);
        } catch (syncError) {
          console.warn("Failed to refresh subject lists after sync:", syncError);
        }
      })();
    } catch (error) {
      console.error("Failed to load subject lists:", error);
      setLists([]);
      setSubjectsById(new Map());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleCreate = async () => {
    const name = newListName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      const created = await createSubjectList(name);
      setNewListName("");
      setIsCreateModalVisible(false);
      await reload();
      router.push({
        pathname: "/subject-list/[id]",
        params: { id: created.id },
      });
    } catch (error) {
      console.error("Failed to create list:", error);
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.failed_to_create_list_7e532f0e"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleRename = async () => {
    if (!renameTarget) return;

    const name = renameValue.trim();
    const targetName = name.length > 0 ? name : "Untitled List";
    if (targetName === renameTarget.name) {
      closeRenameModal();
      return;
    }

    setIsRenaming(true);
    try {
      const renamed = await renameSubjectList(renameTarget.id, targetName);
      if (!renamed) {
        Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.could_not_rename_this_list_679a3d0c"));
        return;
      }

      setLists((currentLists) =>
        currentLists.map((list) =>
          list.id === renamed.id ? { ...list, ...renamed } : list
        )
      );
      setRenameTarget(null);
      setRenameValue("");
    } catch (error) {
      console.error("Failed to rename list:", error);
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.failed_to_rename_list_cc319b1d"));
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = (list: SubjectList) => {
    Alert.alert(
      uiT("ui.delete_list_ed620ecf"),
      uiT("ui.delete_value_this_action_cannot_be_undone_6fc6feaf", {value1: (list.name)}),
      [
        { text: uiT("ui.cancel_19766ed6"), style: "cancel" },
        {
          text: uiT("ui.delete_e2d0a549"),
          style: "destructive",
          onPress: async () => {
            await deleteSubjectList(list.id);
            await reload();
          },
        },
      ],
    );
  };

  const handleMoveList = async (listId: string, direction: -1 | 1) => {
    if (isSavingOrder) return;

    const currentIndex = lists.findIndex((list) => list.id === listId);
    const nextIndex = currentIndex + direction;
    if (
      currentIndex === -1 ||
      nextIndex < 0 ||
      nextIndex >= lists.length
    ) {
      return;
    }

    const nextLists = [...lists];
    const [movedList] = nextLists.splice(currentIndex, 1);
    nextLists.splice(nextIndex, 0, movedList);
    setLists(nextLists);
    setIsSavingOrder(true);

    try {
      const reordered = await reorderSubjectLists(nextLists.map((list) => list.id));
      setLists(reordered);
    } catch (error) {
      console.error("Failed to reorder subject lists:", error);
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.failed_to_reorder_lists_a4ca9100"));
      await reload();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const stopCardPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: 60,
          },
        ]}
      >
        <GlassButton
          iconName="arrow-back"
          onPress={() => router.back()}
          iconColor={theme.textColor}
          variant={theme.isDark ? "colored" : "light"}
        />
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          {uiT("ui.subject_lists_20c1f7d1")} </Text>
        <View style={styles.headerActions}>
          <GlassButton
            iconName="add"
            onPress={openCreateModal}
            iconColor={theme.textColor}
            variant={theme.isDark ? "colored" : "light"}
          />
          <GlassButton
            iconName="settings-outline"
            iconSize={20}
            onPress={() => setIsSettingsModalVisible(true)}
            iconColor={theme.textColor}
            variant={theme.isDark ? "colored" : "light"}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            {uiT("ui.loading_lists_ab8a0c9b")} </Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
                {uiT("ui.no_lists_6e0f3f25")} </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {uiT("ui.create_your_first_list_to_save_subjects_for_custom_study_b01660d9")} </Text>
              <Image
                source={noListsIllustration}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={[styles.emptyAction, { backgroundColor: theme.primary }]}
                onPress={openCreateModal}
              >
                <Text style={styles.emptyActionText}>{uiT("ui.create_list_71926dae")}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) =>
            (() => {
              const previewSubjects = item.subjectIds
                .slice(0, 4)
                .map((subjectId) => subjectsById.get(subjectId))
                .filter(Boolean);
              const remainingPreviewCount = Math.max(
                0,
                item.subjectIds.length - previewSubjects.length,
              );
              const isMoveUpDisabled = index === 0 || isSavingOrder;
              const isMoveDownDisabled =
                index === lists.length - 1 || isSavingOrder;

              return (
                <TouchableOpacity
                  style={[
                    styles.listCard,
                    { backgroundColor: theme.cardBackground },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/subject-list/[id]",
                      params: { id: item.id },
                    })
                  }
                  activeOpacity={0.75}
                >
                  <View style={styles.listCardContent}>
                    <Text style={[styles.listName, { color: theme.textColor }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.listMeta, { color: theme.textSecondary }]}
                    >
                      {item.subjectIds.length} {uiT("ui.item_4a33eacd")} {uiPluralSuffix(item.subjectIds.length === 1 ? "" : "s")} {uiT("ui.updated_8c0df087")}{" "}
                      {formatUpdatedAt(item.updatedAt)}
                    </Text>
                    {showItemPreview && previewSubjects.length > 0 && (
                      <View style={styles.previewRow}>
                        {previewSubjects.map((subject) => (
                          <View
                            key={subject.id}
                            style={[
                              styles.previewChip,
                              {
                                backgroundColor: getItemTypeColor(
                                  subject.object,
                                ),
                              },
                            ]}
                          >
                            <Text
                              style={styles.previewChipText}
                            >
                              {getSubjectPreviewLabel(subject, display.meaning(subject, ""))}
                            </Text>
                          </View>
                        ))}
                        {remainingPreviewCount > 0 && (
                          <View
                            style={[
                              styles.previewMoreChip,
                              {
                                borderColor: theme.border,
                                backgroundColor: theme.backgroundColor,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.previewMoreText,
                                { color: theme.textSecondary },
                              ]}
                            >
                              +{remainingPreviewCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.actions}>
                    {showReorderControls && (
                      <View style={styles.reorderActions}>
                        <TouchableOpacity
                          style={[
                            styles.reorderButton,
                            {
                              backgroundColor: theme.isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.05)",
                              opacity: isMoveUpDisabled ? 0.4 : 1,
                            },
                          ]}
                          onPress={(event) => {
                            stopCardPress(event);
                            if (!isMoveUpDisabled) {
                              handleMoveList(item.id, -1);
                            }
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${item.name} up`}
                          accessibilityState={{ disabled: isMoveUpDisabled }}
                        >
                          <Ionicons
                            name="chevron-up"
                            size={16}
                            color={theme.textColor}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.reorderButton,
                            {
                              backgroundColor: theme.isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.05)",
                              opacity: isMoveDownDisabled ? 0.4 : 1,
                            },
                          ]}
                          onPress={(event) => {
                            stopCardPress(event);
                            if (!isMoveDownDisabled) {
                              handleMoveList(item.id, 1);
                            }
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${item.name} down`}
                          accessibilityState={{ disabled: isMoveDownDisabled }}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={16}
                            color={theme.textColor}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(event) => {
                        stopCardPress(event);
                        router.push({
                          pathname: "/custom-review-selection",
                          params: { listId: item.id },
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Review ${item.name}`}
                      accessibilityHint={uiT("ui.opens_custom_review_with_this_list_selected_1f971e74")}
                    >
                      <Ionicons
                        name="play-circle-outline"
                        size={21}
                        color={theme.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(event) => {
                        stopCardPress(event);
                        openRenameModal(item);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Rename ${item.name}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(event) => {
                        stopCardPress(event);
                        handleDelete(item);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${item.name}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={theme.error}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })()
          }
        />
      )}

      <Modal
        visible={isSettingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.settingsModalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  styles.settingsModalTitle,
                  { color: theme.textColor },
                ]}
              >
                {uiT("ui.subject_list_settings_1918324c")} </Text>
              <TouchableOpacity
                style={styles.settingsCloseButton}
                onPress={() => setIsSettingsModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={uiT("ui.close_subject_list_settings_8abbe65f")}
              >
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsRows}>
              <View
                style={[
                  styles.settingsRow,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundColor,
                  },
                ]}
              >
                <View style={styles.settingsRowIcon}>
                  <Ionicons
                    name="albums-outline"
                    size={18}
                    color={theme.textSecondary}
                  />
                </View>
                <View style={styles.settingsRowText}>
                  <Text style={[styles.settingsRowTitle, { color: theme.textColor }]}>
                    {uiT("ui.item_preview_71655c17")} </Text>
                  <Text
                    style={[
                      styles.settingsRowDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_sample_items_on_list_cards_af757959")} </Text>
                </View>
                <Switch
                  value={showItemPreview}
                  onValueChange={handlePreviewToggle}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>

              <View
                style={[
                  styles.settingsRow,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundColor,
                  },
                ]}
              >
                <View style={styles.settingsRowIcon}>
                  <Ionicons
                    name="reorder-three-outline"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
                <View style={styles.settingsRowText}>
                  <Text style={[styles.settingsRowTitle, { color: theme.textColor }]}>
                    {uiT("ui.move_arrows_bcfb3531")} </Text>
                  <Text
                    style={[
                      styles.settingsRowDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_up_and_down_controls_for_list_order_1a075a87")} </Text>
                </View>
                <Switch
                  value={showReorderControls}
                  onValueChange={handleReorderControlsToggle}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {uiT("ui.new_subject_list_6c6d74a0")} </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: theme.border,
                  color: theme.textColor,
                  backgroundColor: theme.backgroundColor,
                },
              ]}
              value={newListName}
              onChangeText={setNewListName}
              placeholder={uiT("ui.list_name_6c1247b5")}
              placeholderTextColor={theme.textLight}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={closeCreateModal}
                disabled={isCreating}
              >
                <Text
                  style={[styles.modalButtonText, { color: theme.textColor }]}
                >
                  {uiT("ui.cancel_19766ed6")} </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isCreating ? 0.7 : 1,
                  },
                ]}
                onPress={handleCreate}
                disabled={newListName.trim().length === 0 || isCreating}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {isCreating ? uiT("ui.creating_def70944") : uiT("ui.create_4759498a")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={closeRenameModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {uiT("ui.rename_subject_list_7dd253b6")} </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: theme.border,
                  color: theme.textColor,
                  backgroundColor: theme.backgroundColor,
                },
              ]}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder={uiT("ui.list_name_6c1247b5")}
              placeholderTextColor={theme.textLight}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={closeRenameModal}
                disabled={isRenaming}
              >
                <Text
                  style={[styles.modalButtonText, { color: theme.textColor }]}
                >
                  {uiT("ui.cancel_19766ed6")} </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isRenaming ? 0.7 : 1,
                  },
                ]}
                onPress={handleRename}
                disabled={isRenaming}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {isRenaming ? uiT("ui.renaming_75595af6") : uiT("ui.rename_3064d79a")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  listCard: {
    borderRadius: 14,
    marginBottom: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listCardContent: {
    flex: 1,
    marginRight: 10,
  },
  listName: {
    fontSize: 16,
    fontWeight: "700",
  },
  listMeta: {
    marginTop: 4,
    fontSize: 13,
  },
  previewRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  previewChip: {
    minWidth: 34,
    minHeight: 30,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    marginBottom: 6,
    maxWidth: "100%",
    flexShrink: 1,
  },
  previewChipText: {
    ...fontStyles.japaneseChip,
    color: "#fff",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: "100%",
    minWidth: 0,
  },
  previewMoreChip: {
    minWidth: 34,
    minHeight: 30,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    marginBottom: 6,
    maxWidth: "100%",
    flexShrink: 1,
  },
  previewMoreText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: "100%",
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reorderActions: {
    gap: 4,
  },
  reorderButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  stateText: {
    fontSize: 14,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "700",
  },
  emptyImage: {
    width: 180,
    height: 180,
  },
  emptyText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  emptyAction: {
    marginTop: 14,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  settingsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  settingsModalTitle: {
    flex: 1,
    marginBottom: 0,
  },
  settingsCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsRows: {
    gap: 10,
  },
  settingsRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsRowIcon: {
    width: 24,
    alignItems: "center",
  },
  settingsRowText: {
    flex: 1,
    minWidth: 0,
  },
  settingsRowTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  settingsRowDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalPrimaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
