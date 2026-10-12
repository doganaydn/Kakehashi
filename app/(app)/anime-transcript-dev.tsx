import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAllSubjects } from "../../src/utils/cache";
import { getStoredJpdbApiKey } from "../../src/utils/jpdbApi";
import { extractPreferredMkvSubtitleCues } from "../../src/utils/animeTranscriptMkvSubtitles";
import {
  clearAnimeTranscriptDevSession,
  setAnimeTranscriptDevSession,
  type AnimeTranscriptSubtitleCue,
  type AnimeTranscriptVideoSourceType,
} from "../../src/utils/animeTranscriptDevSession";
import {
  buildAnimeTranscriptSessionFromHistoryEntry,
  saveAnimeTranscriptPlaybackHistoryEntry,
} from "../../src/utils/animeTranscriptPlaybackHistory";
import {
  inferTranscriptVideoSourceType,
  getFileNameFromUri,
  isLikelySupportedTranscriptVideo,
  isPickerCancellation,
  parseSrtCues,
} from "../../src/utils/animeTranscriptDevHelpers";
import { withAlpha } from "../../src/utils/subjectColors";
import { useTheme } from "../../src/utils/theme";
import {
  findVocabularyMatchesWithJpdbFirstPass as findMatches,
  type JpdbParsedTokenAnnotation,
  type KanjiMatch,
  type VocabularyMatch,
} from "../../src/utils/textHighlighting";

type SubtitleProcessingState = "idle" | "processing" | "ready" | "error";

type UploadQueueStatus = "waiting" | "processing" | "ready" | "error";

