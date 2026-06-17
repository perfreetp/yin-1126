import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { SplitRecord, SPLIT_STATUS_LABEL, PAYEE_CATEGORY_LABEL } from '@/types';
import { formatAmount, humanizeDate, maskBillNo } from '@/utils/format';

interface SplitItemProps {
  record: SplitRecord;
  onClick?: () => void;
  showActions?: boolean;
  onSign?: () => void;
  onUrge?: () => void;
}

const SplitItem: React.FC<SplitItemProps> = ({ record, onClick, showActions, onSign, onUrge }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/split-detail/index?id=${record.id}`
      });
    }
  };

  const getStatusColor = () => {
    switch (record.status) {
      case 'pending_boss':
        return styles.statusPending;
      case 'rejected':
        return styles.statusRejected;
      case 'pending_sign':
        return styles.statusSign;
      case 'signed':
        return styles.statusSigned;
      case 'overdue':
        return styles.statusOverdue;
      default:
        return '';
    }
  };

  const getCategoryColor = () => {
    switch (record.payeeCategory) {
      case 'material':
        return 'catMaterial';
      case 'logistics':
        return 'catLogistics';
      case 'processor':
        return 'catProcessor';
      default:
        return 'catOther';
    }
  };

  return (
    <View className={styles.splitItem} onClick={handleClick}>
      <View className={styles.headerRow}>
        <View className={styles.payeeWrap}>
          <View className={classnames(styles.catBadge, styles[getCategoryColor()])}>
            <Text>{PAYEE_CATEGORY_LABEL[record.payeeCategory]}</Text>
          </View>
          <Text className={styles.payeeName}>{record.payeeName}</Text>
        </View>
        <View className={classnames(styles.statusTag, getStatusColor())}>
          <Text>{SPLIT_STATUS_LABEL[record.status]}</Text>
        </View>
      </View>

      <View className={styles.amountRow}>
        <Text className={styles.amountLabel}>拆分金额</Text>
        <Text className={styles.amountValue}>¥ {formatAmount(record.amount)}</Text>
      </View>

      <View className={styles.purposeRow}>
        <Text className={styles.purposeText}>{record.purpose}</Text>
      </View>

      <View className={styles.billRow}>
        <Text className={styles.billLabel}>票据号</Text>
        <Text className={styles.billValue}>{maskBillNo(record.billNo)}</Text>
      </View>

      <View className={styles.footerRow}>
        <Text className={styles.timeText}>{humanizeDate(record.createdAt)}</Text>
        <View className={styles.rightMeta}>
          {record.urgedCount > 0 && (
            <Text className={styles.urgeText}>催办{record.urgedCount}次</Text>
          )}
          {record.status === 'rejected' && record.rejectReason && (
            <Text className={styles.rejectReason}>驳回：{record.rejectReason}</Text>
          )}
        </View>
      </View>

      {showActions && (record.status === 'pending_sign' || record.status === 'overdue') && (
        <View className={styles.actionRow}>
          {record.status === 'overdue' && (
            <View
              className={classnames(styles.actionBtn, styles.actionBtnWarning)}
              onClick={(e) => {
                e.stopPropagation();
                onUrge && onUrge();
              }}
            >
              <Text>催办</Text>
            </View>
          )}
          <View
            className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
            onClick={(e) => {
              e.stopPropagation();
              onSign && onSign();
            }}
          >
            <Text>确认收款</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default SplitItem;
