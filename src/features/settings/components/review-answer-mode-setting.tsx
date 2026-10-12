import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import React from "react";
import { Text, View } from "react-native";
import { useSettingsStore } from "../../../utils/store";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { SettingsChoiceCards } from "../../../ui/settings/settings-choice-cards";
export function ReviewAnswerModeSetting() {
  useInterfaceLanguage();
  const { theme } = useSettingsControllerContext();
  const anki = useSettingsStore((s) => s.ankiCardMode),
    choice = useSettingsStore((s) => s.reviewMultipleChoiceEnabled),
    scope = useSettingsStore((s) => s.ankiCardModeScope);
  const mode = anki ? "anki" : choice ? "choice" : "type";
  function choose(next: "type" | "choice" | "anki") {
    const store = useSettingsStore.getState();
    store.setAnkiCardMode(next === "anki");
    if (next !== "anki")
      store.setReviewMultipleChoiceEnabled(next === "choice");
  }
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <SettingsChoiceCards
        label={uiT("ui.answer_mode_ac3294db")}
        value={mode}
        theme={theme}
        options={[
          {
            value: "type",
            label: uiT("ui.type_answers_651390d0"),
            description: uiT("ui.recall_and_type_aa8894c4"),
            art: "type",
          },
          {
            value: "choice",
            label: uiT("ui.multiple_choice_79fefc32"),
            description: uiT("ui.pick_the_answer_a27c991a"),
            art: "choice",
          },
          {
            value: "anki",
            label: uiT("ui.anki_cards_0807614b"),
            description: uiT("ui.reveal_and_grade_a87777d3"),
            art: "cards",
          },
        ]}
        onChange={choose}
      />
      {anki ? (
        <>
          <SettingsChoiceCards
            label={uiT("ui.anki_applies_to_7cc2f981")}
            compact
            value={scope}
            theme={theme}
            options={[
              { value: "both", label: uiT("ui.both_b6c1d862"), art: "both" },
              { value: "meaning", label: uiT("ui.meanings_6379cd5b"), art: "meaning" },
              { value: "reading", label: uiT("ui.readings_f3a97d44"), art: "reading" },
            ]}
            onChange={(next) => {
              const store = useSettingsStore.getState();
              store.setAnkiCardModeScope(next);
              if (next !== "both") store.setAnkiGroupQuestions(false);
            }}
          />
          {scope !== "both" ? (
            <SettingsChoiceCards
              label={uiT("ui.other_questions_use_13d40160")}
              compact
              value={choice ? "choice" : "type"}
              theme={theme}
              options={[
                { value: "type", label: uiT("ui.type_answers_651390d0"), art: "type" },
                { value: "choice", label: uiT("ui.multiple_choice_79fefc32"), art: "choice" },
              ]}
              onChange={(next) =>
                useSettingsStore
                  .getState()
                  .setReviewMultipleChoiceEnabled(next === "choice")
              }
            />
          ) : null}
          <Text
            style={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              fontSize: 12,
              color: theme.textSecondary,
            }}
          >
            {uiT("ui.anki_questions_keep_their_reveal_and_grade_behaviour_other_questi_1e9a759d")} </Text>
        </>
      ) : null}
    </View>
  );
}
