import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Todo, TODO_TYPE_LABEL } from '@/types';
import { formatAmountWan, humanizeDate } from '@/utils/format';

interface TodoCardProps {
  todo: Todo;
  onAction?: () => void;
  actionText?: string;
}

const TodoCard: React.FC<TodoCardProps> = ({ todo, onAction, actionText }) => {
  const getTypeColor = () => {
    switch (todo.type) {
      case 'boss_approval':
        return styles.typeApproval;
      case 'sign_confirm':
        return styles.typeSign;
      case 'overdue_urge':
        return styles.typeOverdue;
      case 'mature_remind':
        return styles.typeMature;
      default:
        return '';
    }
  };

  const getPriorityDot = () => {
    switch (todo.priority) {
      case 'high':
        return styles.dotHigh;
      case 'medium':
        return styles.dotMedium;
      default:
        return styles.dotLow;
    }
  };

  return (
    <View className={classnames(styles.todoCard, todo.isDone && styles.isDone)}>
      <View className={styles.priorityDot}>
        <View className={getPriorityDot()} />
      </View>
      <View className={styles.contentWrap}>
        <View className={styles.headerRow}>
          <View className={classnames(styles.typeTag, getTypeColor())}>
            <Text>{TODO_TYPE_LABEL[todo.type]}</Text>
          </View>
          <Text className={styles.deadline}>截止：{humanizeDate(todo.deadlineAt)}</Text>
        </View>
        <Text className={styles.title}>{todo.title}</Text>
        <Text className={styles.desc}>{todo.description}</Text>
        <View className={styles.footerRow}>
          {todo.amount && (
            <Text className={styles.amount}>¥ {formatAmountWan(todo.amount)}</Text>
          )}
          <View style={{ flex: 1 }} />
          {onAction && !todo.isDone && (
            <View className={styles.actionBtn} onClick={onAction}>
              <Text>{actionText || '立即处理'}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default TodoCard;
