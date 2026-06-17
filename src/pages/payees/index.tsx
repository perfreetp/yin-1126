import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBillStore } from '@/store/useBillStore';
import PayeeItem from '@/components/PayeeItem';
import EmptyState from '@/components/EmptyState';
import { PAYEE_CATEGORY_LABEL, PayeeCategory } from '@/types';

const CATEGORY_TABS: { key: 'all' | PayeeCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'material', label: PAYEE_CATEGORY_LABEL['material'] },
  { key: 'logistics', label: PAYEE_CATEGORY_LABEL['logistics'] },
  { key: 'processor', label: PAYEE_CATEGORY_LABEL['processor'] },
  { key: 'other', label: PAYEE_CATEGORY_LABEL['other'] }
];

const PayeesPage: React.FC = () => {
  const { payees, toggleFavorite } = useBillStore();
  const [activeTab, setActiveTab] = useState<'all' | PayeeCategory>('all');
  const [searchText, setSearchText] = useState('');

  const filteredPayees = useMemo(() => {
    return payees
      .filter((p) => {
        if (activeTab !== 'all' && p.category !== activeTab) return false;
        if (searchText.trim()) {
          const kw = searchText.toLowerCase();
          return p.name.toLowerCase().includes(kw) || p.contactName.toLowerCase().includes(kw);
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
      });
  }, [payees, activeTab, searchText]);

  const favoriteList = filteredPayees.filter((p) => p.isFavorite);
  const normalList = filteredPayees.filter((p) => !p.isFavorite);

  const handleSearch = () => {
    Taro.showModal({
      title: '搜索收款方',
      editable: true,
      placeholderText: '输入公司名或联系人',
      content: searchText,
      success: (res) => {
        if (res.confirm) {
          setSearchText(res.content || '');
        }
      }
    });
  };

  const handleAdd = () => {
    Taro.showModal({
      title: '新增收款方',
      content: '功能开发中，敬请期待',
      showCancel: false
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchInput} onClick={handleSearch}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={styles.searchText}>
            {searchText || '搜索公司名、联系人'}
          </Text>
          {searchText && (
            <Text
              style={{ color: '#86909C', fontSize: '24rpx' }}
              onClick={(e) => {
                e.stopPropagation();
                setSearchText('');
              }}
            >
              ✕
            </Text>
          )}
        </View>
      </View>

      <ScrollView scrollX className={styles.tabsRow}>
        {CATEGORY_TABS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabChip, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.listSection}>
        <View className={styles.paddingPage}>
          {filteredPayees.length > 0 ? (
            <View className={styles.payeeList}>
              {favoriteList.length > 0 && (
                <>
                  <View className={styles.sectionHeader}>
                    <View className={styles.sectionTitle}>
                      <View className={styles.sectionDot} />
                      <Text>常用收款方</Text>
                    </View>
                    <View className={styles.sectionCount}>
                      <Text>{favoriteList.length} 个</Text>
                    </View>
                  </View>
                  {favoriteList.map((payee) => (
                    <PayeeItem
                      key={payee.id}
                      payee={payee}
                      showFavorite
                      onFavorite={() => toggleFavorite(payee.id)}
                    />
                  ))}
                </>
              )}

              {normalList.length > 0 && (
                <>
                  <View className={styles.sectionHeader}>
                    <View className={styles.sectionTitle}>
                      <View className={styles.sectionDot} style={{ background: '#86909C' }} />
                      <Text>其他收款方</Text>
                    </View>
                    <View className={styles.sectionCount}>
                      <Text>{normalList.length} 个</Text>
                    </View>
                  </View>
                  {normalList.map((payee) => (
                    <PayeeItem
                      key={payee.id}
                      payee={payee}
                      showFavorite
                      onFavorite={() => toggleFavorite(payee.id)}
                    />
                  ))}
                </>
              )}
            </View>
          ) : (
            <EmptyState
              title="暂无收款方"
              description={searchText ? '试试其他关键词' : '点击右下角按钮添加第一个收款方'}
              icon="👥"
              actionText={searchText ? '清除搜索' : undefined}
              onAction={searchText ? () => setSearchText('') : undefined}
            />
          )}
        </View>
      </View>

      <View className={styles.fab} onClick={handleAdd}>
        <Text className={styles.fabIcon}>＋</Text>
        <Text className={styles.fabLabel}>新增</Text>
      </View>
    </ScrollView>
  );
};

export default PayeesPage;
