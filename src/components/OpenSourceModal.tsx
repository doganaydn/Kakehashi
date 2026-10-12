import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GitHubMark from "./GitHubMark";
import { KAKEHASHI_REPOSITORY_URL } from "../utils/openSourceAnnouncement";
import { useTheme } from "../utils/theme";

type OpenSourceModalProps = {
  visible: boolean;
  onClose: () => void | Promise<void>;
};

export default function OpenSourceModal({
  visible,
  onClose,
}: OpenSourceModalProps) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpeningRepository, setIsOpeningRepository] = useState(false);

  const handleClose = async () => {
    await Promise.resolve(onClose());
  };

  const handleOpenRepository = async () => {
    if (isOpeningRepository) {
      return;
    }

    setIsOpeningRepository(true);

    try {
      const canOpenRepository = await Linking.canOpenURL(
        KAKEHASHI_REPOSITORY_URL,
      );
      if (!canOpenRepository) {
        Alert.alert(
          uiT("ui.unable_to_open_github_06e993cb"),
          uiT("ui.could_not_open_the_repository_right_now_please_try_again_later_f5945b5d"),
        );
        return;
      }

      await Promise.resolve(onClose());
      await Linking.openURL(KAKEHASHI_REPOSITORY_URL);
    } catch (error) {
      console.error("Failed to open GitHub repository:", error);
      Alert.alert(
        uiT("ui.unable_to_open_github_06e993cb"),
        uiT("ui.could_not_open_the_repository_right_now_please_try_again_later_f5945b5d"),
      );
    } finally {
      setIsOpeningRepository(false);
    }
  };

  const textColor = theme.textColor;
  const iconColor = theme.isDark ? "#FFFFFF" : "#24292F";

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: theme.isDark ? "#FFFFFF" : "#24292F",
                  },
                ]}
              >
                <GitHubMark
                  size={34}
                  color={theme.isDark ? "#24292F" : "#FFFFFF"}
                  accessibilityLabel={uiT("ui.github_f911e414")}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={uiT("ui.close_7d9eb7ac")}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: theme.backgroundColor },
                  pressed && styles.pressed,
                ]}
                onPress={handleClose}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.title, { color: textColor }]}>
              {uiT("ui.kakehashi_is_open_source_90f5b718")} </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {uiT("ui.you_can_now_read_the_code_contribute_fixes_or_ideas_and_star_the_2d863669")} </Text>

            <View style={styles.actionList}>
              <OpenSourceAction
                icon="git-pull-request-outline"
                title={uiT("ui.contribute_97b0c61b")}
                description={uiT("ui.open_issues_send_pull_requests_or_help_shape_what_comes_next_60f39ea3")}
              />
              <OpenSourceAction
                icon="star-outline"
                title={uiT("ui.star_the_repo_b6f09096")}
                description={uiT("ui.a_star_helps_other_wanikani_learners_find_the_project_4418b89f")}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}
              onPress={handleOpenRepository}
              disabled={isOpeningRepository}
            >
              {isOpeningRepository ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <GitHubMark size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{uiT("ui.open_on_github_03f69885")}</Text>
                </>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
              onPress={handleClose}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.textSecondary },
                ]}
              >
                {uiT("ui.not_now_a0e63d7c")} </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </View>
    </Modal>
  );

  function OpenSourceAction({
    icon,
    title,
    description,
  }: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    description: string;
  }) {
  useInterfaceLanguage();
    return (
      <View style={styles.actionRow}>
        <View
          style={[
            styles.actionIcon,
            { backgroundColor: theme.backgroundColor },
          ]}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={[styles.actionTitle, { color: textColor }]}>
            {title}
          </Text>
          <Text
            style={[
              styles.actionDescription,
              { color: theme.textSecondary },
            ]}
          >
            {description}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
  },
  card: {
    width: "100%",
    maxWidth: 430,
    maxHeight: "100%",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  content: {
    padding: 22,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  description: {
    fontSize: 16,
    lineHeight: 23,
  },
  actionList: {
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
  },
});
