import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBillStore } from '@/store/useBillStore';
import BillCard from '@/components/BillCard';
import PayeeItem from '@/components/PayeeItem';
import EmptyState from '@/components/EmptyState';
import { Bill, Payee, BILL_STATUS_LABEL } from '@/types';
import { formatAmount, formatAmountWan, maskBillNo } from '@/utils/format';

const QUICK_PURPOSES = [
  '原料采购款',
  '物流运输费',
  '加工服务费',
  '包装材料费',
  '货款结算',
  '预付款'
];

const SplitPage: React.FC = () => {
  const { bills, payees, createSplit, toggleFavorite } = useBillStore();

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [showBillPicker, setShowBillPicker] = useState(false);

  const splittableBills = useMemo(
    () => bills.filter((b) => b.remainingAmount > 0 && b.status !== 'expired'),
    [bills]
  );

  const favoritePayees = useMemo(() => payees.filter((p) => p.isFavorite), [payees]);

  const maxAmount = selectedBill?.remainingAmount || 0;
  const amountNum = parseFloat(amount) || 0;
  const isExceed = amountNum > maxAmount;
  const canSubmit =
    selectedBill && selectedPayee && amountNum > 0 && !isExceed && purpose.trim().length > 0;

  const quickPercentages = [25, 50, 75, 100];

  const handleSelectBill = () => {
    if (splittableBills.length === 0) {
      Taro.showToast({ title: '暂无可拆分票据', icon: 'none' });
      return;
    }
    setShowBillPicker(true);
  };

  const confirmBill = (bill: Bill) => {
    setSelectedBill(bill);
    setAmount('');
    setShowBillPicker(false);
  };

  const handleQuickAmount = (percent: number) => {
    if (!selectedBill) return;
    const val = Math.floor((selectedBill.remainingAmount * percent) / 100);
    setAmount(val.toString());
  };

  const handleNumKey = (key: string) => {
    if (key === 'DEL') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => (prev ? prev + '.' : '0.'));
      }
    } else {
      if (amount === '0' && key !== '.') {
        setAmount(key);
      } else {
        const parts = (amount + key).split('.');
        if (parts[1] && parts[1].length > 2) return;
        setAmount(amount + key);
      }
    }
  };

  const handleClearAmount = () => setAmount('');

  const handlePurposeChip = (text: string) => {
    setPurpose((prev) => (prev ? prev + '，' + text : text));
  };

  const handlePurposeInput = () => {
    Taro.showModal({
      title: '填写背书用途',
      editable: true,
      placeholderText: '请输入用途说明',
      content: purpose,
      success: (res) => {
        if (res.confirm && res.content !== undefined) {
          setPurpose(res.content);
        }
      }
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || !selectedBill || !selectedPayee) return;
    const result = createSplit({
      billId: selectedBill.id,
      amount: amountNum,
      purpose: purpose.trim(),
      payeeId: selectedPayee.id
    });
    if (result) {
      Taro.showToast({ title: '已提交审批', icon: 'success' });
      setTimeout(() => {
        setSelectedBill(null);
        setSelectedPayee(null);
        setAmount('');
        setPurpose('');
        Taro.switchTab({ url: '/pages/todos/index' });
      }, 800);
    } else {
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  };

  return (
    <>
    <ScrollView scrollY className={styles.page}>
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <View className={styles.stepBadge}>1</View>
          选择票据
        </Text>

        {selectedBill ? (
          <View className={classnames(styles.selectBillRow, styles.selected)} onClick={handleSelectBill}>
            <View className={styles.billInfo}>
              <View className={styles.billAmountRow}>
                <Text className={styles.billAmount}>¥ {formatAmount(selectedBill.amount)}</Text>
                <View className={styles.remainingBadge}>
                  可拆 ¥{formatAmountWan(selectedBill.remainingAmount)}
                </View>
              </View>
              <View className={styles.billMeta}>
                <Text>{selectedBill.issuer}</Text>
                <Text>已拆 {selectedBill.splitCount} 次</Text>
              </View>
            </View>
            <Text style={{ color: '#1677FF', fontSize: '28rpx' }}>更换</Text>
          </View>
        ) : (
          <View className={styles.selectBillRow} onClick={handleSelectBill}>
            <View className={styles.noSelection}>
              <Text className={styles.noSelectionIcon}>📄</Text>
              <Text className={styles.noSelectionText}>点击选择要拆分的票据</Text>
              <Text style={{ fontSize: '22rpx', color: '#86909C', marginTop: '8rpx' }}>
                共 {splittableBills.length} 张可拆分
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <View className={styles.stepBadge}>2</View>
          填写拆分金额
        </Text>

        {!selectedBill ? (
          <View style={{ padding: '32rpx 0', textAlign: 'center', color: '#86909C', fontSize: '26rpx' }}>
            请先选择票据
          </View>
        ) : (
          <>
            <View className={styles.quickAmounts}>
              {quickPercentages.map((p) => (
                <View
                  key={p}
                  className={classnames(
                    styles.quickAmountBtn,
                    p === 100 &&
                      Math.abs(amountNum - (selectedBill.remainingAmount * p) / 100) < 1 &&
                      styles.active
                  )}
                  onClick={() => handleQuickAmount(p)}
                >
                  {p}%
                </View>
              ))}
            </View>

            <View className={styles.inputField}>
              <Text className={styles.inputPrefix}>¥</Text>
              {amount ? (
                <Text className={styles.inputValue}>{formatAmount(amountNum)}</Text>
              ) : (
                <Text className={classnames(styles.inputValue, styles.placeholderValue)}>
                  请输入拆分金额
                </Text>
              )}
              {amount && (
                <View className={styles.inputClear} onClick={handleClearAmount}>
                  <Text>✕</Text>
                </View>
              )}
            </View>

            <View className={styles.amountHint}>
              <Text>
                最大可拆 ¥{formatAmount(selectedBill.remainingAmount)}
              </Text>
              <Text className={isExceed ? styles.exceedText : ''}>
                {isExceed ? '⚠️ 超出可拆余额' : `剩余 ¥${formatAmount(Math.max(0, selectedBill.remainingAmount - amountNum))}`}
              </Text>
            </View>

            <View className={styles.numPad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((key) => (
                <View
                  key={key}
                  className={classnames(styles.numKey, key === 'DEL' && styles.numKeyDel)}
                  onClick={() => handleNumKey(key)}
                >
                  {key === 'DEL' ? '⌫' : key}
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <View className={styles.stepBadge}>3</View>
          选择收款方
        </Text>

        {favoritePayees.length > 0 && (
          <>
            <Text className={styles.sectionSubtitle}>常用收款方</Text>
            <View className={styles.favoritePayees}>
              {favoritePayees.map((payee) => (
                <PayeeItem
                  key={payee.id}
                  payee={payee}
                  selected={selectedPayee?.id === payee.id}
                  showFavorite={false}
                  onClick={() => setSelectedPayee(payee)}
                />
              ))}
            </View>
          </>
        )}

        {!selectedPayee && favoritePayees.length > 0 && payees.length > favoritePayees.length && (
          <View style={{ marginTop: '24rpx' }}>
            <Text className={styles.sectionSubtitle}>更多收款方</Text>
            <View className={styles.favoritePayees}>
              {payees
                .filter((p) => !p.isFavorite)
                .slice(0, 3)
                .map((payee) => (
                  <PayeeItem
                    key={payee.id}
                    payee={payee}
                    selected={selectedPayee?.id === payee.id}
                    showFavorite={false}
                    onClick={() => setSelectedPayee(payee)}
                  />
                ))}
            </View>
          </View>
        )}

        <View
          className={styles.addPayeeBtn}
          style={{ marginTop: favoritePayees.length > 0 ? '24rpx' : 0 }}
          onClick={() => Taro.navigateTo({ url: '/pages/payees/index' })}
        >
          <Text>＋</Text>
          <Text>管理/新增收款方</Text>
        </View>

        {selectedPayee && (
          <View style={{ marginTop: '24rpx' }}>
            <PayeeItem
              payee={selectedPayee}
              selected
              showFavorite={false}
              onClick={() => setSelectedPayee(null)}
            />
          </View>
        )}
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <View className={styles.stepBadge}>4</View>
          填写背书用途
        </Text>

        <View className={styles.purposeInput} onClick={handlePurposeInput}>
          {purpose ? (
            <Text className={styles.textAreaValue}>{purpose}</Text>
          ) : (
            <Text style={{ color: '#C9CDD4', fontSize: '26rpx' }}>点击填写用途说明（如：6月原料采购款）</Text>
          )}
        </View>

        <View className={styles.quickPurposes}>
          {QUICK_PURPOSES.map((p) => (
            <View key={p} className={styles.purposeChip} onClick={() => handlePurposeChip(p)}>
              <Text>+ {p}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: '40rpx' }} />
    </ScrollView>

    <View className={styles.bottomBar}>
      <View className={styles.summaryRow}>
        <Text className={styles.summaryLabel}>本次拆分金额</Text>
        <Text className={styles.summaryAmount}>¥ {amount ? formatAmount(amountNum) : '0.00'}</Text>
      </View>
      <View
        className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
        onClick={handleSubmit}
      >
        <Text>{canSubmit ? '提交老板确认' : '请完成以上步骤'}</Text>
      </View>
    </View>

    {showBillPicker && (
      <View className={styles.billSelectorSheet}>
        <View className={styles.sheetHeader}>
          <Text className={styles.sheetTitle}>选择票据</Text>
          <Text className={styles.sheetClose} onClick={() => setShowBillPicker(false)}>✕</Text>
        </View>
        <View className={styles.sheetContent}>
          <View className={styles.sheetBillList}>
            {splittableBills.length === 0 ? (
              <EmptyState text="暂无可拆分票据" />
            ) : (
              splittableBills.map((bill) => (
                <View
                  key={bill.id}
                  onClick={() => confirmBill(bill)}
                  style={{
                    border: selectedBill?.id === bill.id ? '2rpx solid #1677FF' : '2rpx solid transparent',
                    borderRadius: '16rpx',
                    overflow: 'hidden'
                  }}
                >
                  <BillCard bill={bill} compact />
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    )}
    </>
  );
};

export default SplitPage;
