import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Payee, PAYEE_CATEGORY_LABEL } from '@/types';
import { formatAmountWan } from '@/utils/format';

interface PayeeItemProps {
  payee: Payee;
  selected?: boolean;
  showFavorite?: boolean;
  onClick?: () => void;
  onFavorite?: () => void;
}

const PayeeItem: React.FC<PayeeItemProps> = ({
  payee,
  selected = false,
  showFavorite = true,
  onClick,
  onFavorite
}) => {
  const getCategoryColor = () => {
    switch (payee.category) {
      case 'material':
        return styles.catMaterial;
      case 'logistics':
        return styles.catLogistics;
      case 'processor':
        return styles.catProcessor;
      default:
        return styles.catOther;
    }
  };

  return (
    <View
      className={classnames(styles.payeeItem, selected && styles.selected)}
      onClick={onClick}
    >
      <View className={styles.avatar}>
        <Text>{payee.name.slice(0, 2)}</Text>
      </View>
      <View className={styles.infoWrap}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{payee.name}</Text>
          <View className={classnames(styles.categoryTag, getCategoryColor())}>
            <Text>{PAYEE_CATEGORY_LABEL[payee.category]}</Text>
          </View>
        </View>
        <View className={styles.contactRow}>
          <Text className={styles.contact}>{payee.contactName} · {payee.contactPhone}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.totalText}>累计收款 {formatAmountWan(payee.totalReceived)}</Text>
        </View>
      </View>
      {showFavorite && (
        <View
          className={classnames(styles.favorite, payee.isFavorite && styles.isFavorite)}
          onClick={(e) => {
            e.stopPropagation();
            onFavorite && onFavorite();
          }}
        >
          <Text>{payee.isFavorite ? '★' : '☆'}</Text>
        </View>
      )}
      {selected && (
        <View className={styles.checkIcon}>
          <Text>✓</Text>
        </View>
      )}
    </View>
  );
};

export default PayeeItem;
