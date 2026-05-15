import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

type InputMethod = 'select' | 'url' | 'note' | 'image';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaveUrl: (url: string) => Promise<void>;
  onSaveNote: (title: string, content: string) => Promise<void>;
  onSaveImage: (uri: string, note?: string) => Promise<void>;
}

export function AddBookmarkModal({ visible, onClose, onSaveUrl, onSaveNote, onSaveImage }: Props) {
  const [method, setMethod] = useState<InputMethod>('select');
  const [isSaving, setIsSaving] = useState(false);

  // URL 入力
  const [urlText, setUrlText] = useState('');

  // メモ入力
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const reset = () => {
    setMethod('select');
    setUrlText('');
    setNoteTitle('');
    setNoteContent('');
    setIsSaving(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSaveUrl = async () => {
    const trimmed = urlText.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      Alert.alert('URLの形式が正しくありません', 'https:// で始まるURLを入力してください');
      return;
    }
    setIsSaving(true);
    await onSaveUrl(trimmed);
    reset();
    onClose();
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) { Alert.alert('タイトルを入力してください'); return; }
    setIsSaving(true);
    await onSaveNote(noteTitle.trim(), noteContent.trim());
    reset();
    onClose();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('写真へのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setIsSaving(true);
    await onSaveImage(uri);
    reset();
    onClose();
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
          <Pressable onPress={handleClose} accessibilityLabel="閉じる">
            <Text className="text-muted text-sm">{method !== 'select' ? '←' : 'キャンセル'}</Text>
          </Pressable>
          <Text className="font-semibold text-primary text-sm">
            {method === 'select' ? '📌 情報を保存' : method === 'url' ? 'URLを貼る' : method === 'note' ? 'メモを書く' : '画像を保存'}
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 gap-4" keyboardShouldPersistTaps="handled">

          {/* 方法選択 */}
          {method === 'select' && (
            <View className="gap-3">
              <Text className="text-sm text-muted text-center mb-2">どの形で保存しますか？</Text>

              {[
                { id: 'url' as const, emoji: '🔗', label: 'URLを貼る', desc: 'ウェブサイト・YouTube・記事など' },
                { id: 'image' as const, emoji: '📷', label: '画像を選ぶ', desc: 'スクショ・写真など' },
                { id: 'note' as const, emoji: '📝', label: 'メモを書く', desc: 'テキストで情報を記録' },
              ].map((opt) => (
                <Pressable
                  key={opt.id}
                  className="flex-row items-center bg-white border border-border rounded-2xl p-4 active:opacity-70"
                  onPress={() => setMethod(opt.id)}
                  accessibilityLabel={opt.label}
                >
                  <Text className="text-2xl mr-3">{opt.emoji}</Text>
                  <View>
                    <Text className="text-primary font-medium text-sm">{opt.label}</Text>
                    <Text className="text-muted text-xs">{opt.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* URL 入力 */}
          {method === 'url' && (
            <View className="gap-4">
              <View className="gap-1.5">
                <Text className="text-xs font-medium text-muted">URL</Text>
                <TextInput
                  className="border border-border rounded-xl px-4 py-3 text-primary text-sm bg-white"
                  placeholder="https://..."
                  placeholderTextColor="#A0A0A0"
                  value={urlText}
                  onChangeText={setUrlText}
                  autoCapitalize="none"
                  keyboardType="url"
                  autoFocus
                />
                <Text className="text-xs text-muted">
                  YouTube・TikTok・ブログ記事などのURLを貼り付けてください。
                  AI が自動でタイトル・カテゴリを判定します。
                </Text>
              </View>

              <Pressable
                className={`rounded-xl py-3.5 items-center ${urlText.trim() && !isSaving ? 'bg-primary' : 'bg-border'}`}
                onPress={handleSaveUrl}
                disabled={!urlText.trim() || isSaving}
                accessibilityLabel="保存する"
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-sm">保存する</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* メモ入力 */}
          {method === 'note' && (
            <View className="gap-4">
              <View className="gap-1.5">
                <Text className="text-xs font-medium text-muted">タイトル</Text>
                <TextInput
                  className="border border-border rounded-xl px-4 py-3 text-primary text-sm bg-white"
                  placeholder="例: ビザ申請で気になったこと"
                  placeholderTextColor="#A0A0A0"
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  maxLength={60}
                  autoFocus
                />
              </View>
              <View className="gap-1.5">
                <Text className="text-xs font-medium text-muted">内容</Text>
                <TextInput
                  className="border border-border rounded-xl px-4 py-3 text-primary text-sm bg-white"
                  placeholder="メモを入力..."
                  placeholderTextColor="#A0A0A0"
                  value={noteContent}
                  onChangeText={setNoteContent}
                  multiline
                  numberOfLines={5}
                  maxLength={1000}
                  style={{ minHeight: 120, textAlignVertical: 'top' }}
                />
              </View>
              <Pressable
                className={`rounded-xl py-3.5 items-center ${noteTitle.trim() && !isSaving ? 'bg-primary' : 'bg-border'}`}
                onPress={handleSaveNote}
                disabled={!noteTitle.trim() || isSaving}
                accessibilityLabel="保存する"
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-sm">保存する</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* 画像選択 */}
          {method === 'image' && (
            <View className="gap-4">
              <Text className="text-sm text-muted text-center">カメラロールから画像を選んでください</Text>
              <Pressable
                className="bg-primary rounded-xl py-3.5 items-center active:opacity-80"
                onPress={handlePickImage}
                disabled={isSaving}
                accessibilityLabel="画像を選択"
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-sm">📷 画像を選ぶ</Text>
                )}
              </Pressable>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
