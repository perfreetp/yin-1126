import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useBillStore } from '@/store/useBillStore';
import StatCard from '@/components/StatCard';
import QuickAction from '@/components/QuickAction';
import BillCard from '@/components/BillCard';
import TodoCard from '@/components/TodoCard';
import EmptyState from '@/components/EmptyState';
import { formatAmountWan } from '@/utils/format';
import dayjs from 'dayjs';

const DashboardPage: React.FC = () => {
  const { bills, todos, splitRecords, getDashboardStats, approveSplit, urgeSplit, signSplit } = useBillStore();

  const stats = getDashboardStats();

  const pendingTodoCount = todos.filter((t) => !t.isDone).length;

  const recentBills = useMemo(() => {
    return [...bills]
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      .slice(0, 3);
  }, [bills]);

  const pendingTodos = useMemo(() => {
    return [...todos]
      .filter((t) => !t.isDone)
      .sort((a, b) => {
        const priorityWeight = { high: 0, medium: 1, low: 2 };
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      })
      .slice(0, 3);
  }, [todos]);

  const handleTodoAction = (todo: typeof todos[0]) => {
    const split = splitRecords.find((s) => s.id === todo.relatedId);
    if (!split) {
      if (todo.type === 'mature_remind') {
        const bill = bills.find((b) => b.id === todo.relatedId);
        if (bill) {
          Taro.navigateTo({ url: `/pages/bill-detail/index?id=${bill.id}` });
        }
      }
      return;
    }

    switch (todo.type) {
      case 'boss_approval':
        approveSplit(split.id);
        Taro.showToast({ title: '已批准', icon: 'success' });
        break;
      case 'sign_confirm':
        urgeSplit(split.id);
        Taro.showToast({ title: '催办已发送', icon: 'success' });
        break;
      case 'overdue_urge':
        urgeSplit(split.id);
        Taro.showToast({ title: '催办已发送', icon: 'success' });
        break;
      default:
        Taro.navigateTo({ url: `/pages/split-detail/index?id=${split.id}` });
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'boss_approval':
        return '立即批准';
      case 'sign_confirm':
      case 'overdue_urge':
        return '发送催办';
      default:
        return '查看详情';
    }
  };

  const quickActions = [
    { key: 'scan', icon: '📷', label: '扫码录票', url: '/pages/bill-scan/index', color: 'primary' as const },
    { key: 'split', icon: '✂️', label: '拆分转付', url: '/pages/split/index', color: 'success' as const },
    { key: 'payee', icon: '👥', label: '收款方', url: '/pages/payees/index', color: 'warning' as const },
    { key: 'todos', icon: '📋', label: '待办事项', url: '/pages/todos/index', color: 'error' as const }
  ];

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>李</Text>
          </View>
          <View className={styles.greeting}>
            <Text className={styles.greetingText}>下午好</Text>
            <Text className={styles.userName}>李总</Text>
            <Text className={styles.companyName}>顺达贸易有限公司</Text>
          </View>
        </View>
        <View
          className={styles.todoBadge}
          onClick={() => Taro.switchTab({ url: '/pages/todos/index' })}
        >
          <Text>🔔</Text>
          {pendingTodoCount > 0 && (
            <View className={styles.badgeDot}>
              <Text>{pendingTodoCount > 99 ? '99+' : pendingTodoCount}</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.statsSection}>
        <View className={styles.statsGrid}>
          <View className={styles.highlightCard}>
            <StatCard
              label="总可拆余额"
              value={`¥ ${formatAmountWan(stats.remainingAmount)}`}
              highlight
              trend="up"
              trendValue="较上月 +12.5%"
            />
          </View>
        </View>
        <View className={styles.smallStats}>
          <StatCard
            label="持有票据"
            value={bills.length}
            unit="张"
            color="primary"
          />
          <StatCard
            label="票面总值"
            value={formatAmountWan(stats.totalBillAmount)}
            unit="元"
            color="success"
          />
          <StatCard
            label="本月拆分"
            value={formatAmountWan(stats.monthlySplitAmount)}
            unit="元"
            color="warning"
          />
        </View>
      </View>

      <View className={styles.quickSection}>
        <QuickAction actions={quickActions} columns={4} />
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>我的票据</Text>
        <View
          className={styles.moreLink}
          onClick={() => Taro.switchTab({ url: '/pages/bills/index' })}
        >
          <Text>查看全部</Text>
          <Text>→</Text>
        </View>
      </View>
      <View className={styles.billsSection}>
        <View className={styles.paddingPage}>
          {recentBills.length > 0 ? (
            <View className={styles.billList}>
              {recentBills.map((bill) => (
                <BillCard key={bill.id} bill={bill} />
              ))}
            </View>
          ) : (
            <EmptyState
              title="暂无票据"
              description="点击上方「扫码录票」录入第一张票据"
              icon="📄"
            />
          )}
        </View>
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>待办提醒</Text>
        <View
          className={styles.moreLink}
          onClick={() => Taro.switchTab({ url: '/pages/todos/index' })}
        >
          <Text>全部待办</Text>
          <Text>→</Text>
        </View>
      </View>
      <View className={styles.todoSection}>
        <View className={styles.paddingPage}>
          {pendingTodos.length > 0 ? (
            <View className={styles.todoList}>
              {pendingTodos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  actionText={getActionText(todo.type)}
                  onAction={() => handleTodoAction(todo)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="暂无待办"
              description="所有事项都处理完啦，真棒！"
              icon="🎉"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default DashboardPage;
