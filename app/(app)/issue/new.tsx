import { uiT, useInterfaceLanguage } from "../../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown, { RenderRules } from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  imageUploadService,
  isIssueMediaBucketNotFoundError,
  isIssueMediaTooLargeError,
  ISSUE_MEDIA_MAX_BYTES,
} from "../../../src/services/imageUploadService";
import { issueService } from "../../../src/services/issueService";
import { useAuthStore, useSettingsStore } from "../../../src/utils/store";
import { useTheme } from "../../../src/utils/theme";

const MAX_MEDIA_SIZE_MB = ISSUE_MEDIA_MAX_BYTES / (1024 * 1024);

export default function NewIssueScreen() {
  useInterfaceLanguage();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { apiToken, userData } = useAuthStore();
  const { gravatarEmail } = useSettingsStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<"write" | "preview">("write");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillHideListener.remove();
      keyboardWillShowListener.remove();
    };
  }, []);

  /* Removed MarkdownToolbar */

  const handleMediaUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const pickedMedia = result.assets[0];
        const sizeBytes = await imageUploadService.getMediaSizeBytes({
          fileName: pickedMedia.fileName,
          fileSize: pickedMedia.fileSize,
          mimeType: pickedMedia.mimeType,
          type: pickedMedia.type,
          uri: pickedMedia.uri,
        });

        if (typeof sizeBytes === "number" && sizeBytes > ISSUE_MEDIA_MAX_BYTES) {
          Alert.alert(
            uiT("ui.file_too_large_0d74a4e2"),
            uiT("ui.this_file_is_too_large_the_maximum_upload_size_is_valuemb_f1f3cdc1", {value1: (MAX_MEDIA_SIZE_MB)})
          );
          return;
        }

        setIsUploading(true);
        const uploadedMedia = await imageUploadService.uploadMedia({
          fileName: pickedMedia.fileName,
          fileSize: sizeBytes ?? pickedMedia.fileSize ?? null,
          mimeType: pickedMedia.mimeType,
          type: pickedMedia.type,
          uri: pickedMedia.uri,
        });

        const mediaMarkdown =
          uploadedMedia.mediaType === "video"
            ? `\n![Video](${uploadedMedia.url})\n`
            : `\n![Image](${uploadedMedia.url})\n`;
        setContent((prev) => prev + mediaMarkdown);
      }
    } catch (error) {
      if (isIssueMediaTooLargeError(error)) {
        Alert.alert(
          uiT("ui.file_too_large_0d74a4e2"),
          uiT("ui.this_file_is_too_large_the_maximum_upload_size_is_valuemb_f1f3cdc1", {value1: (MAX_MEDIA_SIZE_MB)})
        );
        return;
      }

      if (isIssueMediaBucketNotFoundError(error)) {
        Alert.alert(
          uiT("ui.upload_not_configured_b34d7a3a"),
          uiT("ui.issue_media_storage_is_not_configured_in_supabase_yet_create_the_81e2ecdb")
        );
        return;
      }

      console.error("Media upload failed", error);
      Alert.alert(
        uiT("ui.upload_failed_16544909"),
        uiT("ui.could_not_upload_this_file_please_try_again_e7210aa7")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.please_provide_a_title_and_description_8491b297"));
      return;
    }

    if (!apiToken || !userData) {
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.you_must_be_logged_in_to_create_an_issue_ccc02815"));
      return;
    }

    setIsSubmitting(true);
    try {
      await issueService.createIssue(
        userData.id ?? null,
        gravatarEmail || `${userData.username || "unknown"}@users.noreply.local`,
        userData.username,
        userData.level || null,
        title,
        content
      );
      router.back();
    } catch (error) {
      console.error("Create issue failed", error);
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.failed_to_create_issue_please_try_again_5dd66f23"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      {/* Custom Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.headerBackground,
            borderBottomColor: theme.border,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.headerText} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.headerText }]}>
            {uiT("ui.new_issue_03a81df6")} </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            style={styles.headerButton}
          >
            {isSubmitting ? (
              <ActivityIndicator
                color={theme.isDark ? theme.primary : theme.headerText}
              />
            ) : (
              <Text
                style={{
                  color: !title.trim()
                    ? theme.isDark
                      ? theme.textSecondary
                      : "rgba(255, 255, 255, 0.5)"
                    : theme.isDark
                    ? theme.primary
                    : theme.headerText,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {uiT("ui.submit_155f816c")} </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.toggleContainer,
          { backgroundColor: theme.cardBackground },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "write" && {
              borderBottomColor: theme.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setViewMode("write")}
        >
          <Text
            style={{
              color: viewMode === "write" ? theme.primary : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            {uiT("ui.write_3f00927a")} </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "preview" && {
              borderBottomColor: theme.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setViewMode("preview")}
        >
          <Text
            style={{
              color:
                viewMode === "preview" ? theme.primary : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            {uiT("ui.preview_324b134f")} </Text>
        </TouchableOpacity>
      </View>

      {viewMode === "write" ? (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: keyboardHeight + 80, // Ensure content scrolls above keyboard
            }}
          >
            <TextInput
              style={[
                styles.inputTitle,
                {
                  color: theme.textColor,
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
              placeholder={uiT("ui.title_7e8cd205")}
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <View
              style={[
                styles.editorContainer,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                  flex: 1,
                },
              ]}
            >
              <TextInput
                style={[styles.inputBody, { color: theme.textColor }]}
                placeholder={uiT("ui.leave_a_comment_875e978a")}
                placeholderTextColor={theme.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {keyboardHeight > 0 && (
            <TouchableOpacity
              style={[
                styles.fab,
                {
                  backgroundColor: theme.primary,
                  bottom: keyboardHeight + 16, // Float above keyboard
                },
              ]}
              onPress={handleMediaUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons name="images" size={24} color="white" />
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ padding: 16 }}
        >
          <View
            style={[
              styles.previewContainer,
              {
                backgroundColor: theme.cardBackground,
                padding: 16,
                borderRadius: 8,
              },
            ]}
          >
            <Text style={[styles.previewTitle, { color: theme.textColor }]}>
              {title || uiT("ui.no_title_a81d00a2")}
            </Text>
            <View
              style={{
                height: 1,
                backgroundColor: theme.border,
                marginVertical: 10,
              }}
            />
            <Markdown style={markdownStyles(theme)} rules={markdownRules}>
              {content || "*No content provided*"}
            </Markdown>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  editorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 200,
    overflow: "hidden", // Ensure content doesn't spill
    marginBottom: 10,
  },
  fab: {
    position: "absolute",
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  inputBody: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
  },
  previewContainer: {
    minHeight: 300,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  header: {
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerButton: {
    padding: 4,
  },
});

const markdownStyles = (theme: any) => ({
  body: { color: theme.textColor, fontSize: 16 },
  heading1: { color: theme.textColor, fontWeight: "bold" as const },
  heading2: { color: theme.textColor, fontWeight: "bold" as const },
  paragraph: { color: theme.textColor },
  code_inline: { backgroundColor: theme.border, color: theme.textColor },
  blockquote: {
    backgroundColor: theme.cardBackground,
    borderLeftColor: theme.primary,
    borderLeftWidth: 4,
    paddingLeft: 10,
  },
  image: { borderRadius: 8, marginTop: 8, marginBottom: 8 },
  video: { borderRadius: 8, marginTop: 8, marginBottom: 8 },
});

const MarkdownImage = ({ src, style }: { src: string; style: any }) => {
  useInterfaceLanguage();
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    if (!src) return;
    Image.getSize(
      src,
      (width, height) => {
        if (width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
      },
      (err) => {
        // console.warn("Failed to get image size", err)
      }
    );
  }, [src]);

  return (
    <Image
      source={{ uri: src }}
      style={[style, { width: "100%", aspectRatio, height: undefined }]}
      resizeMode="contain"
    />
  );
};

const VIDEO_FILE_PATTERN = /\.(mp4|mov|m4v|webm|avi|mkv|3gp)(\?.*)?$/i;

function isVideoMarkdownAsset(src: string, altText?: string): boolean {
  if (!src) return false;
  if (VIDEO_FILE_PATTERN.test(src)) return true;
  return (altText ?? "").toLowerCase().includes("video");
}

const MarkdownVideo = ({ src, style }: { src: string; style: any }) => {
  useInterfaceLanguage();
  const player = useVideoPlayer(src, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.currentTime = 0;
    videoPlayer.pause();
  });

  return (
    <VideoView
      player={player}
      style={[style, { width: "100%", aspectRatio: 16 / 9, height: undefined }]}
      nativeControls
      contentFit="contain"
    />
  );
};

const markdownRules: RenderRules = {
  image: (node: any, _children: any, _parent: any, styles: any) => {
    const src = node.attributes.src;
    const altText = node.attributes.alt;
    if (isVideoMarkdownAsset(src, altText)) {
      return (
        <MarkdownVideo
          key={node.key}
          src={src}
          style={styles.video ?? styles.image}
        />
      );
    }

    return (
      <MarkdownImage
        key={node.key}
        src={src}
        style={styles.image}
      />
    );
  },
};
