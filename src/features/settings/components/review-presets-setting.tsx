import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";

import { router } from "expo-router";
import { useSettingsStore } from "../../../utils/store";
import { useTheme } from "../../../utils/theme";
import { MAX_REVIEW_PRESETS } from "../../../utils/review-presets";
import { getReviewOrderLabel } from "../../../utils/reviewOrdering";
import { styles } from "../styles";

export function ReviewPresetsSetting() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const enabled = useSettingsStore((state) => state.reviewPresetsEnabled);
  const presets = useSettingsStore((state) => state.reviewPresets);
  const setEnabled = useSettingsStore((state) => state.setReviewPresetsEnabled);
  const atLimit = presets.length >= MAX_REVIEW_PRESETS;

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
      <View style={styles.settingItem}>
        <Ionicons name="grid-outline" size={24} color={theme.primary} style={styles.settingIcon} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingText, { color: theme.textColor }]}>{uiT("ui.review_presets_6addcd9f")}</Text>
          <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>{uiT("ui.choose_up_to_3_presets_from_the_home_card_c71453d8")}</Text>
        </View>
        <Switch accessibilityLabel={uiT("ui.review_presets_6addcd9f")} value={enabled} onValueChange={setEnabled} trackColor={{ false: "#767577", true: theme.primary }} thumbColor="#f4f3f4" />
      </View>
      {enabled ? (
        <View style={{ marginLeft: 56, marginRight: 16, marginBottom: 16 }}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              onPress={() => router.push({ pathname: "/review-preset", params: { id: preset.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${preset.name} preset`}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.border }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.textColor }}>{preset.name}</Text>
                <Text style={{ fontSize: 13, marginTop: 3, color: theme.textSecondary }}>{preset.batchSize} {uiT("ui.reviews_e0652efe")} {getReviewOrderLabel(preset.reviewOrder)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => router.push("/review-preset")}
            disabled={atLimit}
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.add_preset_0b0bb9c5")}
            accessibilityState={{ disabled: atLimit }}
            style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, padding: 12, borderRadius: 8, backgroundColor: theme.border, opacity: atLimit ? 0.4 : 1 }}
          >
            <Ionicons name="add" size={18} color={theme.primary} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>{uiT("ui.add_preset_0b0bb9c5")}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, textAlign: "center", color: theme.textSecondary, marginTop: 8 }}>{presets.length} {uiT("ui.of_28391d3b")} {MAX_REVIEW_PRESETS} {uiT("ui.presets_4700153d")}{atLimit ? uiT("ui.limit_reached_ce3b78af") : ""}</Text>
        </View>
      ) : null}
    </View>
  );
}
