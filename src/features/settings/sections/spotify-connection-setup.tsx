import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { isSpotifyClientIdValid } from "../../../services/spotifyService";
import { useSettingsControllerContext } from "../SettingsControllerContext";

const SPOTIFY_DASHBOARD_URL = "https://developer.spotify.com/dashboard";
const SPOTIFY_DEVELOPMENT_MODE_URL =
  "https://developer.spotify.com/documentation/web-api/concepts/quota-modes";
const SPOTIFY_REDIRECT_URI_URL =
  "https://developer.spotify.com/documentation/web-api/concepts/redirect_uri";

export function SpotifyConnectionSetup({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  useInterfaceLanguage();
  const {
    getSpotifyStatusLabel,
    handleSpotifyLogin,
    handleSpotifyLogout,
    isSpotifyAuthenticating,
    isSpotifyAuthAvailable,
    isSpotifyConfiguring,
    saveSpotifyClientId,
    spotifyAuthStatus,
    spotifyClientId,
    spotifyRedirectUri,
    theme,
  } = useSettingsControllerContext();
  const [clientIdDraft, setClientIdDraft] = useState(spotifyClientId);
  const [showGuide, setShowGuide] = useState(!spotifyClientId);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setClientIdDraft(spotifyClientId);
  }, [spotifyClientId]);

  const isConnected = spotifyAuthStatus === "authorized";
  const isBusy = isSaving || isSpotifyConfiguring || isSpotifyAuthenticating;
  const hasUnsavedChanges = clientIdDraft.trim() !== spotifyClientId;
  const bodyStyle = [setupStyles.body, { color: theme.textSecondary }];
  const headingStyle = [setupStyles.heading, { color: theme.textColor }];
  const linkStyle = [setupStyles.link, { color: theme.primary }];

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setError(uiT("ui.message_a7d7a79db6cc"));
    }
  };

  const saveClientId = async (remove = false) => {
    if (isBusy) return;
    setError("");
    setNotice("");
    const nextClientId = remove ? "" : clientIdDraft.trim();
    if (!remove && !isSpotifyClientIdValid(nextClientId)) {
      setError(
        uiT("ui.message_4c87969c3d65"),
      );
      return;
    }
    setIsSaving(true);
    try {
      await saveSpotifyClientId(nextClientId);
      setClientIdDraft(nextClientId);
      setNotice(
        remove
          ? "Client ID removed and Spotify disconnected."
          : "Client ID saved. You can now connect Spotify.",
      );
      if (remove) setShowGuide(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your Spotify Client ID. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const disconnect = async () => {
    setError("");
    setNotice("");
    try {
      await handleSpotifyLogout();
    } catch {
      setError(uiT("ui.message_103b64fb52a2"));
    }
  };

  return (
    <View style={[setupStyles.container, { borderTopColor: theme.border }]}>
      <TouchableOpacity
        style={setupStyles.disclosure}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={uiT("ui.spotify_connection_settings_30824256")}
        accessibilityState={{ expanded }}
      >
        <View style={setupStyles.disclosureText}>
          <Text style={headingStyle}>{uiT("ui.spotify_connection_1e8002a4")}</Text>
          <Text style={bodyStyle}>
            {spotifyClientId
              ? getSpotifyStatusLabel()
              : uiT("ui.set_up_your_personal_spotify_app_to_connect_c1dffa34")}
          </Text>
        </View>
        <Text style={linkStyle}>
          {expanded ? uiT("ui.hide_ac20a57b") : spotifyClientId ? uiT("ui.manage_5a234448") : uiT("ui.set_up_4da10f1f")}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={setupStyles.content}>
          <Text style={bodyStyle}>
            {uiT("ui.your_personal_client_id_connects_playlists_and_playback_song_sear_ccb9a4f0")} </Text>

          <TouchableOpacity
            onPress={() => setShowGuide((visible) => !visible)}
            style={setupStyles.textButton}
            accessibilityRole="button"
            accessibilityState={{ expanded: showGuide }}
          >
            <Text style={linkStyle}>
              {showGuide ? uiT("ui.hide_setup_guide_6f9e7e49") : uiT("ui.show_setup_guide_df5af19c")}
            </Text>
          </TouchableOpacity>

          {showGuide && (
            <View style={setupStyles.guide}>
              <View style={setupStyles.step}>
                <Text style={headingStyle}>{uiT("ui.before_you_start_74e492d5")}</Text>
                <Text style={bodyStyle}>
                  {uiT("ui.you_need_spotify_premium_on_the_account_that_owns_the_developer_a_31cb612d")} </Text>
                <Text style={bodyStyle}>
                  {uiT("ui.install_spotify_and_sign_in_with_that_same_account_open_spotify_a_a988bd3c")} </Text>
                <Text style={bodyStyle}>
                  {uiT("ui.spotify_development_apps_allow_up_to_5_authorized_users_this_guid_95d14b50")} </Text>
              </View>

              <View style={setupStyles.step}>
                <Text style={headingStyle}>
                  {uiT("ui.1_open_the_developer_dashboard_73c893f4")} </Text>
                <Text style={bodyStyle}>
                  {uiT("ui.sign_in_with_your_premium_spotify_account_and_accept_spotify_s_de_f6754cb7")} </Text>
                <TouchableOpacity
                  accessibilityRole="link"
                  style={setupStyles.textButton}
                  onPress={() => void openLink(SPOTIFY_DASHBOARD_URL)}
                >
                  <Text style={linkStyle}>
                    {uiT("ui.open_spotify_developer_dashboard_cc109654")} </Text>
                </TouchableOpacity>
              </View>

              <View style={setupStyles.step}>
                <Text style={headingStyle}>{uiT("ui.2_create_your_spotify_app_a8482501")}</Text>
                <Text style={bodyStyle}>
                  {uiT("ui.choose_create_app_use_kakehashi_personal_as_the_app_name_and_pers_6885d313")} </Text>
                <Text style={bodyStyle}>
                  {uiT("ui.add_this_exact_value_under_redirect_uris_choose_add_then_save_the_e1c72e4c")} </Text>
                <Text
                  selectable
                  accessibilityLabel={uiT("ui.dynamic_a11eceb5b70e", {value1: (spotifyRedirectUri)})}
                  style={[
                    setupStyles.redirectUri,
                    {
                      color: theme.textColor,
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundColor,
                    },
                  ]}
                >
                  {spotifyRedirectUri}
                </Text>
              </View>

              <View style={setupStyles.step}>
                <Text style={headingStyle}>{uiT("ui.3_copy_your_client_id_db4be48f")}</Text>
                <Text style={bodyStyle}>
                  {uiT("ui.open_your_new_app_s_settings_and_copy_the_client_id_in_users_mana_2abd35e5")} </Text>
                <Text style={bodyStyle}>
                  {uiT("ui.kakehashi_only_needs_the_client_id_the_client_secret_is_never_nee_c7175754")} </Text>
              </View>

              <View style={setupStyles.step}>
                <Text style={headingStyle}>{uiT("ui.4_save_and_connect_e13b3522")}</Text>
                <Text style={bodyStyle}>
                  {uiT("ui.paste_your_client_id_below_and_tap_save_client_id_then_tap_connec_c094c18e")} </Text>
              </View>
            </View>
          )}

          <View style={setupStyles.step}>
            <Text style={headingStyle}>{uiT("ui.client_id_8726db01")}</Text>
            <TextInput
              accessibilityLabel={uiT("ui.spotify_client_id_8426bbd3")}
              placeholder={uiT("ui.paste_your_32_character_client_id_20a99e7e")}
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              editable={!isBusy}
              value={clientIdDraft}
              onChangeText={(value) => {
                setClientIdDraft(value);
                setError("");
                setNotice("");
              }}
              style={[
                setupStyles.input,
                {
                  color: theme.textColor,
                  borderColor: error ? theme.error : theme.border,
                  backgroundColor: theme.backgroundColor,
                },
              ]}
            />
            <Text style={bodyStyle}>
              {uiT("ui.use_the_client_id_not_the_client_secret_it_is_saved_on_this_devic_167d8df5")} {spotifyClientId
                ? uiT("ui.replacing_or_removing_it_disconnects_spotify_5c2cc103")
                : ""}
            </Text>
          </View>

          {!!error && (
            <Text
              selectable
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[setupStyles.body, { color: theme.error }]}
            >
              {error}
            </Text>
          )}
          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={bodyStyle}>
              {notice}
            </Text>
          )}

          <View style={setupStyles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: isBusy || !hasUnsavedChanges }}
              disabled={isBusy || !hasUnsavedChanges}
              onPress={() => void saveClientId()}
              style={[
                setupStyles.button,
                { borderColor: theme.border },
                (isBusy || !hasUnsavedChanges) && setupStyles.disabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text
                  style={[setupStyles.buttonText, { color: theme.primary }]}
                >
                  {uiT("ui.save_client_id_53cc74ba")} </Text>
              )}
            </TouchableOpacity>
            {!isConnected && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    isBusy || !isSpotifyAuthAvailable || hasUnsavedChanges,
                }}
                disabled={
                  isBusy || !isSpotifyAuthAvailable || hasUnsavedChanges
                }
                onPress={() => void handleSpotifyLogin()}
                style={[
                  setupStyles.button,
                  {
                    borderColor: theme.primary,
                    backgroundColor: theme.primary,
                  },
                  (isBusy || !isSpotifyAuthAvailable || hasUnsavedChanges) &&
                    setupStyles.disabled,
                ]}
              >
                {isSpotifyAuthenticating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[setupStyles.buttonText, { color: "#fff" }]}>
                    {uiT("ui.connect_spotify_f6e6c0da")} </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {hasUnsavedChanges && (
            <Text style={bodyStyle}>
              {uiT("ui.save_your_client_id_before_connecting_980ea9ef")} </Text>
          )}
          {!!spotifyClientId && (
            <View style={setupStyles.actions}>
              {isConnected && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isBusy }}
                  disabled={isBusy}
                  style={setupStyles.textButton}
                  onPress={() => void disconnect()}
                >
                  <Text style={linkStyle}>{uiT("ui.disconnect_spotify_79d1bd50")}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy }}
                disabled={isBusy}
                style={setupStyles.textButton}
                onPress={() => void saveClientId(true)}
              >
                <Text style={[setupStyles.link, { color: theme.error }]}>
                  {uiT("ui.remove_client_id_ca663251")} </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ expanded: showTroubleshooting }}
            style={setupStyles.textButton}
            onPress={() => setShowTroubleshooting((visible) => !visible)}
          >
            <Text style={linkStyle}>
              {showTroubleshooting ? uiT("ui.hide_troubleshooting_47887442") : uiT("ui.troubleshooting_c3af076f")}
            </Text>
          </TouchableOpacity>
          {showTroubleshooting && (
            <View style={setupStyles.guide}>
              <Text style={bodyStyle}>
                {uiT("ui.invalid_redirect_uri_check_that_your_app_s_saved_redirect_uris_in_eccfe674")} </Text>
              <Text style={bodyStyle}>
                {uiT("ui.access_denied_check_the_saved_client_id_sign_in_with_the_account_f21d01c7")} </Text>
              <Text style={bodyStyle}>
                {uiT("ui.premium_required_check_that_the_developer_app_owner_s_premium_sub_2da40811")} </Text>
              <Text style={bodyStyle}>
                {uiT("ui.playlist_will_not_import_spotify_development_apps_can_only_read_t_f14324a7")} </Text>
              <Text style={bodyStyle}>
                {uiT("ui.no_active_device_open_spotify_play_a_track_then_return_to_kakehas_2cb925bd")} </Text>
              <TouchableOpacity
                accessibilityRole="link"
                style={setupStyles.textButton}
                onPress={() => void openLink(SPOTIFY_DEVELOPMENT_MODE_URL)}
              >
                <Text style={linkStyle}>
                  {uiT("ui.spotify_development_mode_requirements_5f7b4781")} </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="link"
                style={setupStyles.textButton}
                onPress={() => void openLink(SPOTIFY_REDIRECT_URI_URL)}
              >
                <Text style={linkStyle}>{uiT("ui.spotify_redirect_uri_help_996dd782")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const setupStyles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth },
  disclosure: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  disclosureText: { flex: 1, gap: 4 },
  content: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  heading: { fontSize: 15, fontWeight: "600" },
  body: { fontSize: 14, lineHeight: 21 },
  link: { fontSize: 14, fontWeight: "600" },
  guide: { gap: 16 },
  step: { gap: 8 },
  textButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  redirectUri: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "monospace",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  button: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonText: { fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
