import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import Svg, { Path } from "react-native-svg";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { resolveOfflineVocabularyAudioUri } from "../services/offlineVocabularyAudioService";
import { azureSpeechService } from "../utils/azureSpeech";
import {
  createAudioVocabCard,
  type AudioVocabCard,
} from "../utils/audioVocabStudy";
import { useSettingsStore } from "../utils/store";

function AudioVocabPlayback({
  card,
  autoPlay,
}: {
  card: AudioVocabCard;
  autoPlay: boolean;
}) {
  useInterfaceLanguage();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);
  const sourceRef = useRef(card.audio.url);
  const requestRef = useRef(0);

  const play = useCallback(
    async (rate = 1) => {
      if (!activeRef.current) return;
      const request = ++requestRef.current;
      setError(null);
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
        if (!activeRef.current || request !== requestRef.current) return;
        player.pause();
        if (!player.isLoaded) player.replace(sourceRef.current);
        else await player.seekTo(0);
        if (!activeRef.current || request !== requestRef.current) return;
        player.shouldCorrectPitch = true;
        player.setPlaybackRate(rate);
        player.play();
      } catch {
        if (activeRef.current && request === requestRef.current)
          setError(
            uiT("ui.message_cb2b37c32e9c"),
          );
      }
    },
    [player],
  );

  useEffect(() => {
    activeRef.current = true;
    player.pause();
    let cancelled = false;
    void (async () => {
      let uri = card.audio.url;
      try {
        uri =
          (await resolveOfflineVocabularyAudioUri(
            card.subjectId,
            card.audio,
          )) ?? uri;
      } catch {
        /* The original recording is still available online. */
      }
      if (cancelled) return;
      try {
        sourceRef.current = uri;
        player.replace(uri);
        if (autoPlay) void play();
      } catch {
        if (!cancelled)
          setError(
            uiT("ui.message_64e3ec43c3f6"),
          );
      }
    })();
    return () => {
      cancelled = true;
      activeRef.current = false;
      requestRef.current += 1;
      // useAudioPlayer releases (and stops) its native player before this
      // cleanup. Only cancel JS work here; native calls would use a freed object.
    };
  }, [autoPlay, card.audio, card.subjectId, play, player]);

  useEffect(() => {
    if (status.isLoaded) return;
    const timeout = setTimeout(
      () =>
        setError(
          uiT("ui.message_64e3ec43c3f6"),
        ),
      12000,
    );
    return () => clearTimeout(timeout);
  }, [status.isLoaded]);

  return (
    <AudioPlaybackControls
      playing={status.playing}
      loading={status.isBuffering}
      error={error}
      play={play}
    />
  );
}

function AudioSentencePlayback({
  text,
  autoPlay,
}: {
  text: string;
  autoPlay: boolean;
}) {
  useInterfaceLanguage();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);
  const requestRef = useRef(0);

  const play = useCallback(
    async (rate = 1) => {
      if (!activeRef.current) return;
      const request = ++requestRef.current;
      const isCurrent = () =>
        activeRef.current && request === requestRef.current;
      setError(null);
      setLoading(true);
      setPlaying(false);
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
        if (!isCurrent()) return;
        await azureSpeechService.speak(
          text,
          () => {
            if (!isCurrent()) return;
            setLoading(false);
            setPlaying(true);
          },
          undefined,
          () => {
            if (isCurrent())
              setError(uiT("ui.message_5e370350c2d8"));
          },
          { speedMultiplier: rate },
        );
      } catch {
        if (isCurrent())
          setError(uiT("ui.message_5e370350c2d8"));
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setPlaying(false);
        }
      }
    },
    [text],
  );

  useEffect(() => {
    activeRef.current = true;
    if (autoPlay) void play();
    return () => {
      activeRef.current = false;
      requestRef.current += 1;
      // The speech service aborts synthesis as well as stopping live playback.
      void azureSpeechService.stop();
    };
  }, [autoPlay, play]);

  return (
    <AudioPlaybackControls
      playing={playing}
      loading={loading}
      error={error}
      play={play}
      sentenceMode
    />
  );
}

function AudioPlaybackControls({
  playing,
  loading,
  error,
  play,
  sentenceMode = false,
}: {
  playing: boolean;
  loading: boolean;
  error: string | null;
  play: (rate?: number) => Promise<void>;
  sentenceMode?: boolean;
}) {
  useInterfaceLanguage();
  return (
    <>
      <View style={{ alignItems: "center", gap: 12, padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 16 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.play_vocabulary_audio_e6df71b7")}
            onPress={() => void play()}
            style={{
              width: 120,
              height: 120,
              backgroundColor: "rgba(255,255,255,0.18)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.4)",
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              opacity: playing ? 0.75 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Svg
                width={52}
                height={52}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M11 5 6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
              </Svg>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.play_vocabulary_audio_slowly_a4bc204e")}
            onPress={() => void play(0.75)}
            style={{
              minWidth: 76,
              minHeight: 76,
              padding: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.4)",
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Text style={{ color: "white", fontSize: 18 }}>0.75×</Text>
            <Text style={{ color: "white", fontSize: 12 }}>{uiT("ui.slower_4eda52fe")}</Text>
          </Pressable>
        </View>
        <Text
          selectable
          accessibilityLiveRegion="polite"
          style={{
            color: "white",
            textAlign: "center",
          }}
        >
          {error ??
            (playing
              ? uiT("ui.playing_a9fcbd2b")
              : loading
                ? uiT("ui.loading_audio_b5984238")
                : sentenceMode
                  ? uiT("ui.listen_to_the_word_then_its_sentence_3f8feb48")
                  : uiT("ui.tap_to_listen_again_dd95b111"))}
        </Text>
      </View>
    </>
  );
}

export default function AudioVocabPrompt({
  subject,
  autoPlay,
  sentence,
}: {
  subject: Parameters<typeof createAudioVocabCard>[0];
  autoPlay: boolean;
  sentence?: string;
}) {
  useInterfaceLanguage();
  const voice = useSettingsStore((state) => state.vocabularyAudioVoice);
  const card = useMemo(
    () => (sentence ? null : createAudioVocabCard(subject, voice)),
    [subject, voice, sentence],
  );
  if (sentence) {
    const reading =
      subject.data.readings?.find((candidate) => candidate.primary)?.reading ??
      subject.data.characters;
    const text = reading ? `${reading}。${sentence}` : sentence;
    return <AudioSentencePlayback key={text} text={text} autoPlay={autoPlay} />;
  }
  return card ? (
    <AudioVocabPlayback
      key={`${card.id}:${card.audio.url}`}
      card={card}
      autoPlay={autoPlay}
    />
  ) : (
    <Text>{uiT("ui.no_recording_is_available_for_this_vocabulary_6cc97e6e")}</Text>
  );
}
