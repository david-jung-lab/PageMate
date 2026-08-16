import React, { useState } from 'react';
import { TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import PMIcon from './ui/PMIcon';
import ReportSheet from './ReportSheet';
import { safetyApi } from '../features/safety/api';
import { ReportTargetType } from '../features/safety/types';

interface Props {
  /** 신고 대상 */
  targetType: ReportTargetType;
  targetId: number;
  targetLabel?: string;
  /** 차단 대상 사용자. 지정하지 않으면 차단 메뉴를 노출하지 않는다 */
  blockUserId?: number;
  blockUserName?: string;
  onBlocked?: () => void;
  color?: string;
  size?: number;
}

/**
 * "..." 메뉴 버튼. 신고·차단 액션을 한곳에 모아 프로필·도서 상세·채팅방에서 재사용한다.
 * (App Store 심사 지침 1.2 — UGC 신고 및 사용자 차단 수단)
 */
const SafetyMenuButton: React.FC<Props> = ({
  targetType, targetId, targetLabel,
  blockUserId, blockUserName, onBlocked,
  color = colors.text, size = 22,
}) => {
  const [reportVisible, setReportVisible] = useState(false);

  const confirmBlock = () => {
    if (!blockUserId) return;
    const name = blockUserName ?? '이 사용자';
    Alert.alert(
      `${name}님을 차단할까요?`,
      '차단하면 서로의 프로필과 등록한 책이 보이지 않고, 새로운 대화나 대여 요청을 주고받을 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await safetyApi.blockUser(blockUserId);
              onBlocked?.();
              Alert.alert('차단했습니다', `${name}님의 콘텐츠가 더 이상 표시되지 않습니다.`);
            } catch {
              Alert.alert('차단 실패', '잠시 후 다시 시도해주세요.');
            }
          },
        },
      ],
    );
  };

  const openMenu = () => {
    const options: Parameters<typeof Alert.alert>[2] = [
      { text: '신고하기', onPress: () => setReportVisible(true) },
    ];
    if (blockUserId) {
      options.push({ text: '차단하기', style: 'destructive', onPress: confirmBlock });
    }
    options.push({ text: '취소', style: 'cancel' });

    Alert.alert(targetLabel ?? '메뉴', undefined, options);
  };

  return (
    <>
      <TouchableOpacity onPress={openMenu} activeOpacity={0.7} style={styles.btn} hitSlop={8}>
        <PMIcon name="more" size={size} color={color} />
      </TouchableOpacity>

      <ReportSheet
        visible={reportVisible}
        targetType={targetType}
        targetId={targetId}
        targetLabel={targetLabel}
        onClose={() => setReportVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});

export default SafetyMenuButton;
