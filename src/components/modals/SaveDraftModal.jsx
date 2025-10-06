import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Button from '../ui/Button';
import { CheckCircle2 } from 'lucide-react-native';

export default function SaveDraftModal({
  visible,
  variant = 'prompt',
  requireName,
  nameValue,
  onChangeName,
  onClose,
  onDiscard,
  onSave,
  onHome,
  successTitle,
  successSubtitle,
  successPrimaryLabel,
  successSecondaryLabel,
  onSuccessPrimary,
  onSuccessSecondary,
  successIconColor,
}) {
  const insets = useSafeAreaInsets();
  const isPrompt = variant !== 'success';
  const showNameError = isPrompt && requireName && !String(nameValue || '').trim();

  const handlePrimarySuccess = () => {
    if (onSuccessPrimary) {
      onSuccessPrimary();
    } else if (onClose) {
      onClose();
    }
  };

  if (!isPrompt) {
    const heading = successTitle || 'Saved as Draft';
    const caption = successSubtitle || 'Your listing has been saved. You can return and finish anytime.';
    const primaryLabel = successPrimaryLabel || 'Keep Editing';
    const secondaryLabel = successSecondaryLabel || 'Go to Drafts';

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.backdrop}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.sheet, styles.sheetCompact, { paddingBottom: insets.bottom + 36 }]}>
                <View style={styles.successIconWrap}>
                  <CheckCircle2 size={36} color={successIconColor || colors.accent} />
                </View>
                <Text style={styles.title}>{heading}</Text>
                <Text style={[styles.subtitle, styles.subtitleCompact]}>{caption}</Text>
                <View style={[styles.buttonRow, styles.buttonRowCompact]}>
                  <Button
                    title={primaryLabel}
                    variant="outline"
                    onPress={handlePrimarySuccess}
                    style={{ flex: 1 }}
                    fullWidth={false}
                  />
                  <Button
                    title={secondaryLabel}
                    onPress={onSuccessSecondary}
                    style={{ flex: 1 }}
                    fullWidth={false}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 40 }]}
            >
              <Text style={styles.title}>Save your progressssss?</Text>
              <Text style={styles.subtitle}>
                You have unsaved changes. Save as a draft or discard.
              </Text>

              {requireName ? (
                <View style={{ width: '100%', marginTop: 18 }}>
                  <Text style={styles.label}>Item Name (required)</Text>
                  <TextInput
                    value={nameValue}
                    onChangeText={onChangeName}
                    placeholder="Item name"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, showNameError && styles.inputError]}
                  />
                  {showNameError ? (
                    <Text style={styles.error}>Item name is required.</Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                 

                <Button
                  title="Discard"
                  variant="outline"
                  onPress={onDiscard}
                  style={{ flex: 1 }}
                  fullWidth={false}
                />
                <Button
                  title="Save & Continue"
                  onPress={onSave}
                  style={{ flex: 1 }}
                  fullWidth={false}
                />
              </View>

              <Button
                title="Go Home"
                variant="ghost"
                onPress={onHome}
                style={{ marginBottom: 16 }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E2128',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
    width: '100%',
    maxHeight: '90%'
  },
  sheetCompact: {
    paddingTop: 28,
  },
  title: { color: colors.white, fontWeight: '800', fontSize: 18, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  subtitleCompact: { marginTop: 6 },
  label: { color: colors.white, fontWeight: '700', marginBottom: 8 },
  input: {
    width: '100%',
    backgroundColor: '#2B2F39',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#343B49',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.white,
  },
  inputError: { borderColor: '#ff6b6b' },
  error: { color: '#ff8a8a', marginTop: 6 },
  buttonRow: { flexDirection: 'row', width: '100%', columnGap: 12, marginTop: 20 },
  buttonRowCompact: { marginTop: 18 },
  successIconWrap: { marginBottom: 12 },
});
