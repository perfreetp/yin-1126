import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBillStore } from '@/store/useBillStore';
import { BillType, BILL_TYPE_LABEL } from '@/types';

const BillScanPage: React.FC = () => {
  const { addBill } = useBillStore();

  const [billNo, setBillNo] = useState('');
  const [amount, setAmount] = useState('');
  const [billType, setBillType] = useState<BillType>('bank_acceptance');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [issuer, setIssuer] = useState('');
  const [payer, setPayer] = useState('');
  const [payee, setPayee] = useState('顺达贸易有限公司');

  const canSubmit = billNo.trim() && parseFloat(amount) > 0 && issueDate && dueDate && issuer.trim();

  const handleScan = () => {
    Taro.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const code = res.result || '';
        setBillNo(code || 'BK' + Date.now().toString());
        Taro.showToast({ title: '扫码成功', icon: 'success' });
        setAmount('500000');
        setBillType('bank_acceptance');
        setIssueDate('2026-06-15');
        setDueDate('2026-12-15');
        setIssuer('示例核心企业有限公司');
        setPayer('示例核心企业有限公司');
      },
      fail: () => {
        Taro.showToast({ title: '扫码取消', icon: 'none' });
      }
    });
  };

  const handleInput = (field: string) => {
    const labelMap: Record<string, string> = {
      billNo: '票据号',
      amount: '票面金额',
      issuer: '出票方',
      payer: '付款方',
      payee: '收款人'
    };
    const title = labelMap[field] || '请输入';
    const contentMap: Record<string, string> = {
      billNo, amount, issuer, payer, payee
    };

    Taro.showModal({
      title: `输入${title}`,
      editable: true,
      placeholderText: `请输入${title}`,
      content: contentMap[field],
      success: (res) => {
        if (res.confirm && res.content !== undefined) {
          switch (field) {
            case 'billNo': setBillNo(res.content); break;
            case 'amount': setAmount(res.content); break;
            case 'issuer': setIssuer(res.content); break;
            case 'payer': setPayer(res.content); break;
            case 'payee': setPayee(res.content); break;
          }
        }
      }
    });
  };

  const handleDateInput = (field: 'issue' | 'due') => {
    Taro.showActionSheet({
      itemList: ['2026-01-15', '2026-03-01', '2026-06-15', '2026-09-01', '2026-12-15'],
      success: (res) => {
        const dates = ['2026-01-15', '2026-03-01', '2026-06-15', '2026-09-01', '2026-12-15'];
        if (field === 'issue') {
          setIssueDate(dates[res.tapIndex]);
        } else {
          setDueDate(dates[res.tapIndex]);
        }
      }
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    addBill({
      billNo: billNo.trim(),
      type: billType,
      amount: parseFloat(amount) || 0,
      issueDate: issueDate,
      dueDate: dueDate,
      issuer: issuer.trim(),
      payer: (payer || issuer).trim(),
      payee: (payee || '顺达贸易有限公司').trim()
    });
    Taro.showToast({ title: '录入成功', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 800);
  };

  const typeOptions = Object.entries(BILL_TYPE_LABEL) as [BillType, string][];

  return (
    <>
    <ScrollView scrollY className={styles.page}>
      <View className={styles.scanArea}>
        <Text className={styles.scanTitle}>扫码快速录入</Text>
        <Text className={styles.scanDesc}>
          将摄像头对准票据上的二维码或条形码{'\n'}
          系统将自动识别并填充票据信息
        </Text>
        <View className={styles.scanBox} onClick={handleScan}>
          <Text className={styles.scanIcon}>📷</Text>
          <Text className={styles.scanText}>点击扫码</Text>
        </View>
        <View className={styles.orDivider}>
          <View className={styles.orLine} />
          <Text className={styles.orText}>或手动填写</Text>
          <View className={styles.orLine} />
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>票据信息</Text>

        <View className={styles.formField}>
          <Text className={styles.fieldLabel}>票据类型</Text>
          <View className={styles.fieldSelectRow}>
            {typeOptions.map(([key, label]) => (
              <View
                key={key}
                className={classnames(styles.selectChip, billType === key && styles.active)}
                onClick={() => setBillType(key)}
              >
                <Text>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formField}>
          <Text className={styles.fieldLabel}>票据号 *</Text>
          <View className={styles.fieldInput} onClick={() => handleInput('billNo')}>
            {billNo ? (
              <Text style={{ fontFamily: 'monospace' }}>{billNo}</Text>
            ) : (
              <Text className={styles.fieldPlaceholder}>请输入票据号</Text>
            )}
          </View>
        </View>

        <View className={styles.formField}>
          <Text className={styles.fieldLabel}>票面金额（元）*</Text>
          <View className={styles.fieldInput} onClick={() => handleInput('amount')}>
            {amount ? (
              <Text style={{ fontWeight: '600', color: '#1D2129' }}>¥ {parseFloat(amount).toLocaleString()}</Text>
            ) : (
              <Text className={styles.fieldPlaceholder}>请输入金额，如 500000</Text>
            )}
          </View>
        </View>

        <View className={styles.formField}>
          <Text className={styles.fieldLabel}>出票日期 *</Text>
          <View className={styles.fieldInput} onClick={() => handleDateInput('issue')}>
            {issueDate ? (
              <Text>{issueDate}</Text>
            ) : (
              <Text className={styles.fieldPlaceholder}>请选择出票日期</Text>
            )}
          </View>
        </View>

        <View className={styles.formField}>
          <Text className={styles.fieldLabel}>到期日期 *</Text>
          <View className={styles.fieldInput} onClick={() => handleDateInput('due')}>
            {dueDate ? (
              <Text>{dueDate}</Text>
            ) : (
              <Text className={styles.fieldPlaceholder}>请选择到期日期</Text>
            )}
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>企业信息</Text>

        <View className={styles.formField}>
          <Text className={styles.fieldLabel}>出票方（核心企业）*</Text>
          <View className={styles.fieldInput} onClick={() => handleInput('issuer')}>
            {issuer ? (
              <Text>{issuer}</Text>
            ) : (
              <Text className={styles.fieldPlaceholder}>请输入出票方公司名称</Text>
            )}
          </View>
        </View>

        <View className={styles.formField}>
          <Text className={styles.fieldLabel}>付款方</Text>
          <View className={styles.fieldInput} onClick={() => handleInput('payer')}>
            {payer ? (
              <Text>{payer}</Text>
            ) : (
              <Text className={styles.fieldPlaceholder}>默认为出票方</Text>
            )}
          </View>
        </View>

        <View className={styles.formField}>
          <Text className={styles.fieldLabel}>收款人（我方）</Text>
          <View className={styles.fieldInput} onClick={() => handleInput('payee')}>
            {payee ? (
              <Text>{payee}</Text>
            ) : (
              <Text className={styles.fieldPlaceholder}>请输入收款方公司名称</Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>

    <View className={styles.bottomBar}>
      <View className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>
        <Text>取消</Text>
      </View>
      <View
        className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
        onClick={handleSubmit}
      >
        <Text>保存票据</Text>
      </View>
    </View>
    </>
  );
};

export default BillScanPage;
