import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import KanaInput from '../../src/components/TextToKanaInput';

export default function TestKanaInput() {
  useInterfaceLanguage();
  const [currentKana, setCurrentKana] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handleKanaChange = (kana: string) => {
    setCurrentKana(kana);
    // Add to history when the input is complete (no trailing 'n')
    if (!kana.endsWith('n')) {
      setHistory(prev => [kana, ...prev].slice(0, 10));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{uiT("ui.kana_input_test_274d9872")}</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{uiT("ui.type_to_convert_to_kana_a21aeb53")}</Text>
          <KanaInput
            style={styles.input}
            onKanaChange={handleKanaChange}
            placeholder={uiT("ui.type_romaji_here_1dbeaead")}
          />
        </View>

        <View style={styles.currentContainer}>
          <Text style={styles.label}>{uiT("ui.current_input_47bfdf11")}</Text>
          <Text style={styles.currentText}>{currentKana || uiT("ui.empty_d29a0939")}</Text>
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.label}>{uiT("ui.recent_conversions_f63b59e9")}</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>{uiT("ui.no_conversions_yet_c61a00b3")}</Text>
          ) : (
            history.map((kana, index) => (
              <Text key={index} style={styles.historyItem}>
                {kana}
              </Text>
            ))
          )}
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>{uiT("ui.instructions_4de0bc28")}</Text>
          <Text style={styles.instructionsText}>
            {uiT("ui.type_romaji_to_convert_to_hiragana_1e5539ff")}{'\n'}
            {uiT("ui.use_n_for_49983954")}{'\n'}
            {uiT("ui.type_nn_for_ae212f1e")}{'\n'}
            {uiT("ui.use_x_before_a_letter_for_small_kana_06f75aae")}{'\n'}
            {uiT("ui.type_xtsu_for_204c2a3c")}{'\n'}
            {uiT("ui.use_for_long_vowels_acb3f9a0")}{'\n'}
            {uiT("ui.type_wo_for_89d7f8e9")} </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currentContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currentText: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
  },
  historyContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  historyItem: {
    fontSize: 18,
    color: '#333',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  instructionsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 