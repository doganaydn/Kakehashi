import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "../utils/theme";
import { formatSubtitleOffset, SUBTITLE_OFFSET_LIMIT_MS, SUBTITLE_OFFSET_STEP_MS } from "../../shared/subtitleTiming";

export function SubtitleTimingControls({ offsetMs, onChange, ready, error }: {
  offsetMs: number; onChange: (value: number) => void; ready: boolean; error: string | null;
}) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  return <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={{ paddingVertical: 12 }}>
      <Text style={{ color: theme.primary }}>{uiT("ui.subtitle_timing_a72fc6a3")} {formatSubtitleOffset(offsetMs)}</Text>
    </TouchableOpacity>
    {expanded ? <View style={{ gap: 8 }}>
      <Text style={{ color: theme.textSecondary }}>{uiT("ui.move_subtitles_earlier_or_later_to_match_the_audio_saved_for_this_97404ae5")}</Text>
      <Slider accessibilityLabel={uiT("ui.subtitle_timing_offset_f43d8b2a")} disabled={!ready} minimumValue={-SUBTITLE_OFFSET_LIMIT_MS} maximumValue={SUBTITLE_OFFSET_LIMIT_MS}
        step={SUBTITLE_OFFSET_STEP_MS} value={offsetMs} onValueChange={onChange} minimumTrackTintColor={theme.primary} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        {[{ label: uiT("ui.earlier_0_1s_9e659a33"), value: offsetMs - SUBTITLE_OFFSET_STEP_MS, disabled: offsetMs <= -SUBTITLE_OFFSET_LIMIT_MS },
          { label: uiT("ui.reset_timing_77ca48aa"), value: 0, disabled: offsetMs === 0 },
          { label: uiT("ui.later_0_1s_5b896cdf"), value: offsetMs + SUBTITLE_OFFSET_STEP_MS, disabled: offsetMs >= SUBTITLE_OFFSET_LIMIT_MS }].map(action =>
          <TouchableOpacity key={action.label} accessibilityRole="button" disabled={!ready || action.disabled} onPress={() => onChange(action.value)}
            style={{ minHeight: 44, justifyContent: "center", opacity: !ready || action.disabled ? 0.4 : 1 }}>
            <Text style={{ color: theme.primary }}>{action.label}</Text>
          </TouchableOpacity>)}
      </View>
    </View> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: theme.error }}>{error}</Text> : null}
  </View>;
}
