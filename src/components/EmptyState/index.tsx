import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description = '这里什么也没有',
  icon = '📋',
  actionText,
  onAction
}) => {
  return (
    <View className={styles.emptyState}>
      <View className={styles.iconWrap}>
        <Text className={styles.icon}>{icon}</Text>
      </View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.description}>{description}</Text>
      {actionText && onAction && (
        <View className={styles.actionBtn} onClick={onAction}>
          <Text>{actionText}</Text>
        </View>
      )}
    </View>
  );
};

export default EmptyState;