export default function AnimeTranscriptDevScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top + 8, 20);

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [videoSourceType, setVideoSourceType] =
    useState<AnimeTranscriptVideoSourceType | null>(null);
  const [subtitleFileName, setSubtitleFileName] = useState<string | null>(null);
  const [subtitleCues, setSubtitleCues] = useState<AnimeTranscriptSubtitleCue[]>([]);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingSubtitle, setIsLoadingSubtitle] = useState(false);
  const [hasStoredJpdbApiKey, setHasStoredJpdbApiKey] = useState(false);
  const [isExtractingEmbeddedSubtitles, setIsExtractingEmbeddedSubtitles] =
    useState(false);
  const [subtitleProcessingState, setSubtitleProcessingState] =
    useState<SubtitleProcessingState>("idle");
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [vocabularyMatches, setVocabularyMatches] = useState<VocabularyMatch[]>([]);
  const [kanjiMatches, setKanjiMatches] = useState<KanjiMatch[]>([]);
  const [jpdbParsedTokens, setJpdbParsedTokens] = useState<JpdbParsedTokenAnnotation[]>([]);
  const [uploadRowWidth, setUploadRowWidth] = useState(0);
  const subtitleJobIdRef = useRef(0);
  const videoUploadCompleteAnim = useRef(new Animated.Value(0)).current;
  const subtitleUploadCompleteAnim = useRef(new Animated.Value(0)).current;
  const uploadSplitAnim = useRef(new Animated.Value(0)).current;
  const videoQueueItemAnim = useRef(new Animated.Value(0)).current;
  const subtitleQueueItemAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    clearAnimeTranscriptDevSession();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshJpdbKeyState = async () => {
      try {
        const storedKey = await getStoredJpdbApiKey();
        if (!cancelled) {
          setHasStoredJpdbApiKey(Boolean(storedKey));
        }
      } catch {
        if (!cancelled) {
          setHasStoredJpdbApiKey(false);
        }
      }
    };

    void refreshJpdbKeyState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!videoFileName) {
      videoUploadCompleteAnim.setValue(0);
      return;
    }

    videoUploadCompleteAnim.setValue(0.45);
    Animated.spring(videoUploadCompleteAnim, {
      toValue: 1,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [videoFileName, videoUploadCompleteAnim]);

  useEffect(() => {
    if (!subtitleFileName) {
      subtitleUploadCompleteAnim.setValue(0);
      return;
    }

    subtitleUploadCompleteAnim.setValue(0.45);
    Animated.spring(subtitleUploadCompleteAnim, {
      toValue: 1,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [subtitleFileName, subtitleUploadCompleteAnim]);

  const needsExternalSubtitle = videoSourceType === "mp4";
  const shouldSplitUploadCards = needsExternalSubtitle && Boolean(videoFileName);
  const showVideoQueueItem = Boolean(videoFileName);
  const showSubtitleQueueItem =
    (needsExternalSubtitle && Boolean(subtitleFileName)) ||
    (videoSourceType === "mkv" && Boolean(videoFileName));
  const videoQueueStatus: UploadQueueStatus = !videoFileName
    ? "waiting"
    : isLoadingVideo ||
        (videoSourceType === "mkv" &&
          (isExtractingEmbeddedSubtitles || subtitleProcessingState === "processing"))
      ? "processing"
      : "ready";
  const subtitleQueueStatus: UploadQueueStatus =
    subtitleProcessingState === "error"
      ? "error"
      : isExtractingEmbeddedSubtitles ||
          isLoadingSubtitle ||
          subtitleProcessingState === "processing"
        ? "processing"
      : subtitleProcessingState === "ready" || subtitleFileName
          ? "ready"
          : "waiting";
  const transcriptStatusLabel =
    subtitleQueueStatus === "processing"
      ? isExtractingEmbeddedSubtitles || isLoadingSubtitle
        ? "Loading subtitles..."
        : subtitleProcessingState === "processing"
          ? "Analyzing transcript..."
          : "Loading..."
      : undefined;

  useEffect(() => {
    Animated.spring(uploadSplitAnim, {
      toValue: shouldSplitUploadCards ? 1 : 0,
      friction: 8,
      tension: 90,
      useNativeDriver: false,
    }).start();
  }, [shouldSplitUploadCards, uploadSplitAnim]);

  useEffect(() => {
    Animated.timing(videoQueueItemAnim, {
      toValue: showVideoQueueItem ? 1 : 0,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showVideoQueueItem, videoQueueItemAnim]);

  useEffect(() => {
    Animated.timing(subtitleQueueItemAnim, {
      toValue: showSubtitleQueueItem ? 1 : 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showSubtitleQueueItem, subtitleQueueItemAnim]);

  const processSubtitles = useCallback(async (cues: AnimeTranscriptSubtitleCue[]) => {
    const jobId = subtitleJobIdRef.current + 1;
    subtitleJobIdRef.current = jobId;
    setSubtitleProcessingState("processing");
    setProcessingError(null);

    try {
      const transcriptText = cues.map((cue) => cue.text).join("\n");
      if (!transcriptText.trim()) {
        throw new Error("No subtitle text found.");
      }

      const allSubjects = await getAllSubjects();
      const {
        vocabularyMatches: parsedVocabulary,
        kanjiMatches: parsedKanji,
        jpdbParsedTokens: parsedTokens,
      } = await findMatches(transcriptText, allSubjects);

      if (subtitleJobIdRef.current !== jobId) {
        return;
      }

      setVocabularyMatches(parsedVocabulary);
      setKanjiMatches(parsedKanji);
      setJpdbParsedTokens(Array.isArray(parsedTokens) ? parsedTokens : []);
      setSubtitleProcessingState("ready");
    } catch (error) {
      console.error("Failed to process subtitles:", error);
      if (subtitleJobIdRef.current !== jobId) {
        return;
      }

      setVocabularyMatches([]);
      setKanjiMatches([]);
      setJpdbParsedTokens([]);
      setSubtitleProcessingState("error");
      setProcessingError(
        uiT("ui.message_3763307a166a")
      );
    }
  }, []);

  const resetExternalSubtitlePipeline = useCallback(() => {
    subtitleJobIdRef.current += 1;
    setIsExtractingEmbeddedSubtitles(false);
    setSubtitleFileName(null);
    setSubtitleCues([]);
    setVocabularyMatches([]);
    setKanjiMatches([]);
    setJpdbParsedTokens([]);
    setSubtitleProcessingState("idle");
    setProcessingError(null);
  }, []);

  const extractAndProcessEmbeddedMkvSubtitles = useCallback(
    async (nextVideoUri: string, nextVideoFileName: string) => {
      try {
        setIsLoadingSubtitle(true);
        setIsExtractingEmbeddedSubtitles(true);
        setSubtitleProcessingState("processing");
        setProcessingError(null);
        setSubtitleFileName(null);

        const extractedSubtitle = await extractPreferredMkvSubtitleCues({
          videoUri: nextVideoUri,
          sourceFileName: nextVideoFileName,
        });

        setSubtitleFileName(extractedSubtitle.subtitleFileName);
        setSubtitleCues(extractedSubtitle.cues);
        setIsExtractingEmbeddedSubtitles(false);

        await processSubtitles(extractedSubtitle.cues);
      } catch (error) {
        console.error("Failed to extract MKV subtitles:", error);
        setIsExtractingEmbeddedSubtitles(false);
        setSubtitleFileName(null);
        setSubtitleProcessingState("error");
        setProcessingError(
          uiT("ui.message_3d0a8d200ac0")
        );
        Alert.alert(
          uiT("ui.subtitle_extraction_failed_79f43847"),
          uiT("ui.could_not_extract_japanese_subtitles_from_this_mkv_try_another_fi_8c31eb72")
        );
      } finally {
        setIsLoadingSubtitle(false);
      }
    },
    [processSubtitles]
  );

  const handlePickVideoFromFiles = useCallback(async () => {
    try {
      setIsLoadingVideo(true);
      const result = await File.pickFileAsync();
      const pickedFile = Array.isArray(result) ? result[0] : result;
      if (!pickedFile) {
        return;
      }

      const resolvedName =
        pickedFile.name?.trim() || getFileNameFromUri(pickedFile.uri);
      if (!isLikelySupportedTranscriptVideo(resolvedName, pickedFile.type ?? null)) {
        Alert.alert(uiT("ui.unsupported_format_e9183ae2"), uiT("ui.please_pick_an_mp4_or_mkv_video_file_2f176c08"));
        return;
      }
      const resolvedSourceType =
        inferTranscriptVideoSourceType(resolvedName, pickedFile.type ?? null) ?? "mp4";

      resetExternalSubtitlePipeline();
      setVideoUri(pickedFile.uri);
      setVideoFileName(resolvedName);
      setVideoSourceType(resolvedSourceType);
      if (resolvedSourceType === "mkv") {
        setIsExtractingEmbeddedSubtitles(true);
        setSubtitleProcessingState("processing");
        setProcessingError(null);
        setSubtitleFileName(null);
        setIsLoadingVideo(false);
        setTimeout(() => {
          void extractAndProcessEmbeddedMkvSubtitles(pickedFile.uri, resolvedName);
        }, 60);
      }
    } catch (error) {
      if (isPickerCancellation(error)) {
        return;
      }

      console.error("Failed to pick video:", error);
      Alert.alert(uiT("ui.upload_failed_6efc5d27"), uiT("ui.could_not_load_the_selected_video_7ca253b4"));
    } finally {
      setIsLoadingVideo(false);
    }
  }, [extractAndProcessEmbeddedMkvSubtitles, resetExternalSubtitlePipeline]);

  const handlePickVideoFromGallery = useCallback(async () => {
    try {
      setIsLoadingVideo(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          uiT("ui.permission_needed_4e25d34a"),
          uiT("ui.please_allow_photo_library_access_to_choose_a_video_from_gallery_7c0d7ccb")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const resolvedName = asset.fileName?.trim() || getFileNameFromUri(asset.uri);

      if (!isLikelySupportedTranscriptVideo(resolvedName, asset.mimeType ?? null)) {
        Alert.alert(uiT("ui.unsupported_format_e9183ae2"), uiT("ui.please_choose_an_mp4_or_mkv_video_347199e5"));
        return;
      }
      const resolvedSourceType =
        inferTranscriptVideoSourceType(resolvedName, asset.mimeType ?? null) ?? "mp4";

      resetExternalSubtitlePipeline();
      setVideoUri(asset.uri);
      setVideoFileName(resolvedName);
      setVideoSourceType(resolvedSourceType);
      if (resolvedSourceType === "mkv") {
        setIsExtractingEmbeddedSubtitles(true);
        setSubtitleProcessingState("processing");
        setProcessingError(null);
        setSubtitleFileName(null);
        setIsLoadingVideo(false);
        setTimeout(() => {
          void extractAndProcessEmbeddedMkvSubtitles(asset.uri, resolvedName);
        }, 60);
      }
    } catch (error) {
      console.error("Failed to pick gallery video:", error);
      Alert.alert(uiT("ui.upload_failed_6efc5d27"), uiT("ui.could_not_load_a_video_from_gallery_c47d93b8"));
    } finally {
      setIsLoadingVideo(false);
    }
  }, [extractAndProcessEmbeddedMkvSubtitles, resetExternalSubtitlePipeline]);

  const handlePickVideo = useCallback(() => {
    Alert.alert(uiT("ui.pick_video_1ffeff95"), uiT("ui.choose_where_to_pick_the_video_from_ab951c48"), [
      {
        text: uiT("ui.files_abc7e989"),
        onPress: () => {
          void handlePickVideoFromFiles();
        },
      },
      {
        text: uiT("ui.gallery_352cfc74"),
        onPress: () => {
          void handlePickVideoFromGallery();
        },
      },
      {
        text: uiT("ui.cancel_19766ed6"),
        style: "cancel",
      },
    ]);
  }, [handlePickVideoFromFiles, handlePickVideoFromGallery]);

  const handlePickSubtitle = useCallback(async () => {
    try {
      setIsLoadingSubtitle(true);
      setIsExtractingEmbeddedSubtitles(false);
      setSubtitleProcessingState("idle");
      setProcessingError(null);

      const result = await File.pickFileAsync();
      const pickedFile = Array.isArray(result) ? result[0] : result;
      if (!pickedFile) {
        return;
      }

      const subtitleName = pickedFile.name?.trim() || getFileNameFromUri(pickedFile.uri);
      const rawExtension = pickedFile.extension?.trim().toLowerCase();
      const normalizedExtension = rawExtension
        ? rawExtension.startsWith(".")
          ? rawExtension
          : `.${rawExtension}`
        : "";
      const nameLooksLikeSrt = subtitleName.toLowerCase().endsWith(".srt");

      if ((normalizedExtension && normalizedExtension !== ".srt") || (!normalizedExtension && !nameLooksLikeSrt)) {
        Alert.alert(uiT("ui.unsupported_format_e9183ae2"), uiT("ui.please_pick_a_srt_subtitle_file_82e58531"));
        return;
      }

      const rawText = await pickedFile.text();
      const parsedCues = parseSrtCues(rawText);
      if (parsedCues.length === 0) {
        Alert.alert(uiT("ui.no_subtitles_found_e4a4f98d"), uiT("ui.the_srt_file_did_not_contain_valid_cues_0b4ece89"));
        return;
      }

      setSubtitleFileName(subtitleName || "Selected subtitles");
      setSubtitleCues(parsedCues);
      void processSubtitles(parsedCues);
    } catch (error) {
      if (isPickerCancellation(error)) {
        return;
      }

      console.error("Failed to pick subtitle:", error);
      setSubtitleProcessingState("error");
      setProcessingError(uiT("ui.could_not_read_the_selected_subtitle_file_46143839"));
      Alert.alert(uiT("ui.upload_failed_6efc5d27"), uiT("ui.could_not_read_the_selected_subtitle_file_46143839"));
    } finally {
      setIsLoadingSubtitle(false);
    }
  }, [processSubtitles]);

  const canContinue = useMemo(() => {
    if (!videoUri || !videoSourceType) {
      return false;
    }

    return subtitleCues.length > 0 && subtitleProcessingState === "ready";
  }, [subtitleCues.length, subtitleProcessingState, videoSourceType, videoUri]);

  const uploadRowGap = 10;
  const splitCardWidth = useMemo(() => {
    if (uploadRowWidth <= uploadRowGap) {
      return 0;
    }

    return (uploadRowWidth - uploadRowGap) / 2;
  }, [uploadRowGap, uploadRowWidth]);

  const videoUploadSlotStyle = useMemo(
    () =>
      uploadRowWidth > 0
        ? {
            width: uploadSplitAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [uploadRowWidth, splitCardWidth],
            }),
          }
        : null,
    [splitCardWidth, uploadRowWidth, uploadSplitAnim]
  );

  const subtitleUploadSlotStyle = useMemo(
    () =>
      uploadRowWidth > 0
        ? {
            width: uploadSplitAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, splitCardWidth],
            }),
            opacity: uploadSplitAnim,
            transform: [
              {
                translateX: uploadSplitAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [26, 0],
                }),
              },
            ],
          }
        : null,
    [splitCardWidth, uploadRowWidth, uploadSplitAnim]
  );

  const queueItemLiftStyle = useCallback((animValue: Animated.Value) => {
    return {
      opacity: animValue,
      transform: [
        {
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
        },
        {
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.98, 1],
          }),
        },
      ],
    };
  }, []);

  const videoQueueItemStyle = useMemo(
    () => queueItemLiftStyle(videoQueueItemAnim),
    [queueItemLiftStyle, videoQueueItemAnim]
  );
  const subtitleQueueItemStyle = useMemo(
    () => queueItemLiftStyle(subtitleQueueItemAnim),
    [queueItemLiftStyle, subtitleQueueItemAnim]
  );

  const videoUploadCompleteStyle = useMemo(
    () => ({
      opacity: videoUploadCompleteAnim,
      transform: [{ scale: videoUploadCompleteAnim }],
    }),
    [videoUploadCompleteAnim]
  );

  const subtitleUploadCompleteStyle = useMemo(
    () => ({
      opacity: subtitleUploadCompleteAnim,
      transform: [{ scale: subtitleUploadCompleteAnim }],
    }),
    [subtitleUploadCompleteAnim]
  );

  const handleContinue = useCallback(async () => {
    if (!canContinue || !videoUri || !videoFileName || !videoSourceType) {
      return;
    }

    const nextSession = {
      videoUri,
      videoFileName,
      videoSourceType,
      subtitleFileName:
        subtitleFileName ?? (videoSourceType === "mkv" ? "Embedded subtitles (MKV)" : "N/A"),
      subtitleCues,
      vocabularyMatches,
      kanjiMatches,
      jpdbParsedTokens,
      updatedAt: Date.now(),
    };

    const savedEntry = await saveAnimeTranscriptPlaybackHistoryEntry(nextSession);
    setAnimeTranscriptDevSession(
      buildAnimeTranscriptSessionFromHistoryEntry(savedEntry)
    );

    router.push("/anime-transcript-dev-viewer");
  }, [
    canContinue,
    jpdbParsedTokens,
    kanjiMatches,
    router,
    subtitleCues,
    subtitleFileName,
    videoFileName,
    videoSourceType,
    videoUri,
    vocabularyMatches,
  ]);

  const renderUploadCard = useCallback(
    ({
      icon,
      title,
      fileName,
      isLoading,
      onPress,
      accentColor,
      completionAnimatedStyle,
      disabled = false,
    }: {
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      fileName: string | null;
      isLoading: boolean;
      onPress: () => void;
      accentColor: string;
      completionAnimatedStyle: any;
      disabled?: boolean;
    }) => {
      const hasFile = Boolean(fileName);
      const isActionDisabled = isLoading || disabled;

      return (
        <TouchableOpacity
          style={[
            styles.uploadCard,
            {
              borderColor: withAlpha(theme.border, 0.9),
              backgroundColor: withAlpha(theme.cardBackground, 0.78),
            },
          ]}
          onPress={onPress}
          activeOpacity={0.82}
          disabled={isActionDisabled}
        >
          <View style={styles.uploadCardStatusWrap}>
            {isLoading ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : hasFile ? (
              <Animated.View style={[styles.uploadCardCompleteWrap, completionAnimatedStyle]}>
                <Ionicons name="checkmark-circle" size={22} color={accentColor} />
              </Animated.View>
            ) : null}
          </View>

          <View
            style={[
              styles.uploadCardIconWrap,
              { backgroundColor: withAlpha(accentColor, theme.isDark ? 0.26 : 0.16) },
            ]}
          >
            <Ionicons name={icon} size={28} color={accentColor} />
          </View>

          <View style={styles.uploadCardBody}>
            <Text style={[styles.uploadCardTitle, { color: theme.textColor }]}>
              {title}
            </Text>
            {hasFile ? (
              <Text
                style={[styles.uploadCardFileName, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {fileName}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [theme.border, theme.cardBackground, theme.isDark, theme.textColor, theme.textSecondary]
  );

  const renderQueueItem = useCallback(
    ({
      icon,
      title,
      status,
      accentColor,
      itemStyle,
      statusLabelOverride,
    }: {
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      status: UploadQueueStatus;
      accentColor: string;
      itemStyle: any;
      statusLabelOverride?: string;
    }) => {
      const isError = status === "error";
      const toneColor = isError ? theme.error : accentColor;
      const statusLabel =
        statusLabelOverride ??
        (status === "processing"
          ? "Loading..."
          : status === "ready"
            ? "Ready"
            : status === "error"
              ? "Failed"
              : "Waiting");

      return (
        <Animated.View
          style={[
            styles.queueItem,
            itemStyle,
            {
              borderColor: isError ? withAlpha(theme.error, 0.5) : withAlpha(theme.border, 0.9),
              backgroundColor: withAlpha(theme.cardBackground, 0.92),
            },
          ]}
        >
          <View
            style={[
              styles.queueItemIconWrap,
              { backgroundColor: withAlpha(toneColor, theme.isDark ? 0.25 : 0.16) },
            ]}
          >
            <Ionicons name={icon} size={18} color={toneColor} />
          </View>

          <View style={styles.queueItemContent}>
            <View style={styles.queueItemRow}>
              <Text style={[styles.queueItemTitle, { color: theme.textColor }]} numberOfLines={1}>
                {title}
              </Text>
              {status === "processing" ? (
                <ActivityIndicator size="small" color={toneColor} />
              ) : status === "ready" ? (
                <Ionicons name="checkmark-circle" size={18} color={toneColor} />
              ) : status === "error" ? (
                <Ionicons name="alert-circle" size={18} color={toneColor} />
              ) : (
                <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
              )}
            </View>
            <Text
              style={[
                styles.queueItemStatusLabel,
                { color: isError ? theme.error : theme.textSecondary },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </Animated.View>
      );
    },
    [
      theme.border,
      theme.cardBackground,
      theme.error,
      theme.isDark,
      theme.textColor,
      theme.textSecondary,
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View
        style={[
          styles.header,
          {
            paddingTop: headerPaddingTop,
            backgroundColor: theme.headerBackground,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>
          {uiT("ui.transcript_lab_9813bcb0")} </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 110, 140) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            styles.stepOneCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>{uiT("ui.upload_files_990578cf")}</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            {uiT("ui.start_with_one_video_upload_box_if_the_video_is_mp4_the_subtitle_4dddf96f")} </Text>

          <View
            style={styles.uploadFlowRow}
            onLayout={(event) => {
              const measuredWidth = Math.floor(event.nativeEvent.layout.width);
              if (measuredWidth > 0 && measuredWidth !== uploadRowWidth) {
                setUploadRowWidth(measuredWidth);
              }
            }}
          >
            <Animated.View
              style={[
                styles.uploadFlowSlot,
                styles.videoUploadSlot,
                uploadRowWidth > 0 && videoUploadSlotStyle ? videoUploadSlotStyle : styles.uploadSlotFallback,
              ]}
            >
              {renderUploadCard({
                icon: "film-outline",
                title: uiT("ui.video_file_mp4_mkv_13769f5d"),
                fileName: videoFileName,
                isLoading: isLoadingVideo,
                onPress: handlePickVideo,
                accentColor: theme.primary,
                completionAnimatedStyle: videoUploadCompleteStyle,
              })}
            </Animated.View>

            <Animated.View
              pointerEvents={shouldSplitUploadCards ? "auto" : "none"}
              style={[
                styles.uploadFlowSlot,
                styles.subtitleUploadSlot,
                uploadRowWidth > 0 && subtitleUploadSlotStyle
                  ? subtitleUploadSlotStyle
                  : styles.collapsedUploadSlot,
              ]}
            >
              {renderUploadCard({
                icon: "document-text-outline",
                title: uiT("ui.subtitle_file_srt_89215355"),
                fileName: subtitleFileName,
                isLoading: isLoadingSubtitle,
                onPress: () => {
                  void handlePickSubtitle();
                },
                accentColor: theme.secondary,
                completionAnimatedStyle: subtitleUploadCompleteStyle,
                disabled: !shouldSplitUploadCards,
              })}
            </Animated.View>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>{uiT("ui.upload_queue_48691b26")}</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            {uiT("ui.files_appear_here_as_they_are_loaded_and_analyzed_53a1dba1")} </Text>

          <View style={styles.queueList}>
            {showVideoQueueItem
              ? renderQueueItem({
                  icon: "film-outline",
                  title: videoFileName ?? "Video",
                  status: videoQueueStatus,
                  accentColor: theme.primary,
                  itemStyle: videoQueueItemStyle,
                })
              : null}

            {showSubtitleQueueItem
              ? renderQueueItem({
                  icon:
                    videoSourceType === "mkv"
                      ? "albums-outline"
                      : "document-text-outline",
                  title:
                    videoSourceType === "mkv"
                      ? "Video transcripts"
                      : subtitleFileName ?? "Video transcripts",
                  status: subtitleQueueStatus,
                  accentColor: theme.secondary,
                  itemStyle: subtitleQueueItemStyle,
                  statusLabelOverride: transcriptStatusLabel,
                })
              : null}

            {!showVideoQueueItem && !showSubtitleQueueItem ? (
              <View
                style={[
                  styles.queuePlaceholder,
                  {
                    borderColor: withAlpha(theme.border, 0.85),
                    backgroundColor: withAlpha(theme.cardBackground, 0.3),
                  },
                ]}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={theme.textSecondary} />
                <Text style={[styles.queuePlaceholderText, { color: theme.textSecondary }]}>
                  {uiT("ui.uploads_will_appear_here_aadcf331")} </Text>
              </View>
            ) : null}
          </View>

          {subtitleProcessingState === "error" && processingError ? (
            <Text style={[styles.warningText, { color: theme.error }]}>
              {processingError}
            </Text>
          ) : null}

          {!hasStoredJpdbApiKey && subtitleCues.length > 0 ? (
            <Text style={[styles.warningText, { color: theme.error }]}>
              {uiT("ui.jpdb_api_key_not_found_in_settings_processing_still_runs_with_fal_fcf9a4b3")} </Text>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.stickyFooter,
          {
            paddingBottom: Math.max(insets.bottom, 10),
            borderTopColor: theme.border,
            backgroundColor: theme.cardBackground,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: canContinue
                ? theme.primary
                : theme.isDark
                  ? "#1f2937"
                  : "#d1d5db",
            },
          ]}
          disabled={!canContinue}
          onPress={handleContinue}
          activeOpacity={canContinue ? 0.82 : 1}
        >
          <Text style={styles.continueButtonText}>{uiT("ui.continue_to_viewer_ce8ff8c2")}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  stepOneCard: {
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  uploadFlowRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginTop: 2,
  },
  uploadFlowSlot: {
    overflow: "hidden",
  },
  videoUploadSlot: {
    minWidth: 0,
  },
  subtitleUploadSlot: {
    minWidth: 0,
  },
  collapsedUploadSlot: {
    width: 0,
    opacity: 0,
  },
  uploadSlotFallback: {
    flex: 1,
  },
  uploadCard: {
    width: "100%",
    height: 176,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dotted",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    position: "relative",
  },
  uploadCardIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadCardBody: {
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  uploadCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  uploadCardFileName: {
    fontSize: 11,
    lineHeight: 14,
    maxWidth: 132,
    textAlign: "center",
  },
  uploadCardStatusWrap: {
    position: "absolute",
    top: 10,
    right: 10,
    minWidth: 22,
    minHeight: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadCardCompleteWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  queueList: {
    gap: 10,
  },
  queueItem: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
    minHeight: 70,
  },
  queueItemIconWrap: {
    width: 52,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  queueItemContent: {
    flex: 1,
    gap: 4,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 12,
  },
  queueItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  queueItemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  queueItemStatusLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  queuePlaceholder: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  queuePlaceholderText: {
    fontSize: 12,
    fontWeight: "600",
  },
  warningText: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
