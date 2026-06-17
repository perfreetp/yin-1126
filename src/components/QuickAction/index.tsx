import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

interface QuickActionItem {
  key: string;
  icon: string;
  label: string;
  url?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

interface QuickActionProps {
  actions: QuickActionItem[];
  columns?: 3 | 4 | 5;
}

const QuickAction: React.FC<QuickActionProps> = ({ actions, columns = 4 }) => {
  const handleClick = (action: QuickActionItem) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.url) {
      Taro.navigateTo({ url: action.url });
    }
  };

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'success':
        return styles.colorSuccess;
      case 'warning':
        return styles.colorWarning;
      case 'error':
        return styles.colorError;
      default:
        return styles.colorPrimary;
    }
  };

  return (
    <View
      className={classnames(styles.quickGrid, columns === 3 && styles.cols3, columns === 5 && styles.cols5)}
    >
      {actions.map((action) => (
        <View key={action.key} className={styles.actionItem} onClick={() => handleClick(action)}>
          <View className={classnames(styles.iconWrap, getColorClass(action.color))}>
            <Text>{action.icon}</Text>
          </View>
          <Text className={styles.label}>{action.label}</Text>
        </View>
      ))}
    </View>
  );
};

export default QuickAction;
