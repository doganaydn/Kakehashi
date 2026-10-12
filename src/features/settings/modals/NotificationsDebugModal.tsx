import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function NotificationsDebugModal() {
  useInterfaceLanguage();
  const {
    expoPendingNotifications,
    formatExpoTriggerLabel,
    formatNativeTriggerLabel,
    handleShowPendingNotifications,
    modalHeaderPaddingTop,
    pendingNotifications,
    setShowNotificationsModal,
    showNotificationsModal,
    theme,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Notifications Debug Modal - Dev Only */}
      {__DEV__ && (
        <Modal
          visible={showNotificationsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor: theme.cardBackground,
                  borderBottomColor: theme.border,
                  paddingTop: modalHeaderPaddingTop,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setShowNotificationsModal(false)}
              >
                <Text
                  style={[styles.modalCancelText, { color: theme.primary }]}
                >
                  {uiT("ui.close_7d9eb7ac")} </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>
                {uiT("ui.scheduled_notifications_f8b32780")} </Text>
              <TouchableOpacity onPress={handleShowPendingNotifications}>
                <Text
                  style={[styles.modalCancelText, { color: theme.primary }]}
                >
                  {uiT("ui.refresh_0e916101")} </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {pendingNotifications && (
                <>
                  {/* Summary */}
                  <View
                    style={[
                      styles.cacheSection,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cacheSectionTitle,
                        { color: theme.textColor },
                      ]}
                    >
                      {uiT("ui.summary_8e76a94a")} </Text>
                    <View style={styles.cacheRow}>
                      <Text
                        style={[styles.cacheLabel, { color: theme.textColor }]}
                      >
                        {uiT("ui.total_notifications_f7ba4f7d")} </Text>
                      <Text
                        style={[
                          styles.cacheValue,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {pendingNotifications.count +
                          expoPendingNotifications.length}
                      </Text>
                    </View>
                    <View style={styles.cacheRow}>
                      <Text
                        style={[styles.cacheLabel, { color: theme.textColor }]}
                      >
                        {uiT("ui.native_scheduled_eb11033d")} </Text>
                      <Text
                        style={[
                          styles.cacheValue,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {pendingNotifications.count}
                      </Text>
                    </View>
                    <View style={styles.cacheRow}>
                      <Text
                        style={[styles.cacheLabel, { color: theme.textColor }]}
                      >
                        {uiT("ui.expo_scheduled_fe798297")} </Text>
                      <Text
                        style={[
                          styles.cacheValue,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {expoPendingNotifications.length}
                      </Text>
                    </View>
                  </View>

                  {/* Native Notifications List */}
                  {pendingNotifications.notifications.length > 0 && (
                    <View
                      style={[
                        styles.cacheSection,
                        {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cacheSectionTitle,
                          { color: theme.textColor },
                        ]}
                      >
                        {uiT("ui.native_scheduled_notifications_f5bbe05a")} </Text>
                      {pendingNotifications.notifications.map(
                        (notification, index) => (
                          <View
                            key={notification.identifier}
                            style={[
                              styles.largestItem,
                              { borderBottomColor: theme.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.largestItemRank,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {index + 1}.
                            </Text>
                            <View style={styles.largestItemInfo}>
                              <Text
                                style={[
                                  styles.largestItemKey,
                                  { color: theme.textColor },
                                ]}
                                numberOfLines={1}
                              >
                                {notification.title || notification.identifier}
                              </Text>
                              <Text
                                style={[
                                  styles.largestItemDetails,
                                  { color: theme.textSecondary },
                                ]}
                              >
                                {uiT("ui.badge_2b8a0ca2")} {notification.badge} •{" "}
                                {formatNativeTriggerLabel(notification.trigger)}
                              </Text>
                              <Text
                                style={[
                                  styles.largestItemDetails,
                                  { color: theme.textSecondary },
                                ]}
                              >
                                {notification.body}
                              </Text>
                            </View>
                          </View>
                        ),
                      )}
                    </View>
                  )}

                  {/* Expo Notifications List */}
                  {expoPendingNotifications.length > 0 && (
                    <View
                      style={[
                        styles.cacheSection,
                        {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cacheSectionTitle,
                          { color: theme.textColor },
                        ]}
                      >
                        {uiT("ui.expo_scheduled_notifications_f3e63811")} </Text>
                      {expoPendingNotifications.map((notification, index) => (
                        <View
                          key={notification.identifier}
                          style={[
                            styles.largestItem,
                            { borderBottomColor: theme.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.largestItemRank,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {index + 1}.
                          </Text>
                          <View style={styles.largestItemInfo}>
                            <Text
                              style={[
                                styles.largestItemKey,
                                { color: theme.textColor },
                              ]}
                              numberOfLines={1}
                            >
                              {notification.content.title ||
                                notification.identifier}
                            </Text>
                            <Text
                              style={[
                                styles.largestItemDetails,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {uiT("ui.trigger_ad478f8e")}{" "}
                              {formatExpoTriggerLabel(notification.trigger)}
                            </Text>
                            <Text
                              style={[
                                styles.largestItemDetails,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {notification.content.body || uiT("ui.no_body_e5c6c602")}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Empty state */}
                  {pendingNotifications.notifications.length === 0 &&
                    expoPendingNotifications.length === 0 && (
                      <View
                        style={[
                          styles.cacheSection,
                          {
                            backgroundColor: theme.cardBackground,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cacheSectionTitle,
                            { color: theme.textColor },
                          ]}
                        >
                          {uiT("ui.no_scheduled_notifications_76459ba5")} </Text>
                        <Text
                          style={[
                            styles.cacheLabel,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {uiT("ui.no_notifications_are_currently_scheduled_enable_notification_sett_082ed0e4")} </Text>
                      </View>
                    )}
                </>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </>
  );
}
