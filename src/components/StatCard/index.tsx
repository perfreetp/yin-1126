import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'none';
  trendValue?: string;
  highlight?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  trend = 'none',
  trendValue,
  highlight = false,
  color = 'primary',
  onClick
}) => {
  return (
    <View
      className={classnames(
        styles.statCard,
        highlight && styles.highlight,
        color === 'success' && styles.colorSuccess,
        color === 'warning' && styles.colorWarning,
        color === 'error' && styles.colorError
      )}
      onClick={onClick}
    >
      <View className={styles.label}>
        <Text>{label}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      <View className={styles.valueWrap}>
        <Text className={styles.value}>{value}</Text>
      </View>
      {trend !== 'none' && trendValue && (
        <View className={classnames(styles.trend, trend === 'up' && styles.trendUp, trend === 'down' && styles.trendDown)}>
          <Text>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}</Text>
          <Text>{trendValue}</Text>
        </View>
      )}
    </View>
  );
};

export default StatCard;
