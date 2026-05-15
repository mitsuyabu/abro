import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ContactRow } from '@/components/emergency/ContactRow';
import { useEmergency } from '@/hooks/useEmergency';
import { useAuthStore } from '@/stores/auth';
import { COUNTRY_EMERGENCY, JAPAN_EMERGENCY_OVERSEAS } from '@/lib/emergency/country_contacts';
import type { EmergencyCategory, EmergencyContact, EmergencyRelationship } from '@/types';

const CATEGORIES: Array<{ value: EmergencyCategory; emoji: string; label: string; color: string }> = [
  { value: 'medical',  emoji: '🏥', label: '医療・病気',   color: 'bg-red-50 border-red-200' },
  { value: 'theft',    emoji: '🔒', label: '盗難・紛失',   color: 'bg-orange-50 border-orange-200' },
  { value: 'accident', emoji: '⚠️', label: '事故・怪我',   color: 'bg-yellow-50 border-yellow-200' },
  { value: 'mental',   emoji: '💙', label: '心の不調',     color: 'bg-blue-50 border-blue-200' },
  { value: 'trouble',  emoji: '🚨', label: 'トラブル',     color: 'bg-purple-50 border-purple-200' },
  { value: 'other',    emoji: '📞', label: 'その他',       color: 'bg-gray-50 border-gray-200' },
];

