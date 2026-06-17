import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBillStore } from '@/store/useBillStore';
import { SPLIT_STATUS_LABEL, PAYEE_CATEGORY_LABEL, BILL_TYPE_LABEL } from '@/types';
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
  const [showVoucher, setShowVoucher] = useState(false);

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
    setShowVoucher(true);
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

    {showVoucher && (
      <View className={styles.voucherOverlay} onClick={() => setShowVoucher(false)}>
        <View className={styles.voucherSheet} onClick={(e) => e.stopPropagation()}>
          <View className={styles.voucherHeader}>
            <Text className={styles.voucherTitle}>📄 票据流转凭证</Text>
            <Text className={styles.voucherClose} onClick={() => setShowVoucher(false)}>✕</Text>
          </View>

          <ScrollView scrollY className={styles.voucherScroll}>
            <View className={styles.voucherPaper}>
              <View className={styles.voucherBadge}>供应链票据拆分明细</View>
              <View className={styles.voucherNo}>
                <Text>凭证号</Text>
                <Text className={styles.voucherNoValue}>{split.voucherNo}</Text>
              </View>

              <View className={styles.voucherAmount}>
                <Text className={styles.voucherAmountLabel}>拆分金额</Text>
                <Text className={styles.voucherAmountValue}>¥ {formatAmount(split.amount)}</Text>
              </View>

              <View className={styles.voucherDivider}>
                <View className={styles.voucherDots} />
              </View>

              <View className={styles.voucherSectionTitle}>票据信息</View>
              <View className={styles.voucherTable}>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>票据类型</Text>
                  <Text className={styles.voucherV}>{bill ? BILL_TYPE_LABEL[bill.type] : '-'}</Text>
                </View>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>票据号码</Text>
                  <Text className={styles.voucherV}>{split.billNo}</Text>
                </View>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>出票方（核心企业）</Text>
                  <Text className={styles.voucherV}>{bill?.issuer || '-'}</Text>
                </View>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>票面金额</Text>
                  <Text className={styles.voucherV}>¥ {bill ? formatAmount(bill.amount) : '-'}</Text>
                </View>
                {bill && (
                  <View className={styles.voucherRow}>
                    <Text className={styles.voucherK}>出票日期 / 到期日</Text>
                    <Text className={styles.voucherV}>{bill.issueDate} 至 {bill.dueDate}</Text>
                  </View>
                )}
              </View>

              <View className={styles.voucherDivider}>
                <View className={styles.voucherDots} />
              </View>

              <View className={styles.voucherSectionTitle}>收款方信息</View>
              <View className={styles.voucherTable}>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>收款单位</Text>
                  <Text className={styles.voucherV} style={{ fontWeight: '600' }}>{split.payeeName}</Text>
                </View>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>类别</Text>
                  <Text className={styles.voucherV}>
                    {PAYEE_CATEGORY_LABEL[split.payeeCategory] || split.payeeCategory}
                  </Text>
                </View>
                {payee && payee.bankAccount && (
                  <View className={styles.voucherRow}>
                    <Text className={styles.voucherK}>开户账户</Text>
                    <Text className={styles.voucherV}>{maskBankAccount(payee.bankAccount)}</Text>
                  </View>
                )}
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>背书用途</Text>
                  <Text className={styles.voucherV} style={{ color: '#1677FF' }}>{split.purpose}</Text>
                </View>
              </View>

              <View className={styles.voucherDivider}>
                <View className={styles.voucherDots} />
              </View>

              <View className={styles.voucherSectionTitle}>流转记录</View>
              <View className={styles.voucherTable}>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>创建时间</Text>
                  <Text className={styles.voucherV}>{formatDateTime(split.createdAt)}</Text>
                </View>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>审批时间</Text>
                  <Text className={styles.voucherV}>
                    {split.approvedAt
                      ? `${formatDateTime(split.approvedAt)}（${split.approvedBy || '老板'}）`
                      : '— 等待审批 —'}
                  </Text>
                </View>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>签收时间</Text>
                  <Text className={styles.voucherV}>
                    {split.signedAt
                      ? `${formatDateTime(split.signedAt)}（已完成）`
                      : split.status === 'rejected'
                        ? '— 已驳回 —'
                        : '— 待对方签收 —'}
                  </Text>
                </View>
                <View className={styles.voucherRow}>
                  <Text className={styles.voucherK}>当前状态</Text>
                  <Text
                    className={classnames(styles.voucherV, styles.statusText)}
                    style={{
                      color:
                        split.status === 'signed'
                          ? '#00B96B'
                          : split.status === 'overdue'
                            ? '#F53F3F'
                            : split.status === 'rejected'
                              ? '#86909C'
                              : split.status === 'pending_boss'
                                ? '#FF7D00'
                                : '#1677FF'
                    }}
                  >
                    ● {SPLIT_STATUS_LABEL[split.status]}
                  </Text>
                </View>
              </View>

              {split.urgedCount > 0 && (
                <>
                  <View className={styles.voucherDivider}>
                    <View className={styles.voucherDots} />
                  </View>
                  <View className={styles.voucherSectionTitle}>催办记录（共 {split.urgedCount} 次）</View>
                  <View className={styles.voucherTable}>
                    <View className={styles.voucherRow}>
                      <Text className={styles.voucherK}>催办次数</Text>
                      <Text className={styles.voucherV} style={{ color: '#FF7D00' }}>
                        累计 {split.urgedCount} 次
                      </Text>
                    </View>
                    <View className={styles.voucherRow}>
                      <Text className={styles.voucherK}>最近催办时间</Text>
                      <Text className={styles.voucherV}>
                        {split.lastUrgedAt ? formatDateTime(split.lastUrgedAt) : '-'}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <View className={styles.voucherFooter}>
                <Text>· 本凭证由系统自动生成，可作为内部记账凭证 ·</Text>
              </View>
            </View>
          </ScrollView>

          <View className={styles.voucherActions}>
            <View
              className={styles.btnSecondary}
              onClick={() => setShowVoucher(false)}
            >
              <Text>关闭</Text>
            </View>
            <View
              className={styles.btnPrimary}
              onClick={() =>
                Taro.showToast({ title: '已保存到系统相册', icon: 'success' })
              }
            >
              <Text>保存图片</Text>
            </View>
          </View>
        </View>
      </View>
    )}
    </>
  );
};

export default SplitDetailPage;
