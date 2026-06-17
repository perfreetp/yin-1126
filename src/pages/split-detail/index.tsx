import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBillStore } from '@/store/useBillStore';
import { SPLIT_STATUS_LABEL } from '@/types';
import {
  formatAmount,
  formatDateTime,
  formatAmountWan,
  maskBillNo,
  maskBankAccount
} from '@/utils/format';

interface TimelineStep {
  status: 'done' | 'pending' | 'current' | 'error';
  title: string;
  time?: string;
  desc?: string;
}

const SplitDetailPage: React.FC = () => {
  const router = useRouter();
  const splitId = router.params.id as string;
  const { splitRecords, payees, bills, approveSplit, urgeSplit, signSplit, rejectSplit } = useBillStore();

  const split = useMemo(() => splitRecords.find((s) => s.id === splitId), [splitId, splitRecords]);
  const payee = useMemo(() => payees.find((p) => p.id === split?.payeeId), [split, payees]);
  const bill = useMemo(() => bills.find((b) => b.id === split?.billId), [split, bills]);

  if (!split) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '64rpx 32rpx' }}>
          <View style={{ textAlign: 'center', color: '#86909C' }}>
            <Text style={{ fontSize: '64rpx' }}>❌</Text>
            <Text style={{ display: 'block', marginTop: '16rpx', fontSize: '28rpx' }}>拆分记录不存在</Text>
          </View>
        </View>
      </View>
    );
  }

  const getStatusClass = () => {
    switch (split.status) {
      case 'signed':
        return styles.statusSigned;
      case 'pending_boss':
      case 'rejected':
        return split.status === 'rejected' ? styles.statusRejected : styles.statusPending;
      case 'pending_sign':
        return styles.statusSign;
      case 'overdue':
        return styles.statusOverdue;
      default:
        return styles.statusSign;
    }
  };

  const getTimeline = (): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        status: 'done',
        title: '创建拆分单',
        time: formatDateTime(split.createdAt),
        desc: `票据号 ${maskBillNo(split.billNo)}`
      }
    ];

    if (split.status === 'rejected') {
      steps.push({
        status: 'error',
        title: '老板驳回',
        time: split.rejectedAt ? formatDateTime(split.rejectedAt) : undefined,
        desc: split.rejectReason || '暂无驳回原因'
      });
      return steps;
    }

    if (split.status === 'pending_boss') {
      steps.push({
        status: 'current',
        title: '等待老板确认',
        desc: '请联系老板完成审批'
      });
      return steps;
    }

    steps.push({
      status: 'done',
      title: '老板已批准',
      time: split.approvedAt ? formatDateTime(split.approvedAt) : undefined,
      desc: split.approvedBy ? `批准人：${split.approvedBy}` : undefined
    });

    if (split.status === 'signed') {
      steps.push({
        status: 'done',
        title: '对方已签收',
        time: split.signedAt ? formatDateTime(split.signedAt) : undefined,
        desc: '签收完成，可生成流转凭证'
      });
    } else if (split.status === 'overdue') {
      steps.push({
        status: 'error',
        title: '对方逾期未签',
        desc: `已催办 ${split.urgedCount} 次${split.lastUrgedAt ? `，最近 ${formatDateTime(split.lastUrgedAt)}` : ''}，建议电话联系`
      });
    } else {
      steps.push({
        status: 'current',
        title: '等待对方签收',
        desc: split.urgedCount > 0 ? `已催办 ${split.urgedCount} 次` : '通知对方完成签收'
      });
    }

    return steps;
  };

  const timeline = getTimeline();

  const handleVoucher = () => {
    Taro.showModal({
      title: '简版流转凭证',
      content:
        `凭证号：${split.voucherNo}\n` +
        `票据号：${split.billNo}\n` +
        `收款方：${split.payeeName}\n` +
        `金  额：¥${formatAmount(split.amount)}\n` +
        `用  途：${split.purpose}\n` +
        `批  准：${split.approvedAt ? formatDateTime(split.approvedAt) : '待批准'}\n` +
        `签  收：${split.signedAt ? formatDateTime(split.signedAt) : '待签收'}\n\n` +
        '凭证已生成，可前往文件查看',
      showCancel: false,
      confirmText: '我知道了'
    });
  };

  const renderBottomBar = () => {
    switch (split.status) {
      case 'pending_boss':
        return (
          <View className={styles.bottomBar}>
            <View
              className={styles.btnSecondary}
              onClick={() => {
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
              }}
            >
              <Text>驳回</Text>
            </View>
            <View
              className={styles.btnPrimary}
              onClick={() => {
                approveSplit(split.id);
                Taro.showToast({ title: '已批准', icon: 'success' });
              }}
            >
              <Text>批准通过</Text>
            </View>
          </View>
        );
      case 'pending_sign':
      case 'overdue':
        return (
          <View className={styles.bottomBar}>
            <View className={styles.btnSecondary} onClick={handleVoucher}>
              <Text>查看凭证</Text>
            </View>
            <View
              className={styles.btnSecondary}
              onClick={() => {
                urgeSplit(split.id);
                Taro.showToast({ title: '催办已发送', icon: 'success' });
              }}
            >
              <Text>发送催办</Text>
            </View>
            <View
              className={styles.btnPrimary}
              onClick={() => {
                Taro.showModal({
                  title: '确认收款',
                  content: '确认该笔拆分已完成对方签收？',
                  success: (res) => {
                    if (res.confirm) {
                      signSplit(split.id);
                      Taro.showToast({ title: '已确认签收', icon: 'success' });
                    }
                  }
                });
              }}
            >
              <Text>确认收款</Text>
            </View>
          </View>
        );
      case 'signed':
        return (
          <View className={styles.bottomBar}>
            <View className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => Taro.navigateBack()}>
              <Text>返回</Text>
            </View>
            <View className={styles.btnPrimary} style={{ flex: 2 }} onClick={handleVoucher}>
              <Text>生成流转凭证</Text>
            </View>
          </View>
        );
      case 'rejected':
        return (
          <View className={styles.bottomBar}>
            <View className={styles.btnPrimary} style={{ flex: 1 }} onClick={() => Taro.navigateBack()}>
              <Text>返回</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
    <ScrollView scrollY className={styles.page}>
      <View className={classnames(styles.statusHeader, getStatusClass())}>
        <View className={styles.statusBadge}>
          <Text>{SPLIT_STATUS_LABEL[split.status]}</Text>
        </View>
        <Text className={styles.amountLabel}>拆分金额</Text>
        <Text className={styles.amountValue}>¥ {formatAmount(split.amount)}</Text>
        <View className={styles.purposeText}>
          <Text>📌 {split.purpose}</Text>
        </View>
      </View>

      <View className={styles.metaGrid}>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>凭证号</Text>
          <Text className={styles.metaValue} style={{ fontFamily: 'monospace' }}>{split.voucherNo}</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>创建时间</Text>
          <Text className={styles.metaValue}>{formatDateTime(split.createdAt)}</Text>
        </View>
        {split.urgedCount > 0 && (
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>催办次数</Text>
            <Text className={styles.metaValue} style={{ color: '#FF7D00' }}>{split.urgedCount} 次</Text>
          </View>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>收款方信息</Text>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>公司名称</Text>
          <Text className={styles.detailValue} style={{ fontFamily: 'inherit', fontWeight: '500' }}>
            {split.payeeName}
          </Text>
        </View>
        {payee && (
          <>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>联系人</Text>
              <Text className={styles.detailValue} style={{ fontFamily: 'inherit' }}>
                {payee.contactName} · {payee.contactPhone}
              </Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>开户行</Text>
              <Text className={styles.detailValue} style={{ fontFamily: 'inherit' }}>
                {payee.bankName}
              </Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>银行账号</Text>
              <Text className={styles.detailValue}>
                {maskBankAccount(payee.bankAccount)}
              </Text>
            </View>
          </>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>关联票据</Text>
        <View
          className={styles.detailRow}
          onClick={() => bill && Taro.navigateTo({ url: `/pages/bill-detail/index?id=${bill.id}` })}
          style={{ cursor: 'pointer' }}
        >
          <Text className={styles.detailLabel}>票据号</Text>
          <Text className={styles.detailValue} style={{ color: '#1677FF' }}>
            {maskBillNo(split.billNo)} →
          </Text>
        </View>
        {bill && (
          <>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>出票方</Text>
              <Text className={styles.detailValue} style={{ fontFamily: 'inherit' }}>
                {bill.issuer}
              </Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>票面金额</Text>
              <Text className={styles.detailValue}>
                ¥{formatAmountWan(bill.amount)}
              </Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>可拆余额</Text>
              <Text className={styles.detailValue} style={{ color: '#1677FF', fontWeight: '600' }}>
                ¥{formatAmountWan(bill.remainingAmount)}
              </Text>
            </View>
          </>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>流转进度</Text>
        <View className={styles.timeline}>
          {timeline.map((step, i) => (
            <View key={i} className={styles.timelineItem}>
              <View className={classnames(styles.timelineDot, styles[step.status])} />
              <View className={styles.timelineLine} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>{step.title}</Text>
                {step.time && <Text className={styles.timelineTime}>{step.time}</Text>}
                {step.desc && <Text className={styles.timelineDesc}>{step.desc}</Text>}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
    {renderBottomBar()}
    </>
  );
};

export default SplitDetailPage;