const RELATIONSHIPS: Array<{ value: EmergencyRelationship; label: string }> = [
  { value: 'parent', label: '親・家族' },
  { value: 'friend', label: '友人' },
  { value: 'agent', label: 'エージェント' },
  { value: 'doctor', label: '医師' },
  { value: 'other', label: 'その他' },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchContacts, addContact, deleteContact, logEmergency } = useEmergency();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_EMERGENCY[0]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory | null>(null);

  const load = useCallback(async () => {
    const data = await fetchContacts();
    setContacts(data);
  }, [fetchContacts]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert('削除', `「${contact.label}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: async () => {
          await deleteContact(contact.id);
          setContacts((prev) => prev.filter((c) => c.id !== contact.id));
        },
      },
    ]);
  };

  const handleSos = async () => {
    if (!selectedCategory) return;
    await logEmergency({ category: selectedCategory, severity: 'high' });
    setShowSos(false);
    setSelectedCategory(null);
    // AI チャットへ誘導
    router.push({ pathname: '/chat/[id]' as never, params: { id: 'new', initialMessage: `緊急サポートが必要です。カテゴリ: ${CATEGORIES.find((c) => c.value === selectedCategory)?.label}` } });
  };

  const countryInfo = selectedCountry;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">緊急サポート</Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-5">

        {/* SOS ボタン */}
        <Pressable
          className="bg-red-500 rounded-2xl py-5 items-center gap-1 active:opacity-80"
          onPress={() => setShowSos(true)}
          accessibilityLabel="SOS 緊急サポートを開始"
        >
          <Text className="text-4xl">🆘</Text>
          <Text className="text-white font-bold text-lg">SOS — 緊急サポート</Text>
          <Text className="text-red-100 text-xs">タップして AI サポートを開始</Text>
        </Pressable>

        {/* 外務省海外安全 */}
        <View className="bg-white border border-border rounded-2xl p-4 gap-3">
          <Text className="text-sm font-semibold text-primary">🇯🇵 外務省海外安全相談センター</Text>
          <ContactRow emoji="☎️" label="24時間対応" value={JAPAN_EMERGENCY_OVERSEAS} />
        </View>

        {/* 国別緊急番号 */}
        <View className="bg-white border border-border rounded-2xl p-4 gap-3">
          <Text className="text-sm font-semibold text-primary">現地緊急連絡先</Text>

          {/* 国選択 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {COUNTRY_EMERGENCY.map((c) => (
              <Pressable
                key={c.country}
                className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${selectedCountry.country === c.country ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                onPress={() => setSelectedCountry(c)}
              >
                <Text className="text-xs">{c.flag}</Text>
                <Text className={`text-xs font-medium ${selectedCountry.country === c.country ? 'text-white' : 'text-primary'}`}>{c.country}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="gap-0">
            <ContactRow emoji="🚔" label="警察・救急・消防" value={countryInfo.police} />
            <View className="h-px bg-border" />
            <ContactRow emoji="🏛️" label={countryInfo.japaneseEmbassy} value={countryInfo.embassyPhone} />
          </View>
        </View>

        {/* 緊急連絡先 */}
        <View className="bg-white border border-border rounded-2xl p-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-primary">📋 個人緊急連絡先</Text>
            <Pressable onPress={() => setShowAddContact(true)} className="active:opacity-70">
              <Text className="text-primary text-xs font-medium">+ 追加</Text>
            </Pressable>
          </View>

          {contacts.length === 0 ? (
            <Pressable
              className="border border-dashed border-border rounded-xl p-3 items-center active:opacity-70"
              onPress={() => setShowAddContact(true)}
            >
              <Text className="text-muted text-xs">親・友人・エージェントの連絡先を登録</Text>
            </Pressable>
          ) : (
            <View className="gap-0">
              {contacts.map((c, i) => (
                <View key={c.id}>
                  {i > 0 && <View className="h-px bg-border" />}
                  <Pressable
                    className="flex-row items-center justify-between py-2.5 active:opacity-70"
                    onPress={() => c.phone && Linking.openURL(`tel:${c.phone}`)}
                    onLongPress={() => handleDeleteContact(c)}
                    accessibilityLabel={c.label}
                  >
                    <View className="flex-1 gap-0.5">
                      <Text className="text-primary text-sm font-medium">{c.label}</Text>
                      <Text className="text-muted text-xs">{RELATIONSHIPS.find((r) => r.value === c.relationship)?.label}</Text>
                    </View>
                    {c.phone && (
                      <View className="bg-green-500 rounded-full px-2 py-0.5">
                        <Text className="text-white text-xs font-semibold">📞 {c.phone}</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <Text className="text-muted text-xs">長押しで削除</Text>
        </View>

        {/* 役立つ情報 */}
        <View className="bg-white border border-border rounded-2xl p-4 gap-3">
          <Text className="text-sm font-semibold text-primary">💡 困ったときのヒント</Text>
          {[
            { emoji: '🏥', text: 'まず自分の安全を確保してください' },
            { emoji: '📸', text: '証拠になるものは写真に残す' },
            { emoji: '📄', text: 'パスポートのコピーを常に携帯' },
            { emoji: '💊', text: '常備薬は処方箋と一緒に持ち歩く' },
            { emoji: '🌐', text: '大使館のウェブサイトを事前にブックマーク' },
          ].map(({ emoji, text }) => (
            <View key={text} className="flex-row items-start gap-2">
              <Text className="text-base">{emoji}</Text>
              <Text className="text-primary text-xs leading-relaxed flex-1">{text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* SOS モーダル */}
      <Modal visible={showSos} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSos(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={() => setShowSos(false)}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">どんな状況ですか？</Text>
            <View className="w-16" />
          </View>
          <ScrollView className="flex-1 px-4 py-6" contentContainerClassName="gap-3">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                className={`flex-row items-center gap-4 border rounded-2xl p-4 active:opacity-70 ${selectedCategory === cat.value ? 'bg-primary border-primary' : cat.color}`}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Text className="text-3xl">{cat.emoji}</Text>
                <Text className={`font-semibold text-base ${selectedCategory === cat.value ? 'text-white' : 'text-primary'}`}>{cat.label}</Text>
              </Pressable>
            ))}
            <Pressable
              className={`rounded-2xl py-4 items-center mt-2 ${selectedCategory ? 'bg-red-500' : 'bg-border'}`}
              onPress={handleSos}
              disabled={!selectedCategory}
            >
              <Text className={`font-bold text-base ${selectedCategory ? 'text-white' : 'text-muted'}`}>
                AI サポートを開始する
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 連絡先追加モーダル */}
      <AddContactModal
        visible={showAddContact}
        onClose={() => setShowAddContact(false)}
        onAdded={(c) => { setContacts((prev) => [...prev, c]); setShowAddContact(false); }}
      />
    </SafeAreaView>
  );
}

function AddContactModal({ visible, onClose, onAdded }: {
  visible: boolean;
  onClose: () => void;
  onAdded: (c: EmergencyContact) => void;
}) {
  const { addContact } = useEmergency();
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState<EmergencyRelationship>('parent');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = label.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    const c = await addContact({ label: label.trim(), phone: phone.trim() || undefined, relationship });
    setIsSaving(false);
    if (c) { setLabel(''); setPhone(''); onAdded(c); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={onClose}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">緊急連絡先を追加</Text>
            <Pressable className={`px-4 py-1.5 rounded-full ${canSave && !isSaving ? 'bg-primary' : 'bg-border'}`} onPress={handleSave} disabled={!canSave || isSaving}>
              <Text className={`text-xs font-semibold ${canSave && !isSaving ? 'text-white' : 'text-muted'}`}>{isSaving ? '保存中...' : '保存'}</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            <Text className="text-xs font-semibold text-muted mb-2">関係</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {RELATIONSHIPS.map((r) => (
                <Pressable key={r.value} className={`px-3 py-1.5 rounded-full border ${relationship === r.value ? 'bg-primary border-primary' : 'bg-white border-border'}`} onPress={() => setRelationship(r.value)}>
                  <Text className={`text-xs font-medium ${relationship === r.value ? 'text-white' : 'text-primary'}`}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-xs font-semibold text-muted mb-1.5">名前・ラベル *</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: お母さん" placeholderTextColor="#A0A0A0" value={label} onChangeText={setLabel} maxLength={50} />
            <Text className="text-xs font-semibold text-muted mb-1.5">電話番号</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="+81-90-0000-0000" placeholderTextColor="#A0A0A0" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={20} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

