import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { azureTranslatorService } from "../../src/utils/azureTranslator";
import { useSubjectColors, withAlpha } from "../../src/utils/subjectColors";
import { useTheme } from "../../src/utils/theme";

type SearchMode = "japanese" | "english";

export default function SpeechSearchScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const subjectColors = useSubjectColors();
  const router = useRouter();
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [previousInterimTranscript, setPreviousInterimTranscript] =
    useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>("japanese");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Animations
  const pulseAnim = useState(new Animated.Value(1))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const waveAnim1 = useState(new Animated.Value(0.3))[0];
  const waveAnim2 = useState(new Animated.Value(0.3))[0];
  const waveAnim3 = useState(new Animated.Value(0.3))[0];
  const waveAnim4 = useState(new Animated.Value(0.3))[0];
  const waveAnim5 = useState(new Animated.Value(0.3))[0];
  const waveAnim6 = useState(new Animated.Value(0.3))[0];
  const waveAnim7 = useState(new Animated.Value(0.3))[0];
  const micScaleAnim = useState(new Animated.Value(1))[0];

  // Store animation references for proper cleanup
  const [micAnimation, setMicAnimation] =
    useState<Animated.CompositeAnimation | null>(null);
  const [waveAnimations, setWaveAnimations] = useState<
    Animated.CompositeAnimation[]
  >([]);

  // Speech recognition event listeners
  useSpeechRecognitionEvent("start", () => {
    console.log("Speech recognition started");
    setIsRecognizing(true);
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setPreviousInterimTranscript("");
    setTranslatedText(null);
    startRecordingAnimation();
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("Speech recognition ended");
    setIsRecognizing(false);
    setInterimTranscript("");
    setPreviousInterimTranscript("");
    stopRecordingAnimation();
  });

  useSpeechRecognitionEvent("result", (event) => {
    console.log("Speech recognition result:", event);
    if (event.results && event.results.length > 0) {
      const recognizedText = event.results[0]?.transcript || "";

      if (event.isFinal) {
        // Final result
        console.log("Final result received:", recognizedText);
        setTranscript(recognizedText);
        setInterimTranscript("");

        // Stop speech recognition immediately to prevent conflicts
        stopRecognition();

        if (recognizedText.trim()) {
          if (searchMode === "english") {
            handleEnglishResult(recognizedText);
          } else {
            handleJapaneseResult(recognizedText);
          }
        }
      } else {
        // Interim result
        setPreviousInterimTranscript(interimTranscript);
        setInterimTranscript(recognizedText);
      }
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech recognition error:", event.error, event.message);
    setIsRecognizing(false);
    setInterimTranscript("");
    stopRecordingAnimation();

    let errorMessage = "Speech recognition failed";
    switch (event.error) {
      case "not-allowed":
        errorMessage =
          "Microphone permission denied. Please enable it in Settings.";
        break;
      case "service-not-allowed":
        errorMessage =
          "Speech recognition service not available. Please enable it in Settings.";
        break;
      case "language-not-supported":
        errorMessage = uiT("ui.dynamic_a82e0473349c", {value1: (searchMode === "japanese" ? uiT("ui.japanese_be4ee906") : uiT("common.english"))});
        break;
      case "network":
        errorMessage = "Network error. Please check your connection.";
        break;
      case "no-speech":
        errorMessage = "No speech detected. Please try again.";
        break;
      case "aborted":
        errorMessage = "Speech recognition was aborted.";
        break;
      default:
        errorMessage = event.message || "Unknown error occurred";
    }

    setError(errorMessage);
  });

  const handleJapaneseResult = (recognizedText: string) => {
    try {
      console.log("Processing Japanese result:", recognizedText);
      const japaneseText = filterJapaneseText(recognizedText);
      console.log("Filtered Japanese text:", japaneseText);

      if (japaneseText.length > 0) {
        console.log("Navigating to results with Japanese text:", japaneseText);
        // Add a small delay to ensure UI state is cleaned up
        setTimeout(() => {
          router.replace({
            pathname: "/speech-results",
            params: {
              recognizedText: japaneseText,
              originalText: recognizedText,
            },
          });
        }, 100);
      } else {
        console.log("No Japanese text found, setting error");
        setError(
          uiT("ui.message_4db0fc63f8da")
        );
      }
    } catch (error) {
      console.error("Error in handleJapaneseResult:", error);
      setError(uiT("ui.message_28f525b0f3ac"));
    }
  };

  const handleEnglishResult = async (recognizedText: string) => {
    console.log("Processing English result:", recognizedText);
    try {
      setIsTranslating(true);
      console.log("Starting translation...");
      const japaneseTranslation = await azureTranslatorService.translate(
        recognizedText,
        "en",
        "ja"
      );
      console.log("Translation completed:", japaneseTranslation);

      if (japaneseTranslation && japaneseTranslation.trim().length > 0) {
        console.log(
          "Navigating to results with translation:",
          japaneseTranslation
        );
        // Navigate directly without showing translation in this screen
        setTimeout(() => {
          router.replace({
            pathname: "/speech-results",
            params: {
              recognizedText: japaneseTranslation,
              originalText: recognizedText,
            },
          });
        }, 100);
      } else {
        console.log("Empty translation received");
        setError(uiT("ui.message_855ac697f2c1"));
      }
    } catch (error) {
      console.error("Translation error:", error);
      setError(uiT("ui.message_6b7021222b0f"));
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    checkPermissionsAndInitialize();
    // Fade in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Cleanup animations on unmount
    return () => {
      stopRecordingAnimation();
      if (isRecognizing) {
        stopRecognition();
      }
    };
  }, []);

  const checkPermissionsAndInitialize = async () => {
    try {
      // Check if speech recognition is available
      const available =
        await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        setError(uiT("ui.message_7717e6d51d4e"));
        setIsInitializing(false);
        return;
      }

      // Check permissions
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      console.log("Speech recognition permissions:", result);

      if (result.granted) {
        setPermissionsGranted(true);
      } else {
        setPermissionsGranted(false);
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
      setError(uiT("ui.message_54a5900a2c15"));
    } finally {
      setIsInitializing(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const result =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      console.log("Permission request result:", result);

      if (result.granted) {
        setPermissionsGranted(true);
        setError(null);
      } else {
        setError(uiT("ui.message_cb52afa9c177"));
      }
    } catch (err) {
      console.error("Error requesting permissions:", err);
      setError(uiT("ui.message_01fabeba94ec"));
    }
  };

  const startRecognition = async () => {
    if (!permissionsGranted) {
      await requestPermissions();
      return;
    }

    try {
      setTranscript("");
      setInterimTranscript("");
      setPreviousInterimTranscript("");
      setTranslatedText(null);
      setError(null);

      // Start speech recognition with appropriate language
      await ExpoSpeechRecognitionModule.start({
        lang: searchMode === "japanese" ? "ja-JP" : "en-US",
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError(uiT("ui.message_11af4cda30b6"));
    }
  };

  const stopRecognition = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      console.error("Error stopping speech recognition:", err);
    }
  };

  const startRecordingAnimation = () => {
    // Stop any existing animations first
    stopRecordingAnimation();

    // Microphone pulse
    const micAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(micScaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(micScaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    setMicAnimation(micAnim);
    micAnim.start();

    // Audio wave animations
    const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const waveAnims = [
      createWaveAnimation(waveAnim1, 0),
      createWaveAnimation(waveAnim2, 100),
      createWaveAnimation(waveAnim3, 200),
      createWaveAnimation(waveAnim4, 300),
      createWaveAnimation(waveAnim5, 400),
      createWaveAnimation(waveAnim6, 500),
      createWaveAnimation(waveAnim7, 600),
    ];

    setWaveAnimations(waveAnims);
    waveAnims.forEach((anim) => anim.start());
  };

  const stopRecordingAnimation = () => {
    // Stop the microphone animation
    if (micAnimation) {
      micAnimation.stop();
      setMicAnimation(null);
    }

    // Stop all wave animations
    waveAnimations.forEach((anim) => {
      if (anim) {
        anim.stop();
      }
    });
    setWaveAnimations([]);

    // Reset all animated values to their initial state
    micScaleAnim.setValue(1);
    waveAnim1.setValue(0.3);
    waveAnim2.setValue(0.3);
    waveAnim3.setValue(0.3);
    waveAnim4.setValue(0.3);
    waveAnim5.setValue(0.3);
    waveAnim6.setValue(0.3);
    waveAnim7.setValue(0.3);

    // Animate back to resting state smoothly
    Animated.parallel([
      Animated.timing(micScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim1, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim2, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim3, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim4, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim5, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim6, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim7, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleButtonPress = () => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (isRecognizing) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  // Helper function to filter out non-Japanese characters (same as OCR)
  const filterJapaneseText = (text: string): string => {
    // Japanese character ranges:
    // Hiragana: \u3040-\u309F
    // Katakana: \u30A0-\u30FF
    // Kanji: \u4E00-\u9FAF
    // Japanese punctuation: \u3000-\u303F
    // Japanese symbols: \uFF00-\uFFEF (full-width characters)
    // Arabic numerals: 0-9 (preserve numbers from speech recognition)

    // Split text into lines to preserve structure
    const lines = text.split("\n");
    const filteredLines = lines
      .map((line) => {
        // Extract Japanese characters and Arabic numerals while preserving some spacing
        const japaneseRegex =
          /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3000-\u303F\uFF00-\uFFEF0-9\s\.,!\?\-]/g;
        const matches = line.match(japaneseRegex);
        if (matches) {
          // Join matches and clean up excessive whitespace
          return matches.join("").replace(/\s+/g, " ").trim();
        }
        return "";
      })
      .filter((line) => line.length > 0); // Remove empty lines

    const result = filteredLines.join("\n");
    console.log("Japanese filtering result:", result);
    console.log(
      "Original length:",
      text.length,
      "Filtered length:",
      result.length
    );

    return result;
  };

  const handleClose = () => {
    if (isRecognizing) {
      stopRecognition();
    }
    router.back();
  };

  const handleModeToggle = (mode: SearchMode) => {
    if (isRecognizing) {
      stopRecognition();
    }
    setSearchMode(mode);
    setTranscript("");
    setInterimTranscript("");
    setPreviousInterimTranscript("");
    setTranslatedText(null);
    setError(null);
  };

  const handleShowHistory = useCallback(() => {
    router.push("/speech-history");
  }, [router]);

  const handleSegmentChange = (index: number) => {
    const mode: SearchMode = index === 0 ? "japanese" : "english";
    if (mode !== searchMode) {
      handleModeToggle(mode);
    }
  };

  // Function to determine stable vs uncertain text parts
  const getTextParts = () => {
    if (!interimTranscript) {
      return { stableText: transcript, uncertainText: "" };
    }

    // Find the common prefix between previous and current interim
    let stableLength = 0;
    const previousLength = previousInterimTranscript.length;
    const currentLength = interimTranscript.length;

    // Find how much of the text has stabilized
    for (let i = 0; i < Math.min(previousLength, currentLength); i++) {
      if (previousInterimTranscript[i] === interimTranscript[i]) {
        stableLength = i + 1;
      } else {
        break;
      }
    }

    // If we have a transcript (final result so far), use that as the base
    if (transcript) {
      const stableText = transcript;
      const uncertainText = interimTranscript.slice(transcript.length);
      return { stableText, uncertainText };
    }

    // For interim results, show stable part in black, uncertain part in grey
    const stableText = interimTranscript.slice(0, stableLength);
    const uncertainText = interimTranscript.slice(stableLength);

    return { stableText, uncertainText };
  };

  if (isInitializing) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {uiT("ui.initializing_speech_recognition_abebe7d7")} </Text>
        </View>
      </View>
    );
  }

  if (!permissionsGranted) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        {/* Header */}
        <View
          style={[styles.header, { backgroundColor: theme.backgroundColor }]}
        >
          <TouchableOpacity
            onPress={handleClose}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            {uiT("ui.speech_search_053de3d8")} </Text>
        </View>

        <View style={styles.permissionContainer}>
          <View
            style={[
              styles.permissionContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Ionicons
              name="mic-outline"
              size={64}
              color={theme.textSecondary}
            />
            <Text style={[styles.permissionTitle, { color: theme.textColor }]}>
              {uiT("ui.microphone_permission_required_a1e58d9c")} </Text>
            <Text
              style={[styles.permissionText, { color: theme.textSecondary }]}
            >
              {uiT("ui.we_need_access_to_your_microphone_to_recognize_speech_in_both_jap_45d5873c")} </Text>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={requestPermissions}
              activeOpacity={0.7}
            >
              <Text style={styles.permissionButtonText}>{uiT("ui.continue_31fbef16")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundColor, opacity: fadeAnim },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.backgroundColor }]}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          {uiT("ui.speech_search_053de3d8")} </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleShowHistory}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={24} color={theme.textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Mode Selection */}
        <View style={styles.modeContainer}>
          <View
            style={[
              styles.segmentedControlWrapper,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <SegmentedControl
              values={["日本語", "English"]}
              selectedIndex={searchMode === "japanese" ? 0 : 1}
              onChange={(event) =>
                handleSegmentChange(event.nativeEvent.selectedSegmentIndex)
              }
              style={styles.segmentedControl}
              tintColor={theme.primary}
              backgroundColor={theme.cardBackground}
              fontStyle={{
                color: theme.textSecondary,
                fontSize: 14,
                fontWeight: "600",
              }}
              activeFontStyle={{
                color: "#fff",
                fontSize: 14,
                fontWeight: "700",
              }}
            />
          </View>
        </View>

        {/* Status Text */}
        <View style={styles.statusContainer}>
          <Text style={[styles.statusTitle, { color: theme.textColor }]}>
            {isRecognizing
              ? searchMode === "japanese"
                ? uiT("ui.listening_for_japanese_71132ef4")
                : uiT("ui.listening_for_english_edfeb86c")
              : uiT("ui.tap_to_speak_value_c754c8fb", {value1: (searchMode === "japanese" ? uiT("ui.japanese_be4ee906") : "English")})}
          </Text>
          <Text style={[styles.statusSubtitle, { color: theme.textSecondary }]}>
            {isRecognizing
              ? uiT("ui.speak_clearly_and_naturally_fbb8d6c2")
              : searchMode === "japanese"
              ? uiT("ui.say_japanese_words_or_phrases_to_search_your_vocabulary_605553cd")
              : uiT("ui.say_english_words_they_will_be_translated_to_japanese_412c2a56")}
          </Text>
        </View>

        {/* Audio Visualization */}
        <View style={styles.audioContainer}>
          {/* Audio waves */}
          <View style={styles.audioWaves}>
            <Animated.View
              style={[
                styles.audioWave,
                {
                  opacity: waveAnim1,
                  transform: [{ scaleY: waveAnim1 }],
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.audioWave,
                {
                  opacity: waveAnim2,
                  transform: [{ scaleY: waveAnim2 }],
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.audioWave,
                {
                  opacity: waveAnim3,
                  transform: [{ scaleY: waveAnim3 }],
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.audioWave,
                {
                  opacity: waveAnim4,
                  transform: [{ scaleY: waveAnim4 }],
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.audioWave,
                {
                  opacity: waveAnim5,
                  transform: [{ scaleY: waveAnim5 }],
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.audioWave,
                {
                  opacity: waveAnim6,
                  transform: [{ scaleY: waveAnim6 }],
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.audioWave,
                {
                  opacity: waveAnim7,
                  transform: [{ scaleY: waveAnim7 }],
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          {/* Microphone Button */}
          <Animated.View style={{ transform: [{ scale: micScaleAnim }] }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.microphoneButton,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: isRecognizing ? theme.error : theme.primary,
                    shadowColor: isRecognizing ? theme.error : theme.primary,
                  },
                ]}
                onPress={handleButtonPress}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isRecognizing ? "stop" : "mic"}
                  size={48}
                  color={isRecognizing ? theme.error : theme.primary}
                />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Real-time Transcript Display */}
        {(transcript || interimTranscript || isTranslating) && (
          <View
            style={[
              styles.transcriptContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            {searchMode === "english" && transcript && (
              <>
                <Text
                  style={[
                    styles.transcriptLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.english_95779ac5")} </Text>
                <Text
                  style={[styles.transcriptText, { color: theme.textColor }]}
                >
                  {transcript}
                </Text>

                {isTranslating ? (
                  <View
                    style={[
                      styles.translationContainer,
                      {
                        borderTopColor: withAlpha(subjectColors.vocabulary, 0.2),
                      },
                    ]}
                  >
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text
                      style={[
                        styles.translationLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.translating_to_japanese_c4f45b95")} </Text>
                  </View>
                ) : (
                  translatedText && (
                    <View
                      style={[
                        styles.translationContainer,
                        {
                          borderTopColor: withAlpha(subjectColors.vocabulary, 0.2),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.transcriptLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {uiT("ui.japanese_99b9c246")} </Text>
                      <Text
                        style={[
                          styles.transcriptText,
                          { color: theme.primary },
                        ]}
                      >
                        {translatedText}
                      </Text>
                    </View>
                  )
                )}
              </>
            )}

            {searchMode === "japanese" && (
              <>
                <Text
                  style={[
                    styles.transcriptLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.recognized_0730cb77")} </Text>
                <Text
                  style={[styles.transcriptText, { color: theme.textColor }]}
                >
                  {(() => {
                    const { stableText, uncertainText } = getTextParts();
                    return (
                      <>
                        <Text style={{ color: theme.textColor }}>
                          {stableText}
                        </Text>
                        {uncertainText && (
                          <Text
                            style={[
                              styles.interimText,
                              { color: theme.textLight },
                            ]}
                          >
                            {uncertainText}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </Text>
              </>
            )}

            {searchMode === "english" && !transcript && interimTranscript && (
              <>
                <Text
                  style={[
                    styles.transcriptLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.listening_53de028c")} </Text>
                <Text
                  style={[styles.transcriptText, { color: theme.textColor }]}
                >
                  {(() => {
                    const { stableText, uncertainText } = getTextParts();
                    return (
                      <>
                        <Text style={{ color: theme.textColor }}>
                          {stableText}
                        </Text>
                        {uncertainText && (
                          <Text
                            style={[
                              styles.interimText,
                              { color: theme.textLight },
                            ]}
                          >
                            {uncertainText}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={theme.error}
            />
            <Text style={[styles.errorText, { color: theme.error }]}>
              {error}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
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
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  modeContainer: {
    marginBottom: 32,
    width: "100%",
    alignItems: "center",
  },
  segmentedControlWrapper: {
    borderRadius: 25,
    padding: 4,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedControl: {
    width: 260,
    borderRadius: 25,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  audioContainer: {
    alignItems: "center",
    marginBottom: 40,
    height: 200,
    justifyContent: "center",
  },
  audioWaves: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    marginBottom: 20,
  },
  audioWave: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  microphoneButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  transcriptContainer: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  transcriptText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "500",
  },
  interimText: {
    fontSize: 18,
    lineHeight: 28,
  },
  translationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ff3b30",
    marginBottom: 24,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionContent: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    maxWidth: 300,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
