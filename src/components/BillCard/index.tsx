import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Bill, BILL_TYPE_LABEL, BILL_STATUS_LABEL } from '@/types';
import { formatAmount, formatDate, maskBillNo, calcRemainingPercent } from '@/utils/format';

interface BillCardProps {
  bill: Bill;
  showSplitCount?: boolean;
  onClick?: () => void;
}

const BillCard: React.FC<BillCardProps> = ({ bill, showSplitCount = true, onClick }) => {
  const remainingPercent = calcRemainingPercent(bill.amount, bill.remainingAmount);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/bill-detail/index?id=${bill.id}`
      });
    }
  };

  const getStatusColorClass = () => {
    switch (bill.status) {
      case 'active':
        return styles.statusActive;
      case 'partial_split':
        return styles.statusPartial;
      case 'fully_split':
        return styles.statusFull;
      case 'matured':
        return styles.statusMatured;
      case 'expired':
        return styles.statusExpired;
      default:
        return '';
    }
  };

  return (
    <View className={styles.billCard} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <View className={styles.typeTag}>
          <Text>{BILL_TYPE_LABEL[bill.type]}</Text>
        </View>
        <View className={classnames(styles.statusTag, getStatusColorClass())}>
          <Text>{BILL_STATUS_LABEL[bill.status]}</Text>
        </View>
      </View>

      <View className={styles.amountSection}>
        <Text className={styles.amountLabel}>票面金额</Text>
        <Text className={styles.amountValue}>¥ {formatAmount(bill.amount)}</Text>
      </View>

      <View className={styles.billNoRow}>
        <Text className={styles.billNoLabel}>票据号</Text>
        <Text className={styles.billNoValue}>{maskBillNo(bill.billNo)}</Text>
      </View>

      <View className={styles.issuerRow}>
        <Text className={styles.issuerLabel}>出票方</Text>
        <Text className={styles.issuerValue}>{bill.issuer}</Text>
      </View>

      <View className={styles.progressSection}>
        <View className={styles.progressHeader}>
          <Text className={styles.remainingLabel}>可拆余额</Text>
          <View className={styles.remainingRight}>
            <Text className={styles.remainingValue}>¥ {formatAmount(bill.remainingAmount)}</Text>
            {showSplitCount && bill.splitCount > 0 && (
              <Text className={styles.splitCount}>已拆{bill.splitCount}次</Text>
            )}
          </View>
        </View>
        <View className={styles.progressBar}>
          <View
            className={classnames(
              styles.progressFill,
              remainingPercent === 0 && styles.progressFull
            )}
            style={{ width: `${remainingPercent}%` }}
          />
        </View>
      </View>

      <View className={styles.footerRow}>
        <View className={styles.dateItem}>
          <Text className={styles.dateLabel}>出票</Text>
          <Text className={styles.dateValue}>{formatDate(bill.issueDate, 'MM-DD')}</Text>
        </View>
        <View className={styles.dateDivider} />
        <View className={styles.dateItem}>
          <Text className={styles.dateLabel}>到期</Text>
          <Text className={styles.dateValue}>{formatDate(bill.dueDate, 'MM-DD')}</Text>
        </View>
      </View>
    </View>
  );
};

export default BillCard;
