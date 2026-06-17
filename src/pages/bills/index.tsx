import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBillStore } from '@/store/useBillStore';
import BillCard from '@/components/BillCard';
import EmptyState from '@/components/EmptyState';
import { BILL_STATUS_LABEL, BillStatus } from '@/types';
import { formatAmountWan } from '@/utils/format';

type FilterTab = 'all' | BillStatus | 'has_remaining';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: BILL_STATUS_LABEL['active'] },
  { key: 'partial_split', label: BILL_STATUS_LABEL['partial_split'] },
  { key: 'has_remaining', label: '可拆分' },
  { key: 'fully_split', label: BILL_STATUS_LABEL['fully_split'] },
  { key: 'matured', label: BILL_STATUS_LABEL['matured'] },
  { key: 'expired', label: BILL_STATUS_LABEL['expired'] }
];

const BillsPage: React.FC = () => {
  const { bills, getDashboardStats } = useBillStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchText, setSearchText] = useState('');

  const stats = getDashboardStats();

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (activeFilter === 'has_remaining') {
        if (bill.remainingAmount <= 0) return false;
      } else if (activeFilter !== 'all') {
        if (bill.status !== activeFilter) return false;
      }
      if (searchText.trim()) {
        const keyword = searchText.toLowerCase();
        return (
          bill.billNo.toLowerCase().includes(keyword) ||
          bill.issuer.toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  }, [bills, activeFilter, searchText]);

  const summary = useMemo(() => {
    const hasRemaining = bills.filter((b) => b.remainingAmount > 0).length;
    const totalRemaining = bills.reduce((sum, b) => sum + b.remainingAmount, 0);
    const expiringSoon = bills.filter(
      (b) => b.status === 'matured' || b.status === 'expired'
    ).length;
    return { hasRemaining, totalRemaining, expiringSoon };
  }, [bills]);

  const handleScan = () => {
    Taro.navigateTo({ url: '/pages/bill-scan/index' });
  };

  const handleSearch = () => {
    Taro.showModal({
      title: '搜索票据',
      editable: true,
      placeholderText: '输入票据号或出票方',
      success: (res) => {
        if (res.confirm && res.content) {
          setSearchText(res.content);
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchInput} onClick={handleSearch}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={styles.searchText}>
            {searchText || '搜索票据号、出票方'}
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

        <ScrollView scrollX className={styles.filterTabs}>
          {filterTabs.map((tab) => (
            <View
              key={tab.key}
              className={classnames(styles.filterTab, activeFilter === tab.key && styles.active)}
              onClick={() => setActiveFilter(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.statSummary}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{summary.hasRemaining}</Text>
          <Text className={styles.statLabel}>可拆分票据</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{formatAmountWan(summary.totalRemaining)}</Text>
          <Text className={styles.statLabel}>可拆总额</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{summary.expiringSoon}</Text>
          <Text className={styles.statLabel}>到期/逾期</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.listSection}>
        <View className={styles.billList}>
          {filteredBills.length > 0 ? (
            filteredBills.map((bill) => <BillCard key={bill.id} bill={bill} />)
          ) : (
            <EmptyState
              title="没有匹配的票据"
              description={searchText ? '试试其他关键词' : '点击右下角按钮添加票据'}
              icon="📋"
              actionText={searchText ? '清除搜索' : undefined}
              onAction={searchText ? () => setSearchText('') : undefined}
            />
          )}
        </View>
      </ScrollView>

      <View className={styles.fab} onClick={handleScan}>
        <Text className={styles.fabIcon}>📷</Text>
        <Text className={styles.fabLabel}>录票</Text>
      </View>
    </View>
  );
};

export default BillsPage;
