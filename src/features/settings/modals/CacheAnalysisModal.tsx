import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import {SettingsIcon as Ionicons} from "../../../ui/settings/settings-icon";
import React from "react";

import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function CacheAnalysisModal() {
  useInterfaceLanguage();
  const {
    cacheAnalysis,
    handleCacheAnalysis,
    handleClearCategory,
    handleClearLargeItems,
    handleDetailedSubjectsAnalysis,
    modalHeaderPaddingTop,
    setShowCacheModal,
    showCacheModal,
    theme,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Cache Analysis Modal */}
      <Modal
        visible={showCacheModal}
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
            <TouchableOpacity onPress={() => setShowCacheModal(false)}>
              <Text style={[styles.modalCancelText, { color: theme.primary }]}>
                {uiT("ui.close_7d9eb7ac")} </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {uiT("ui.cache_analysis_1dbae6db")} </Text>
            <TouchableOpacity onPress={handleCacheAnalysis}>
              <Text style={[styles.modalCancelText, { color: theme.primary }]}>
                {uiT("ui.refresh_0e916101")} </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {cacheAnalysis && (
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
                      {uiT("ui.total_size_26ecb633")} </Text>
                    <Text
                      style={[
                        styles.cacheValue,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {cacheAnalysis.totalSizeFormatted}
                    </Text>
                  </View>
                  <View style={styles.cacheRow}>
                    <Text
                      style={[styles.cacheLabel, { color: theme.textColor }]}
                    >
                      {uiT("ui.total_items_69d2cf85")} </Text>
                    <Text
                      style={[
                        styles.cacheValue,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {cacheAnalysis.itemCount}
                    </Text>
                  </View>
                </View>

                {/* Quick Actions */}
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
                    {uiT("ui.quick_actions_2cc2b6f7")} </Text>
                  <TouchableOpacity
                    style={[
                      styles.cacheActionButton,
                      { borderColor: theme.border },
                    ]}
                    onPress={handleClearLargeItems}
                  >
                    <Ionicons name="trash" size={20} color="#e53935" />
                    <Text
                      style={[styles.cacheActionText, { color: "#e53935" }]}
                    >
                      {uiT("ui.clear_large_items_c3ef594c")}{">"}{uiT("ui.5mb_0e0551d7")} </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cacheActionButton,
                      { borderColor: theme.border },
                    ]}
                    onPress={handleDetailedSubjectsAnalysis}
                  >
                    <Ionicons
                      name="analytics"
                      size={20}
                      color={theme.primary}
                    />
                    <Text
                      style={[styles.cacheActionText, { color: theme.primary }]}
                    >
                      {uiT("ui.analyze_subjects_cache_981e8e0b")} </Text>
                  </TouchableOpacity>
                </View>

                {/* Categories */}
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
                    {uiT("ui.by_category_4171d1ae")} </Text>
                  {Object.entries(cacheAnalysis.categories)
                    .sort(([, a], [, b]) => b.size - a.size)
                    .map(([category, data]) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryItem,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() => handleClearCategory(category)}
                      >
                        <View style={styles.categoryInfo}>
                          <Text
                            style={[
                              styles.categoryName,
                              { color: theme.textColor },
                            ]}
                          >
                            {category}
                          </Text>
                          <Text
                            style={[
                              styles.categoryDetails,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {data.sizeFormatted} • {data.count} {uiT("ui.items_5f3c4f85")} </Text>
                        </View>
                        <Ionicons
                          name="trash"
                          size={16}
                          color={theme.textSecondary}
                        />
                      </TouchableOpacity>
                    ))}
                </View>

                {/* Largest Items */}
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
                    {uiT("ui.largest_items_ce760dc6")} </Text>
                  {cacheAnalysis.largestItems
                    .slice(0, 10)
                    .map((item, index) => (
                      <View
                        key={item.key}
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
                            {item.key}
                          </Text>
                          <Text
                            style={[
                              styles.largestItemDetails,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {item.sizeFormatted} • {item.category}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
