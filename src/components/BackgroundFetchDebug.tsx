import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import WaniKaniBackgroundFetch from '../modules/WaniKaniBackgroundFetch';
import { useTheme } from '../utils/theme';

export function BackgroundFetchDebug() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = () => {
    if (WaniKaniBackgroundFetch) {
      const fetchStatus = WaniKaniBackgroundFetch.getBackgroundFetchStatus();
      setStatus(fetchStatus);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const triggerManualFetch = async () => {
    if (!WaniKaniBackgroundFetch) {
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.background_fetch_not_available_54f9b5c6"));
      return;
    }

    setLoading(true);
    try {
      const result = await WaniKaniBackgroundFetch.triggerBackgroundFetchManually();
      Alert.alert(uiT("ui.background_fetch_result_1950fbf9"), uiT("ui.result_value_review_count_value_timestamp_value_15a1f337", {value1: (result.result), value2: (result.reviewCount), value3: (new Date(result.timestamp).toLocaleString())}));
      loadStatus();
    } catch {
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.failed_to_trigger_background_fetch_16ded5a2"));
    } finally {
      setLoading(false);
    }
  };

  if (!WaniKaniBackgroundFetch) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.title, { color: theme.textColor }]}>{uiT("ui.background_fetch_debug_dbf6d2e8")}</Text>
      
      {status && (
        <View style={styles.statusContainer}>
          <StatusRow label={uiT("ui.last_fetch_571d873d")} value={status.timeSinceLastFetch} color={theme.textColor} />
          <StatusRow label={uiT("ui.review_count_35f417e3")} value={status.currentReviewCount.toString()} color={theme.textColor} />
          <StatusRow label={uiT("ui.api_token_c85b0e36")} value={status.hasApiToken ? '✅ Set' : '❌ Not Set'} color={theme.textColor} />
          <StatusRow label={uiT("ui.badge_enabled_941e6479")} value={status.badgeEnabled ? '✅ Yes' : '❌ No'} color={theme.textColor} />
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
        onPress={triggerManualFetch}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? uiT("ui.triggering_b7f2a98c") : uiT("ui.trigger_manual_fetch_0cc9c7b3")}</Text>
      </TouchableOpacity>

      <Text style={[styles.note, { color: theme.textColor }]}>
        {uiT("ui.note_check_xcode_console_for_detailed_logs_661d6e92")} </Text>
    </View>
  );
}

function StatusRow({ label, value, color }: { label: string; value: string; color: string }) {
  useInterfaceLanguage();
  return (
    <View style={styles.statusRow}>
      <Text style={[styles.statusLabel, { color }]}>{label}:</Text>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});