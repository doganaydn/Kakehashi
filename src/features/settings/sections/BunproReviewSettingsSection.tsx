import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  clearBunproApiToken,
  getStoredBunproApiToken,
  saveBunproApiToken,
  validateBunproApiToken,
} from "../../../utils/bunproApi";
import { useOptionalScreenIsFocused } from "../../../utils/navigation-focus";
import { isPortegoUsername } from "../../../utils/portegoAccess";
import { useAuthStore, useSettingsStore } from "../../../utils/store";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function BunproReviewSettingsSection() {
  useInterfaceLanguage();
  const username = useAuthStore((state) => state.userData?.username);
  const userId = useAuthStore((state) => state.userData?.id);
  return isPortegoUsername(username) ? (
    <BunproReviewSettingsContent key={`${userId}:${username}`} />
  ) : null;
}

function BunproReviewSettingsContent() {
  useInterfaceLanguage();
  const { theme, updateSectionOffset } = useSettingsControllerContext();
  const settings = useSettingsStore((state) => state);
  const focused = useOptionalScreenIsFocused();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const mounted = useRef(true);
  const mutationInFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!focused) return;
    let active = true;
    setLoading(true);
    void getStoredBunproApiToken().then((token) => {
      if (!active) return;
      setHasApiKey(Boolean(token));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [focused]);

  const saveApiKey = async () => {
    if (loading || mutationInFlight.current) return;
    const apiKey = apiKeyInput.trim();
    if (!apiKey) {
      setStatus({ message: uiT("ui.enter_your_bunpro_api_key_first_40a80f37"), error: true });
      return;
    }
    mutationInFlight.current = true;
    setSaving(true);
    setStatus({ message: uiT("ui.validating_bunpro_api_key_a36d9a1a"), error: false });
    try {
      const valid = await validateBunproApiToken(apiKey);
      if (!mounted.current) return;
      if (!valid) {
        setStatus({
          message:
            uiT("ui.that_api_key_is_invalid_or_bunpro_is_unavailable_right_now_36f9c3b7"),
          error: true,
        });
        return;
      }
      await saveBunproApiToken(apiKey);
      if (!mounted.current) return;
      setHasApiKey(true);
      setApiKeyInput("");
      setStatus({ message: uiT("ui.bunpro_api_key_saved_f36e2b8e"), error: false });
    } catch {
      if (mounted.current)
        setStatus({
          message: uiT("ui.the_api_key_could_not_be_saved_please_try_again_606c4c74"),
          error: true,
        });
    } finally {
      mutationInFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const removeApiKey = async () => {
    if (loading || mutationInFlight.current) return;
    mutationInFlight.current = true;
    setSaving(true);
    setStatus(null);
    try {
      await clearBunproApiToken();
      const remainingToken = await getStoredBunproApiToken();
      if (!mounted.current) return;
      if (remainingToken) {
        setStatus({
          message: uiT("ui.the_api_key_could_not_be_removed_please_try_again_852e94eb"),
          error: true,
        });
        return;
      }
      setHasApiKey(false);
      setApiKeyInput("");
      setStatus({ message: uiT("ui.bunpro_api_key_removed_ea678b81"), error: false });
    } finally {
      mutationInFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const toggles = [
    [
      "Show details on wrong answer",
      "Open Bunpro item details after an incorrect answer.",
      "details-auto",
      settings.showDetailsOnWrongAnswer,
      settings.setShowDetailsOnWrongAnswer,
    ],
    [
      "Answer feedback sounds",
      "Play sounds for correct and incorrect answers.",
      "feedback-sound",
      settings.answerFeedbackSoundEnabled,
      settings.setAnswerFeedbackSoundEnabled,
    ],
    [
      "Bunpro keyboard shortcuts",
      "Use a physical keyboard to control Bunpro reviews.",
      "shortcuts",
      settings.reviewKeyboardShortcutsEnabled,
      settings.setReviewKeyboardShortcutsEnabled,
    ],
    [
      "Hide Bunpro furigana",
      "Tap a word in Bunpro reviews to keep its reading visible. Tap again to hide it.",
      "furigana",
      settings.bunproHideFurigana,
      settings.setBunproHideFurigana,
    ],
  ] as const;
  const busy = loading || saving;

  return (
    <SettingsSectionSurface
      style={[
        styles.section,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
      onLayout={(event) =>
        updateSectionOffset("bunproReviews", event.nativeEvent.layout.y)
      }
    >
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.textColor, borderBottomColor: theme.border },
        ]}
      >
        {uiT("ui.bunpro_reviews_3d16c9d5")} </Text>
      <View style={styles.settingItemColumn}>
        <View style={[styles.settingRow, { marginBottom: 8 }]}>
          <Ionicons
            name="key-outline"
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.bunpro_api_key_211ae3b6")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {loading
                ? uiT("ui.checking_saved_api_key_1e9c2c25")
                : hasApiKey
                  ? uiT("ui.an_api_key_is_saved_paste_a_new_key_to_replace_it_bc57d0e3")
                  : uiT("ui.add_your_api_key_to_connect_bunpro_51e19fc4")}
            </Text>
          </View>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel={uiT("ui.bunpro_api_key_211ae3b6")}
            value={apiKeyInput}
            onChangeText={(value) => {
              setApiKeyInput(value);
              setStatus(null);
            }}
            placeholder={uiT("ui.paste_bunpro_api_key_88fa1aa5")}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            secureTextEntry
            editable={!busy}
            style={[
              styles.textInput,
              {
                flex: 1,
                marginTop: 0,
                borderColor: theme.border,
                color: theme.textColor,
              },
            ]}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.save_bunpro_api_key_139c93aa")}
            disabled={busy}
            onPress={() => void saveApiKey()}
            style={[
              styles.inputIconButton,
              { backgroundColor: theme.primary },
              busy && styles.syncButtonDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#fff" />
            )}
          </TouchableOpacity>
          {hasApiKey ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={uiT("ui.remove_bunpro_api_key_6f196c8c")}
              disabled={busy}
              onPress={() => void removeApiKey()}
              style={[
                styles.inputIconButton,
                { backgroundColor: theme.error },
                busy && styles.syncButtonDisabled,
              ]}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
        {status ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.settingSubtext,
              { color: status.error ? theme.error : theme.textSecondary },
            ]}
          >
            {status.message}
          </Text>
        ) : null}
      </View>
      {hasApiKey && !loading
        ? toggles.map(([label, description, setting, value, onChange]) => (
            <View
              key={label}
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >
              <SettingsRowIcon setting={setting} color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {label}
                </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {description}
                </Text>
              </View>
              <Switch
                accessibilityLabel={label}
                value={value ?? false}
                onValueChange={onChange}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
          ))
        : null}
    </SettingsSectionSurface>
  );
}
