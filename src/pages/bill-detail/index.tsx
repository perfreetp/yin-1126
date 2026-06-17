import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useBillStore } from '@/store/useBillStore';
import SplitItem from '@/components/SplitItem';
import EmptyState from '@/components/EmptyState';
import {
  BILL_TYPE_LABEL,
  BILL_STATUS_LABEL
} from '@/types';
import {
  formatAmount,
  formatDate,
  formatDateTime,
  calcRemainingPercent,
  maskBillNo
} from '@/utils/format';

const BillDetailPage: React.FC = () => {
  const router = useRouter();
  const billId = router.params.id as string;
  const { getBillById, getSplitsByBillId } = useBillStore();

  const bill = useMemo(() => getBillById(billId), [billId, getBillById]);
  const splits = useMemo(() => getSplitsByBillId(billId), [billId, getSplitsByBillId]);

  if (!bill) {
    return (
      <View className={styles.page}>
        <EmptyState title="票据不存在" description="该票据可能已被删除" icon="❌" />
      </View>
    );
  }

  const remainingPercent = calcRemainingPercent(bill.amount, bill.remainingAmount);
  const canSplit = bill.remainingAmount > 0 && bill.status !== 'expired';

  const handleGoSplit = () => {
    if (!canSplit) {
      Taro.showToast({ title: '该票据暂不可拆分', icon: 'none' });
      return;
    }
    Taro.switchTab({ url: '/pages/split/index' });
  };

  const handleGenerateVoucher = () => {
    Taro.showModal({
      title: '流转凭证',
      content: `票据号：${bill.billNo}\n票面金额：¥${formatAmount(bill.amount)}\n已拆 ${splits.length} 笔\n剩余 ¥${formatAmount(bill.remainingAmount)}\n\n凭证已生成，可前往文件查看`,
      showCancel: false,
      confirmText: '我知道了'
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.headerCard}>
        <View className={styles.typeRow}>
          <View className={styles.typeBadge}>
            <Text>{BILL_TYPE_LABEL[bill.type]}</Text>
          </View>
          <View className={styles.statusBadge}>
            <Text>{BILL_STATUS_LABEL[bill.status]}</Text>
          </View>
        </View>
        <Text className={styles.amountLabel}>票面金额</Text>
        <Text className={styles.amountValue}>¥ {formatAmount(bill.amount)}</Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>出票日期</Text>
            <Text className={styles.infoValue}>{formatDate(bill.issueDate)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>到期日期</Text>
            <Text className={styles.infoValue}>{formatDate(bill.dueDate)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.remainingSection}>
        <View className={styles.remainingHeader}>
          <Text className={styles.remainingTitle}>可拆余额</Text>
          {bill.splitCount > 0 && (
            <View className={styles.splitCountBadge}>
              <Text>已拆 {bill.splitCount} 次</Text>
            </View>
          )}
        </View>
        <View className={styles.remainingRow}>
          <Text className={styles.remainingAmount}>¥ {formatAmount(bill.remainingAmount)}</Text>
          <Text className={styles.totalAmount}>
            占票面 {remainingPercent}%
          </Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${remainingPercent}%` }}
          />
        </View>
      </View>

      <View className={styles.detailSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>票据信息</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>票据号</Text>
          <Text className={styles.detailValue}>{bill.billNo}</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>出票方</Text>
          <Text className={styles.detailValue}>{bill.issuer}</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>付款方</Text>
          <Text className={styles.detailValue}>{bill.payer}</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>收款人</Text>
          <Text className={styles.detailValue}>{bill.payee}</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>录入时间</Text>
          <Text className={styles.detailValue}>{formatDateTime(bill.createdAt)}</Text>
        </View>
      </View>

      <View className={styles.detailSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>拆分记录（{splits.length}）</Text>
          <View className={styles.voucherBtn} onClick={handleGenerateVoucher}>
            <Text>📄 流转凭证</Text>
          </View>
        </View>
        {splits.length > 0 ? (
          <View className={styles.historyList}>
            {splits.map((s) => (
              <SplitItem key={s.id} record={s} />
            ))}
          </View>
        ) : (
          <EmptyState
            title="暂无拆分记录"
            description="点击下方按钮开始第一笔拆分"
            icon="✂️"
          />
        )}
      </View>

      <View style={{ height: '120rpx' }} />
    </ScrollView>
  );
};

export default BillDetailPage;
