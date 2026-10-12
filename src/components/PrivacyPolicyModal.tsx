import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

const LAST_UPDATED = 'August 26, 2026';
const APP_NAME = 'Kakehashi';
const CONTACT_EMAIL = 'kakehashi.app@gmail.com';

export default function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  useInterfaceLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={[styles.container]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{uiT("ui.privacy_policy_506ff394")}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.lastUpdated}>{uiT("ui.last_updated_d621a996")} {LAST_UPDATED}</Text>

          <Section title={uiT("ui.introduction_b605350b")}>
            <Text style={styles.paragraph}>
              {uiT("ui.welcome_to_0e6b8e5c")} {APP_NAME}{uiT("ui.this_privacy_policy_explains_how_we_collect_use_disclose_and_saf_9541587a")} {APP_NAME}{uiT("ui.you_agree_to_the_collection_and_use_of_information_in_accordance_8b8ba4da")} </Text>
          </Section>

          <Section title={uiT("ui.information_we_collect_a5548715")}>
            <Text style={styles.subheading}>{uiT("ui.account_information_4e59b6c7")}</Text>
            <Text style={styles.paragraph}>
              {APP_NAME} {uiT("ui.uses_the_wanikani_service_for_japanese_language_learning_to_use_o_e8f9d8d1")} </Text>
            <BulletList items={[
              'Your WaniKani API token (stored securely in encrypted device storage and not retained by Kakehashi after account verification)',
              'Your WaniKani username and profile information',
              'Your learning progress, including lessons, reviews, and statistics',
            ]} />

            <Text style={styles.subheading}>{uiT("ui.locally_stored_data_b827fede")}</Text>
            <Text style={styles.paragraph}>
              {uiT("ui.to_provide_offline_functionality_and_improve_performance_we_cache_13659b55")} </Text>
            <BulletList items={[
              'Learning subjects (kanji, radicals, vocabulary)',
              'Assignment data and review schedules',
              'Study materials and user notes',
              'Review statistics and level progressions',
              'Study-time totals scoped to your account and device',
              'Vocabulary frequency results and lookup timestamps',
              'App preferences and settings',
            ]} />

            <Text style={styles.subheading}>{uiT("ui.device_permissions_445c075b")}</Text>
            <Text style={styles.paragraph}>
              {APP_NAME} {uiT("ui.may_request_the_following_device_permissions_ec0f32d5")} </Text>
            <BulletList items={[
              'Camera: To scan and recognize Japanese text using OCR',
              'Photo Library: To save images and access photos for text recognition',
              'Microphone: For voice input and pronunciation practice features',
              'Speech Recognition: To enable voice-based interactions',
              'Notifications: To remind you about available reviews',
            ]} />
            <Text style={styles.paragraph}>
              {uiT("ui.these_permissions_are_only_used_for_the_stated_purposes_and_are_n_5eb621c4")} </Text>
          </Section>

          <Section title={uiT("ui.how_we_use_your_information_9785e877")}>
            <Text style={styles.paragraph}>
              {uiT("ui.we_use_your_information_to_1b61085c")} </Text>
            <BulletList items={[
              'Authenticate you with the WaniKani service',
              'Display your learning progress and statistics',
              'Verify your WaniKani identity and combine study-time history across your devices',
              'Provide offline access to your study materials',
              'Look up and cache vocabulary frequency ranks',
              'Send you notifications about available reviews (if enabled)',
              'Process Japanese text through OCR when you use the camera feature',
            ]} />
          </Section>

          <Section title={uiT("ui.third_party_services_7a84690f")}>
            <Text style={styles.paragraph}>
              {APP_NAME} {uiT("ui.integrates_with_the_following_third_party_services_d96a0eab")} </Text>

            <Text style={styles.subheading}>{uiT("ui.wanikani_tofugu_llc_d96dabf4")}</Text>
            <Text style={styles.paragraph}>
              {uiT("ui.we_access_the_wanikani_api_to_retrieve_and_sync_your_learning_dat_f2075225")} </Text>

            <Text style={styles.subheading}>{uiT("ui.kakehashi_backend_b8c1aee9")}</Text>
            <Text style={styles.paragraph}>
              {uiT("ui.for_account_backed_features_such_as_combined_study_time_history_y_308856cf")} </Text>

            <Text style={styles.subheading}>{uiT("ui.google_ml_kit_96bfb41f")}</Text>
            <Text style={styles.paragraph}>
              {uiT("ui.we_use_google_ml_kit_for_on_device_text_recognition_ocr_images_yo_ba757a9a")} </Text>

            <Text style={styles.subheading}>{uiT("ui.jiten_638f9526")}</Text>
            <Text style={styles.paragraph}>
              {uiT("ui.when_the_optional_vocabulary_frequency_setting_is_enabled_we_may_f3afa532")} </Text>
          </Section>

          <Section title={uiT("ui.data_storage_and_security_a0b51a86")}>
            <Text style={styles.paragraph}>
              {uiT("ui.we_take_data_security_seriously_c4333c24")} </Text>
            <BulletList items={[
              'Your WaniKani API token is stored in encrypted device storage (iOS Keychain)',
              'Kakehashi does not retain your WaniKani API token after backend identity verification',
              'Cached learning data is stored in encrypted local storage',
              'All network communications use secure HTTPS connections',
              'We do not store your WaniKani password',
            ]} />
            <Text style={styles.paragraph}>
              {uiT("ui.while_we_implement_security_measures_no_method_of_electronic_stor_a4a292ee")} </Text>
          </Section>

          <Section title={uiT("ui.data_retention_6c5a4be8")}>
            <Text style={styles.paragraph}>
              {uiT("ui.your_data_is_retained_as_follows_8491f00f")} </Text>
            <BulletList items={[
              'Cached learning data is refreshed periodically and deleted upon logout',
              'Account-backed study-time totals may remain on Kakehashi after logout or uninstall until they are deleted under our retention practices or at your request',
              'Vocabulary frequency results are refreshed periodically and remain on the device until the app data is cleared or the app is uninstalled',
              'Local preferences are cleared when you uninstall the app',
            ]} />
          </Section>

          <Section title={uiT("ui.your_rights_and_choices_11d81311")}>
            <Text style={styles.paragraph}>
              {uiT("ui.you_have_control_over_your_data_64900b10")} </Text>
            <BulletList items={[
              'Log out at any time to remove your API token from the device',
              'Deny or revoke device permissions through your device settings',
              'Disable notifications through your device settings',
              'Delete the app to remove all locally stored data',
              uiT("ui.dynamic_49f7013eeaeb", {value1: (CONTACT_EMAIL)}),
              'Manage your WaniKani account directly on wanikani.com',
            ]} />
          </Section>

          <Section title={uiT("ui.changes_to_this_policy_3c3d9482")}>
            <Text style={styles.paragraph}>
              {uiT("ui.we_may_update_this_privacy_policy_from_time_to_time_we_will_notif_e679530a")} </Text>
          </Section>

          <Section title={uiT("ui.contact_us_98b67063")}>
            <Text style={styles.paragraph}>
              {uiT("ui.if_you_have_questions_or_concerns_about_this_privacy_policy_pleas_7ac5db70")} </Text>
            <Text style={styles.contactInfo}>
              {uiT("ui.email_17507dcf")} {CONTACT_EMAIL}
            </Text>
          </Section>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} {APP_NAME}{uiT("ui.all_rights_reserved_8faa0732")} </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  useInterfaceLanguage();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  useInterfaceLanguage();
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    marginBottom: 12,
  },
  bulletList: {
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 15,
    color: '#00A3FF',
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  contactInfo: {
    fontSize: 15,
    lineHeight: 24,
    color: '#00A3FF',
    marginTop: 8,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
  },
});
