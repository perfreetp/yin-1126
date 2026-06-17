import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBillStore } from '@/store/useBillStore';
import TodoCard from '@/components/TodoCard';
import EmptyState from '@/components/EmptyState';
import { TODO_TYPE_LABEL, TodoType } from '@/types';

type FilterTab = 'all' | TodoType | 'done';

const TodosPage: React.FC = () => {
  const { todos, splitRecords, approveSplit, urgeSplit, signSplit, rejectSplit } = useBillStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'boss_approval', label: '待审批' },
    { key: 'sign_confirm', label: '待签收' },
    { key: 'overdue_urge', label: '逾期' },
    { key: 'mature_remind', label: '到期' }
  ];

  const counts = useMemo(() => {
    return {
      all: todos.filter((t) => !t.isDone).length,
      boss_approval: todos.filter((t) => !t.isDone && t.type === 'boss_approval').length,
      sign_confirm: todos.filter((t) => !t.isDone && t.type === 'sign_confirm').length,
      overdue_urge: todos.filter((t) => !t.isDone && t.type === 'overdue_urge').length,
      mature_remind: todos.filter((t) => !t.isDone && t.type === 'mature_remind').length,
      done: todos.filter((t) => t.isDone).length
    };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    return todos
      .filter((t) => {
        if (activeTab === 'all') return !t.isDone;
        if (activeTab === 'done') return t.isDone;
        return t.type === activeTab && !t.isDone;
      })
      .sort((a, b) => {
        const priorityWeight = { high: 0, medium: 1, low: 2 };
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
          return priorityWeight[a.priority] - priorityWeight[b.priority];
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [todos, activeTab]);

  const pendingApprovalCount = todos.filter((t) => !t.isDone && t.type === 'boss_approval').length;
  const pendingSignCount = todos.filter((t) => !t.isDone && t.type === 'sign_confirm').length;
  const overdueCount = todos.filter((t) => !t.isDone && t.type === 'overdue_urge').length;
  const matureCount = todos.filter((t) => !t.isDone && t.type === 'mature_remind').length;

  const handleAction = (todo: typeof todos[0]) => {
    const split = splitRecords.find((s) => s.id === todo.relatedId);

    switch (todo.type) {
      case 'boss_approval': {
        if (!split) return;
        Taro.showActionSheet({
          itemList: ['批准通过', '驳回'],
          success: (res) => {
            if (res.tapIndex === 0) {
              approveSplit(split.id);
              Taro.showToast({ title: '已批准', icon: 'success' });
            } else if (res.tapIndex === 1) {
              Taro.showModal({
                title: '驳回原因',
                editable: true,
                placeholderText: '请输入驳回原因',
                success: (r) => {
                  if (r.confirm && r.content) {
                    rejectSplit(split.id, r.content);
                    Taro.showToast({ title: '已驳回', icon: 'none' });
                  }
                }
              });
            }
          }
        });
        break;
      }
      case 'sign_confirm':
      case 'overdue_urge': {
        if (!split) return;
        Taro.showActionSheet({
          itemList: ['发送催办', '查看详情', '标记已签收'],
          success: (res) => {
            if (res.tapIndex === 0) {
              urgeSplit(split.id);
              Taro.showToast({ title: '催办已发送', icon: 'success' });
            } else if (res.tapIndex === 1) {
              Taro.navigateTo({ url: `/pages/split-detail/index?id=${split.id}` });
            } else if (res.tapIndex === 2) {
              signSplit(split.id);
              Taro.showToast({ title: '已签收', icon: 'success' });
            }
          }
        });
        break;
      }
      case 'mature_remind': {
        Taro.navigateTo({ url: `/pages/bill-detail/index?id=${todo.relatedId}` });
        break;
      }
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'boss_approval':
        return '立即处理';
      case 'sign_confirm':
      case 'overdue_urge':
        return '催办/处理';
      default:
        return '查看详情';
    }
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.filterBar}>
        <ScrollView scrollX className={styles.tabRow}>
          {tabs.map((tab) => {
            const count = tab.key === 'all' ? counts.all : counts[tab.key as TodoType] || 0;
            return (
              <View
                key={tab.key}
                className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
                onClick={() => setActiveTab(tab.key)}
              >
                <Text>{tab.label}</Text>
                {count > 0 && <View className={styles.tabBadge}>{count > 99 ? '99+' : count}</View>}
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View className={styles.statRow}>
        <View className={styles.statBox}>
          <Text className={classnames(styles.statNum)} style={{ color: '#FF7D00' }}>
            {pendingApprovalCount}
          </Text>
          <Text className={styles.statLabel}>待审批</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={styles.statNum} style={{ color: '#1677FF' }}>
            {pendingSignCount}
          </Text>
          <Text className={styles.statLabel}>待签收</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={styles.statNum} style={{ color: '#F53F3F' }}>
            {overdueCount}
          </Text>
          <Text className={styles.statLabel}>逾期</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={styles.statNum} style={{ color: '#00B96B' }}>
            {matureCount}
          </Text>
          <Text className={styles.statLabel}>到期</Text>
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.paddingPage}>
          {filteredTodos.length > 0 ? (
            <View className={styles.todoList}>
              {filteredTodos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  actionText={getActionText(todo.type)}
                  onAction={() => handleAction(todo)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title={activeTab === 'done' ? '暂无已完成待办' : '暂无待办事项'}
              description={activeTab === 'done' ? '处理过的事项会出现在这里' : '所有事项都处理完啦 🎉'}
              icon={activeTab === 'done' ? '✅' : '📋'}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default TodosPage;
