import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useParentLink } from '@/hooks/useParentLink';

type Mode = 'select' | 'invite' | 'enter';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function InviteParentModal({ visible, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('select');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { generateInviteCode, acceptInviteCode } = useParentLink();

  const reset = () => { setMode('select'); setInviteCode(null); setInputCode(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleGenerateCode = async () => {
    setIsLoading(true);
    const code = await generateInviteCode();
    setIsLoading(false);
    if (code) {
      setInviteCode(code);
    } else {
      Alert.alert('エラー', '招待コードの生成に失敗しました');
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `【Abro】親子連携の招待コードです\n\nコード: ${inviteCode}\n\nAbro アプリを開いて「招待コードを入力」からこのコードを入力してください。`,
      title: 'Abro 招待コード',
    });
  };

  const handleAcceptCode = async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert('コードを入力してください');
      return;
    }
    setIsLoading(true);
    const result = await acceptInviteCode(code);
    setIsLoading(false);

    if (result === 'ok') {
      Alert.alert('連携完了！', '子どものプランを閲覧できるようになりました。', [
        { text: 'OK', onPress: handleClose },
      ]);
    } else if (result === 'not_found') {
      Alert.alert('コードが見つかりません', '正しいコードを入力してください。\nコードは大文字・小文字を区別しません。');
    } else {
      Alert.alert('エラー', 'もう一度お試しください');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* ヘッダー */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable
            onPress={mode === 'select' ? handleClose : () => { setMode('select'); setInviteCode(null); }}
            accessibilityLabel="戻る"
          >
            <Text className="text-muted text-sm">{mode === 'select' ? 'キャンセル' : '←'}</Text>
          </Pressable>
          <Text className="font-semibold text-primary text-sm">👨‍👩‍👧 親子連携</Text>
          <View className="w-16" />
        </View>

        <View className="flex-1 px-6 py-8 gap-5">

          {/* 方法選択 */}
          {mode === 'select' && (
            <>
              <Text className="text-muted text-sm text-center">どちらですか？</Text>

              <Pressable
                className="bg-white border border-border rounded-2xl p-5 gap-2 active:opacity-70"
                onPress={() => setMode('invite')}
                accessibilityLabel="親を招待する(子側)"
              >
                <Text className="text-2xl">👦</Text>
                <Text className="text-primary font-semibold text-base">親を招待する</Text>
                <Text className="text-muted text-sm">招待コードを生成して親に送ります</Text>
              </Pressable>

              <Pressable
                className="bg-white border border-border rounded-2xl p-5 gap-2 active:opacity-70"
                onPress={() => setMode('enter')}
                accessibilityLabel="招待コードを入力する(親側)"
              >
                <Text className="text-2xl">👨</Text>
                <Text className="text-primary font-semibold text-base">招待コードを入力する</Text>
                <Text className="text-muted text-sm">子どもから受け取ったコードを入力します</Text>
              </Pressable>
            </>
          )}

          {/* 招待コード生成(子側) */}
          {mode === 'invite' && (
            <View className="gap-5">
              <View className="gap-1">
                <Text className="text-xl font-bold text-primary">親に招待コードを送る</Text>
                <Text className="text-muted text-sm">
                  コードを生成して LINE や SMS で送ってください。
                  親が Abro に登録してコードを入力すると連携完了です。
                </Text>
              </View>

              {!inviteCode ? (
                <Pressable
                  className="bg-primary rounded-xl py-4 items-center active:opacity-80"
                  onPress={handleGenerateCode}
                  disabled={isLoading}
                  accessibilityLabel="招待コードを生成する"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">招待コードを生成する</Text>
                  )}
                </Pressable>
              ) : (
                <View className="gap-4">
                  {/* コード表示 */}
                  <View className="bg-primary/10 rounded-2xl p-6 items-center gap-2">
                    <Text className="text-muted text-xs">招待コード</Text>
                    <Text className="text-4xl font-bold text-primary tracking-widest">{inviteCode}</Text>
                    <Text className="text-muted text-xs">このコードを親に伝えてください</Text>
                  </View>

                  <Pressable
                    className="bg-primary rounded-xl py-4 items-center active:opacity-80"
                    onPress={handleShare}
                    accessibilityLabel="LINEで送る"
                  >
                    <Text className="text-white font-semibold">📤 LINE・メッセージで送る</Text>
                  </Pressable>

                  <Pressable
                    className="border border-border rounded-xl py-3 items-center active:opacity-70"
                    onPress={handleGenerateCode}
                    accessibilityLabel="コードを再生成する"
                  >
                    <Text className="text-muted text-sm">コードを再生成する</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* コード入力(親側) */}
          {mode === 'enter' && (
            <View className="gap-5">
              <View className="gap-1">
                <Text className="text-xl font-bold text-primary">招待コードを入力</Text>
                <Text className="text-muted text-sm">
                  子どもから受け取った6文字のコードを入力してください。
                </Text>
              </View>

              <TextInput
                className="border border-border rounded-xl px-4 py-4 text-primary text-2xl font-bold text-center tracking-widest bg-white"
                placeholder="AB3X9F"
                placeholderTextColor="#D0D0D0"
                value={inputCode}
                onChangeText={(t) => setInputCode(t.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoFocus
              />

              <Pressable
                className={`rounded-xl py-4 items-center ${inputCode.length >= 4 && !isLoading ? 'bg-primary' : 'bg-border'}`}
                onPress={handleAcceptCode}
                disabled={inputCode.length < 4 || isLoading}
                accessibilityLabel="連携する"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">連携する</Text>
                )}
              </Pressable>
            </View>
          )}

        </View>
      </SafeAreaView>
    </Modal>
  );
}
