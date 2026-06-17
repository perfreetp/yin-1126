import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBillStore } from '@/store/useBillStore';
import SplitItem from '@/components/SplitItem';
import EmptyState from '@/components/EmptyState';
import { SplitStatus, PAYEE_CATEGORY_LABEL, PayeeCategory } from '@/types';
import { formatAmountWan } from '@/utils/format';
import dayjs from 'dayjs';

type StatusFilter = 'all' | SplitStatus;
type TimeFilter = 'all' | 'month' | 'week';

const statusTabs: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'signed', label: '已签收' },
  { key: 'pending_sign', label: '待签收' },
  { key: 'pending_boss', label: '待审批' },
  { key: 'overdue', label: '逾期' },
  { key: 'rejected', label: '已驳回' }
];

const timeTabs: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: '全部时间' },
  { key: 'month', label: '本月' },
  { key: 'week', label: '本周' }
];

const ReceiptPage: React.FC = () => {
  const { splitRecords, payees, signSplit, urgeSplit } = useBillStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedPayee, setSelectedPayee] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PayeeCategory | null>(null);

  const summary = useMemo(() => {
    const totalSigned = splitRecords
      .filter((s) => s.status === 'signed')
      .reduce((sum, s) => sum + s.amount, 0);
    const pendingSign = splitRecords.filter((s) => s.status === 'pending_sign').length;
    const overdueCount = splitRecords.filter((s) => s.status === 'overdue').length;
    const monthStartTs = dayjs().startOf('month').toDate().getTime();
    const monthSigned = splitRecords
      .filter(
        (s) =>
          s.status === 'signed' &&
          s.signedAt &&
          new Date(s.signedAt).getTime() >= monthStartTs
      )
      .reduce((sum, s) => sum + s.amount, 0);
    return { totalSigned, pendingSign, overdueCount, monthSigned };
  }, [splitRecords]);

  const filteredRecords = useMemo(() => {
    const now = dayjs();
    const monthStart = now.startOf('month').toDate().getTime();
    const weekStart = now.startOf('week').toDate().getTime();

    return splitRecords
      .filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (selectedPayee && r.payeeId !== selectedPayee) return false;
        if (selectedCategory && r.payeeCategory !== selectedCategory) return false;
        const compareTimeStr = r.status === 'signed' && r.signedAt ? r.signedAt : r.createdAt;
        const compareTs = new Date(compareTimeStr).getTime();
        if (timeFilter === 'month' && compareTs < monthStart) return false;
        if (timeFilter === 'week' && compareTs < weekStart) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [splitRecords, statusFilter, timeFilter, selectedPayee, selectedCategory]);

  const handlePayeeFilter = () => {
    const payeeList = payees.map((p) => p.name);
    Taro.showActionSheet({
      itemList: ['全部供应商', ...payeeList],
      success: (res) => {
        if (res.tapIndex === 0) {
          setSelectedPayee(null);
        } else {
          const payee = payees[res.tapIndex - 1];
          setSelectedPayee(payee.id);
          setSelectedCategory(null);
        }
      }
    });
  };

  const handleCategoryFilter = () => {
    const cats = ['全部类别', ...Object.values(PAYEE_CATEGORY_LABEL)];
    Taro.showActionSheet({
      itemList: cats,
      success: (res) => {
        if (res.tapIndex === 0) {
          setSelectedCategory(null);
        } else {
          const keys = Object.keys(PAYEE_CATEGORY_LABEL) as PayeeCategory[];
          setSelectedCategory(keys[res.tapIndex - 1]);
          setSelectedPayee(null);
        }
      }
    });
  };

  const handleConfirmReceipt = (splitId: string) => {
    Taro.showModal({
      title: '确认收款',
      content: '确认该笔拆分已完成对方签收？',
      success: (res) => {
        if (res.confirm) {
          signSplit(splitId);
          Taro.showToast({ title: '已确认签收', icon: 'success' });
        }
      }
    });
  };

  const handleItemClick = (record) => {
    Taro.navigateTo({
      url: `/pages/split-detail/index?id=${record.id}`
    });
  };

  const selectedPayeeName = payees.find((p) => p.id === selectedPayee)?.name;
  const selectedCategoryName = selectedCategory ? PAYEE_CATEGORY_LABEL[selectedCategory] : null;

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.summarySection}>
        <Text className={styles.summaryTitle}>累计已收款</Text>
        <Text className={styles.summaryAmount}>¥ {formatAmountWan(summary.totalSigned)}</Text>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryItemValue}>{formatAmountWan(summary.monthSigned)}</Text>
            <Text className={styles.summaryItemLabel}>本月签收</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryItemValue}>{summary.pendingSign}</Text>
            <Text className={styles.summaryItemLabel}>待签收</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryItemValue}>{summary.overdueCount}</Text>
            <Text className={styles.summaryItemLabel}>逾期</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.timeTabs}>
          {timeTabs.map((tab) => (
            <View
              key={tab.key}
              className={classnames(styles.timeTab, timeFilter === tab.key && styles.timeActive)}
              onClick={() => setTimeFilter(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.filterRow}>
          <View className={styles.filterSelect} onClick={handlePayeeFilter}>
            <Text className={selectedPayee ? styles.filterValue : styles.filterPlaceholder}>
              {selectedPayeeName || '选择供应商'}
            </Text>
            <Text className={styles.arrowIcon}>▼</Text>
          </View>
          <View className={styles.filterSelect} onClick={handleCategoryFilter}>
            <Text className={selectedCategory ? styles.filterValue : styles.filterPlaceholder}>
              {selectedCategoryName || '按类别'}
            </Text>
            <Text className={styles.arrowIcon}>▼</Text>
          </View>
        </View>

        <ScrollView scrollX className={styles.statusTabs}>
          {statusTabs.map((tab) => (
            <View
              key={tab.key}
              className={classnames(styles.statusTab, statusFilter === tab.key && styles.active)}
              onClick={() => setStatusFilter(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.listSection}>
        <View className={styles.paddingPage}>
          {filteredRecords.length > 0 ? (
            <View className={styles.splitList}>
              {filteredRecords.map((record) => (
                <SplitItem
                  key={record.id}
                  record={record}
                  showActions
                  onClick={() => handleItemClick(record)}
                  onSign={() => handleConfirmReceipt(record.id)}
                  onUrge={() => {
                    urgeSplit(record.id);
                    Taro.showToast({ title: '催办已发送', icon: 'success' });
                  }}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="暂无流转记录"
              description="拆分票据后，流转记录会显示在这里"
              icon="📄"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default ReceiptPage;
