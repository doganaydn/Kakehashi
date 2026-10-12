import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { ErrorCode, useIAP } from "expo-iap";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { rateAppService } from "../../src/services/rateAppService";
import { tipService } from "../../src/services/tipService";
import { useAuthStore, useSettingsStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

interface TipOption {
  id: string;
  productId: string;
  title: string;
  subtitle: string;
  price: string;
  defaultPrice: string;
  imagePlaceholder: string;
  gradient: readonly [string, string];
}

// Product IDs
const TIP_PRODUCT_IDS = {
  SMALL: Platform.select({
    ios: "com.kakehashi.tip.small",
    android: "com.kakehashi.tip.small",
    default: "com.kakehashi.tip.small",
  }),
  MEDIUM: Platform.select({
    ios: "com.kakehashi.tip.medium",
    android: "com.kakehashi.tip.medium",
    default: "com.kakehashi.tip.medium",
  }),
  LARGE: Platform.select({
    ios: "com.kakehashi.tip.large",
    android: "com.kakehashi.tip.large",
    default: "com.kakehashi.tip.large",
  }),
  XLARGE: Platform.select({
    ios: "com.kakehashi.tip.xlarge",
    android: "com.kakehashi.tip.xlarge",
    default: "com.kakehashi.tip.xlarge",
  }),
};

const TIP_OPTIONS: TipOption[] = [
  {
    id: "small",
    productId: TIP_PRODUCT_IDS.SMALL,
    get title() { return uiT("ui.small_tip_19c718ec"); },
    get subtitle() { return uiT("ui.buy_me_a_coffee_f65a6e40"); },
    price: "$2.99",
    defaultPrice: "$2.99",
    imagePlaceholder: "cafe-outline",
    gradient: ["#667eea", "#764ba2"] as const,
  },
  {
    id: "medium",
    productId: TIP_PRODUCT_IDS.MEDIUM,
    get title() { return uiT("ui.medium_tip_b1f27157"); },
    get subtitle() { return uiT("ui.buy_me_a_beer_d6239a18"); },
    price: "$4.99",
    defaultPrice: "$4.99",
    imagePlaceholder: "beer-outline",
    gradient: ["#f093fb", "#f5576c"] as const,
  },
  {
    id: "large",
    productId: TIP_PRODUCT_IDS.LARGE,
    get title() { return uiT("ui.large_tip_91c2bcfd"); },
    get subtitle() { return uiT("ui.buy_me_lunch_74dabace"); },
    price: "$9.99",
    defaultPrice: "$9.99",
    imagePlaceholder: "fast-food-outline",
    gradient: ["#4facfe", "#00f2fe"] as const,
  },
  {
    id: "xlarge",
    productId: TIP_PRODUCT_IDS.XLARGE,
    get title() { return uiT("ui.generous_tip_1fec0d3c"); },
    get subtitle() { return uiT("ui.support_development_c3008f19"); },
    price: "$19.99",
    defaultPrice: "$19.99",
    imagePlaceholder: "gift-outline",
    gradient: ["#fa709a", "#fee140"] as const,
  },
];

const PATREON_URL = "https://www.patreon.com/15731284/join";

export default function TipDeveloperScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { apiToken, userData } = useAuthStore();
  const gravatarEmail = useSettingsStore((state) => state.gravatarEmail);
  const normalizedEmail = gravatarEmail?.trim().toLowerCase() ?? "";
  const shouldShowPatreonOption =
    normalizedEmail !== "kakehashi.app@gmail.com";
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  // On Android, modals cover full screen so we need safe area padding
  const topPadding = Platform.OS === "android" ? insets.top : 0;
  const [selectedTipId, setSelectedTipId] = useState("medium"); // Medium preselected
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [stickyFooterHeight, setStickyFooterHeight] = useState(0);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      console.log("✅ Purchase successful:", JSON.stringify(purchase, null, 2));

      try {
        await finishTransaction({
          purchase,
          isConsumable: true,
        });

        // Log the tip to Supabase
        const productId = (purchase as any).productId || (purchase as any).id;
        const tipOption = TIP_OPTIONS.find((opt) => opt.productId === productId);

        if (apiToken && tipOption) {
          await tipService.logTip({
            userId: userData?.id ?? null,
            userEmail: gravatarEmail,
            userUsername: userData?.username,
            userLevel: userData?.level,
            productId: productId,
            tipType: tipOption.id,
            amount: tipOption.price,
            transactionId: (purchase as any).transactionId || (purchase as any).orderId,
          });
        }

        // Show success modal instead of alert
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Error finishing transaction:", error);
      } finally {
        setIsPurchasing(false);
      }
    },

    onPurchaseError: (error) => {
      console.error("❌ Purchase error:", error);
      setIsPurchasing(false);

      if (error.code === ErrorCode.UserCancelled) {
        console.log("ℹ️ User cancelled purchase");
        return;
      }

      Alert.alert(
        uiT("ui.purchase_failed_e46464aa"),
        uiT("ui.something_went_wrong_you_have_not_been_charged_please_try_again_l_82c38cc9"),
        [{ text: uiT("ui.ok_565339bc") }]
      );
    },
  });

  useEffect(() => {
    if (connected) {
      console.log("📦 Connection established, preparing to load products...");

      const timer = setTimeout(() => {
        console.log("📦 Loading tip products...");
        const productIds = Object.values(TIP_PRODUCT_IDS);

        fetchProducts({
          skus: productIds,
          type: "in-app",
        })
          .then(() => {
            console.log(`✅ Loaded ${products.length} products`);
            setIsLoadingProducts(false);
          })
          .catch((error) => {
            console.error("❌ Failed to load products:", error);
            setIsLoadingProducts(false);
          });
      }, 300);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  useEffect(() => {
    if (products.length > 0) {
      console.log("📦 Products available:", products.length);
      setIsLoadingProducts(false);
    }
  }, [products]);

  const handlePurchase = async () => {
    if (!connected) {
      Alert.alert(
        uiT("ui.not_connected_87d82c04"),
        uiT("ui.unable_to_connect_to_the_store_please_check_your_internet_connect_f1a71e54"),
        [{ text: uiT("ui.ok_565339bc") }]
      );
      return;
    }

    const selectedOption = TIP_OPTIONS.find((opt) => opt.id === selectedTipId);
    if (!selectedOption) return;

    try {
      setIsPurchasing(true);
      console.log("💳 Requesting purchase for:", selectedOption.productId);

      await requestPurchase({
        request: {
          apple: { sku: selectedOption.productId },
          google: { skus: [selectedOption.productId] },
        },
        type: "in-app",
      });
    } catch (error: any) {
      console.error("Purchase request error:", error);
      setIsPurchasing(false);

      if (error?.code !== ErrorCode.UserCancelled) {
        Alert.alert(
          uiT("ui.purchase_failed_e46464aa"),
          uiT("ui.unable_to_process_your_purchase_please_try_again_later_731790d1"),
          [{ text: uiT("ui.ok_565339bc") }]
        );
      }
    }
  };

  const handleRateAppPress = async () => {
    // Log the rate app click
    if (apiToken) {
      rateAppService.logRateAppClick({
        userId: userData?.id ?? null,
        userEmail: gravatarEmail,
        userUsername: userData?.username,
        userLevel: userData?.level,
        source: "tip-developer",
      });
    }

    const didOpenReviewFlow = await rateAppService.openRateAppFlow();
    if (!didOpenReviewFlow) {
      Alert.alert(
        uiT("ui.unable_to_open_store_e966344d"),
        uiT("ui.could_not_open_the_app_rating_flow_please_try_again_later_2acee322")
      );
    }
  };

  const handlePatreonPress = async () => {
    try {
      const canOpenPatreon = await Linking.canOpenURL(PATREON_URL);
      if (!canOpenPatreon) {
        Alert.alert(
          uiT("ui.unable_to_open_patreon_0e0779a9"),
          uiT("ui.could_not_open_patreon_right_now_please_try_again_later_e1ecbcbb")
        );
        return;
      }

      await Linking.openURL(PATREON_URL);
    } catch (error) {
      console.error("❌ Failed to open Patreon URL:", error);
      Alert.alert(
        uiT("ui.unable_to_open_patreon_0e0779a9"),
        uiT("ui.could_not_open_patreon_right_now_please_try_again_later_e1ecbcbb")
      );
    }
  };

  const getProductPrice = (productId: string, defaultPrice: string): string => {
    if (!connected || products.length === 0) {
      return defaultPrice;
    }

    const product = products.find((p: any) => {
      const id = p.id || p.productId;
      return id === productId;
    });

    if (!product) return defaultPrice;

    if (Platform.OS === "ios") {
      return (product as any).displayPrice || defaultPrice;
    } else {
      const androidProduct = product as any;
      return (
        androidProduct.oneTimePurchaseOfferDetails?.formattedPrice ||
        defaultPrice
      );
    }
  };

  const selectedOption = TIP_OPTIONS.find((opt) => opt.id === selectedTipId);
  const isCompactHeight = windowHeight < 740;
  const isCompactCardGrid = windowWidth <= 430 || windowHeight <= 760;
  const stickyFooterFallbackHeight = isCompactHeight ? 108 : 120;
  const stickyFooterSpacer =
    Math.max(stickyFooterHeight, stickyFooterFallbackHeight) + 16;

  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <StatusBar style={theme.statusBarStyle} />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.textColor }]}>
            {uiT("ui.in_app_purchases_are_only_available_on_ios_and_android_devices_3b67f920")} </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <StatusBar style="light" />

      {/* Gradient Background */}
      <LinearGradient
        colors={
          theme.isDark
            ? (["#1a1a2e", "#16213e"] as const)
            : (["#E8EAF6", "#C5CAE9"] as const)
        }
        style={styles.gradientBackground}
      />

      {/* Close Button - Absolute Positioned */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.closeButton, { top: (isCompactHeight ? 12 : 20) + topPadding }]}
        disabled={isPurchasing}
      >
        <Ionicons
          name="close"
          size={28}
          color={theme.isDark ? "#FFFFFF" : "#333333"}
        />
      </TouchableOpacity>

      {/* Header with Title */}
      <View
        style={[
          styles.header,
          {
            paddingTop: (isCompactHeight ? 24 : 40) + topPadding,
            paddingBottom: isCompactHeight ? 6 : 10,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            isCompactHeight && styles.headerTitleCompact,
            { color: theme.isDark ? "#FFFFFF" : "#333333" },
          ]}
        >
          {uiT("ui.support_this_app_2c6a378d")} </Text>
      </View>

      {!connected || isLoadingProducts ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            {!connected ? uiT("ui.connecting_to_store_fd12360f") : uiT("ui.loading_options_0a1a7f01")}
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={[
              styles.contentContainer,
              {
                paddingBottom: stickyFooterSpacer + insets.bottom,
                paddingTop: isCompactHeight ? 2 : 6,
              },
            ]}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fitContentContainer}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text
                style={[
                  styles.heroSubtitle,
                  {
                    color: theme.isDark
                      ? "rgba(255,255,255,0.8)"
                      : "rgba(0,0,0,0.6)",
                  },
                ]}
              >
                {uiT("ui.your_support_helps_me_continue_improving_this_app_and_adding_new_d4a0fd81")} </Text>
            </View>

            {/* Quick Support Actions */}
            <View style={styles.supportActionsRow}>
              <TouchableOpacity
                style={[
                  styles.supportActionButton,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                  },
                ]}
                onPress={() => {
                  void handleRateAppPress();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.supportActionIconContainer}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                </View>
                <Text
                  style={[styles.supportActionTitle, { color: theme.textColor }]}
                >
                  {uiT("ui.rate_app_b2eeb197")} </Text>
                <Text
                  style={[
                    styles.supportActionSubtitle,
                    {
                      color: theme.isDark
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(0,0,0,0.5)",
                    },
                  ]}
                >
                  {uiT("ui.help_others_find_kakehashi_4855a667")} </Text>
              </TouchableOpacity>

              {shouldShowPatreonOption && (
                <TouchableOpacity
                  style={[
                    styles.supportActionButton,
                    {
                      backgroundColor: theme.isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
                    },
                  ]}
                  onPress={() => {
                    void handlePatreonPress();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.supportActionIconContainer}>
                    <Svg width={20} height={20} viewBox="-2 -2.5 24 24">
                      <Path
                        d="M12.808.01c-3.95 0-7.164 3.196-7.164 7.125 0 3.916 3.214 7.103 7.164 7.103 3.938 0 7.142-3.187 7.142-7.103 0-3.93-3.204-7.125-7.142-7.125M.05 18.99V.01h3.502v18.98z"
                        fill="#FF424D"
                      />
                    </Svg>
                  </View>
                  <Text
                    style={[styles.supportActionTitle, { color: theme.textColor }]}
                  >
                    Patreon
                  </Text>
                  <Text
                    style={[
                      styles.supportActionSubtitle,
                      {
                        color: theme.isDark
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(0,0,0,0.5)",
                      },
                    ]}
                  >
                    {uiT("ui.recurring_monthly_support_e1af6ebe")} </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* One-time Tips Label */}
            <View
              style={[
                styles.oneTimeTipsSection,
                isCompactCardGrid && styles.oneTimeTipsSectionCompact,
              ]}
            >
              <View
                style={[
                  styles.oneTimeTipsDivider,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.2)",
                  },
                ]}
              />
              <Text
                style={[
                  styles.oneTimeTipsTitle,
                  isCompactCardGrid && styles.oneTimeTipsTitleCompact,
                  {
                    color: theme.isDark
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(0,0,0,0.8)",
                  },
                ]}
              >
                {uiT("ui.one_time_tips_1f14b485")} </Text>
              <View
                style={[
                  styles.oneTimeTipsDivider,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.2)",
                  },
                ]}
              />
            </View>

            {/* Tip Cards */}
            <View
              style={[
                styles.cardsContainer,
                isCompactCardGrid && styles.cardsContainerCompact,
              ]}
            >
              {TIP_OPTIONS.map((option) => {
                const isSelected = selectedTipId === option.id;
                const price = getProductPrice(
                  option.productId,
                  option.defaultPrice
                );

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.card,
                      isCompactCardGrid && styles.cardCompact,
                      isSelected && styles.cardSelected,
                      isSelected && {
                        borderWidth: isCompactCardGrid ? 2 : 3,
                        borderColor: option.gradient[0],
                      },
                    ]}
                    onPress={() => setSelectedTipId(option.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        theme.isDark
                          ? ([
                              "rgba(255,255,255,0.1)",
                              "rgba(255,255,255,0.05)",
                            ] as const)
                          : ([
                              "rgba(255,255,255,0.9)",
                              "rgba(255,255,255,0.7)",
                            ] as const)
                      }
                      style={[
                        styles.cardGradient,
                        isCompactCardGrid && styles.cardGradientCompact,
                      ]}
                    >
                      <View style={styles.cardContent}>
                        <View
                          style={[
                            styles.cardIcon,
                            isCompactCardGrid && styles.cardIconCompact,
                          ]}
                        >
                          <Ionicons
                            name={option.imagePlaceholder as any}
                            size={isCompactCardGrid ? 18 : 30}
                            color={
                              theme.isDark
                                ? "rgba(255,255,255,0.6)"
                                : "rgba(0,0,0,0.4)"
                            }
                          />
                        </View>

                        <Text
                          style={[
                            styles.cardTitle,
                            isCompactCardGrid && styles.cardTitleCompact,
                            {
                              color: theme.isDark
                                ? "rgba(255,255,255,0.9)"
                                : "rgba(0,0,0,0.9)",
                            },
                          ]}
                        >
                          {option.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardSubtitle,
                            isCompactCardGrid && styles.cardSubtitleCompact,
                            {
                              color: theme.isDark
                                ? "rgba(255,255,255,0.6)"
                                : "rgba(0,0,0,0.5)",
                            },
                          ]}
                        >
                          {option.subtitle}
                        </Text>

                        <View style={styles.cardSpacer} />
                        <Text
                          style={[
                            styles.priceText,
                            isCompactCardGrid && styles.priceTextCompact,
                            {
                              color: theme.isDark
                                ? "rgba(255,255,255,0.9)"
                                : "rgba(0,0,0,0.9)",
                            },
                          ]}
                        >
                          {price}
                        </Text>

                        <View
                          style={[
                            styles.radioButton,
                            isCompactCardGrid && styles.radioButtonCompact,
                            styles.cardRadioButton,
                            {
                              borderColor: isSelected
                                ? option.gradient[0]
                                : theme.isDark
                                ? "rgba(255,255,255,0.5)"
                                : "rgba(0,0,0,0.3)",
                            },
                          ]}
                        >
                          {isSelected && (
                            <LinearGradient
                              colors={
                                option.gradient as readonly [string, string]
                              }
                              style={[
                                styles.radioButtonFilled,
                                isCompactCardGrid && styles.radioButtonFilledCompact,
                              ]}
                            >
                              <View
                                style={[
                                  styles.radioButtonInner,
                                  isCompactCardGrid && styles.radioButtonInnerCompact,
                                ]}
                              />
                            </LinearGradient>
                          )}
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={
                    theme.isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"
                  }
                />
                <Text
                  style={[
                    styles.infoText,
                    {
                      color: theme.isDark
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(0,0,0,0.6)",
                    },
                  ]}
                >
                  {uiT("ui.secure_payment_via_apple_google_c062d761")} </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color={
                    theme.isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"
                  }
                />
                <Text
                  style={[
                    styles.infoText,
                    {
                      color: theme.isDark
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(0,0,0,0.6)",
                    },
                  ]}
                >
                  {uiT("ui.one_time_purchase_no_subscription_5f8003a4")} </Text>
              </View>
            </View>

            </View>
          </ScrollView>

          <View
            style={[
              styles.bottomContainer,
              {
                paddingBottom: 10 + insets.bottom,
                backgroundColor: theme.isDark
                  ? "rgba(18,18,30,0.92)"
                  : "rgba(255,255,255,0.92)",
                borderTopColor: theme.isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.12)",
              },
            ]}
            onLayout={(event) => {
              setStickyFooterHeight(event.nativeEvent.layout.height);
            }}
          >
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                isPurchasing && styles.purchaseButtonDisabled,
              ]}
              onPress={handlePurchase}
              disabled={isPurchasing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isPurchasing
                    ? (["#999", "#666"] as const)
                    : (["#f093fb", "#f5576c"] as const)
                }
                style={styles.purchaseButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.purchaseButtonText}>
                      {uiT("ui.continue_with_d2b79489")} {selectedOption?.title}
                    </Text>
                    <Text style={styles.purchaseButtonPrice}>
                      {selectedOption &&
                        getProductPrice(
                          selectedOption.productId,
                          selectedOption.defaultPrice
                        )}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text
              style={[
                styles.disclaimerText,
                {
                  color: theme.isDark
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(0,0,0,0.5)",
                },
              ]}
            >
              {uiT("ui.100_goes_to_supporting_app_development_aa123930")} </Text>
          </View>
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            <LinearGradient
              colors={["#f093fb", "#f5576c"] as const}
              style={styles.successModalGradient}
            >
              {/* Success Icon */}
              <View style={styles.successIconContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={60} color="#FFFFFF" />
                </View>
              </View>

              {/* Thank You Message */}
              <Text style={styles.successTitle}>{uiT("ui.thank_you_6b20d70f")}</Text>
              <Text style={styles.successMessage}>
                {uiT("ui.your_support_means_the_world_to_me_it_helps_keep_this_app_running_ae066f63")} </Text>

              {/* Appreciation Note */}
              <View style={styles.appreciationContainer}>
                <Ionicons
                  name="heart"
                  size={20}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.appreciationText}>
                  {uiT("ui.you_re_awesome_for_supporting_independent_development_1398b663")} </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.successCloseButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.back();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.successCloseButtonText}>{uiT("ui.done_11a6767d")}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerTitleCompact: {
    fontSize: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 8,
  },
  fitContentContainer: {
    width: "100%",
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 5,
    paddingBottom: 20,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  supportActionsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  supportActionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 120,
  },
  supportActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  supportActionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  supportActionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  oneTimeTipsSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  oneTimeTipsSectionCompact: {
    paddingHorizontal: 16,
    marginBottom: 9,
    gap: 8,
  },
  oneTimeTipsDivider: {
    flex: 1,
    height: 1,
  },
  oneTimeTipsTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  oneTimeTipsTitleCompact: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  cardsContainerCompact: {
    paddingHorizontal: 16,
    rowGap: 8,
  },
  card: {
    width: "48.5%",
    minHeight: 190,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0,
    borderColor: "transparent",
  },
  cardCompact: {
    minHeight: 132,
    borderRadius: 16,
  },
  cardSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 14,
  },
  cardGradientCompact: {
    padding: 8,
  },
  cardContent: {
    flex: 1,
    position: "relative",
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 12,
  },
  cardIconCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardTitleCompact: {
    fontSize: 12,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardSubtitleCompact: {
    fontSize: 9,
    lineHeight: 12,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  priceTextCompact: {
    fontSize: 15,
  },
  cardSpacer: {
    flex: 1,
  },
  cardRadioButton: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  radioButtonCompact: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  radioButtonFilled: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonFilledCompact: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  radioButtonInnerCompact: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  infoSection: {
    paddingHorizontal: 30,
    paddingVertical: 24,
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 14,
  },
  bottomContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 8,
  },
  purchaseButtonPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  disclaimerText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  successModalGradient: {
    padding: 40,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  appreciationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 32,
    gap: 10,
  },
  appreciationText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "500",
    flex: 1,
  },
  successCloseButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  successCloseButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f5576c",
  },
});
