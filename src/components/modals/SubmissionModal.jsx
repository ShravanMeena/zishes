import React from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import ProgressBar from '../common/ProgressBar';
import { CheckCircle2, AlertTriangle } from 'lucide-react-native';

export default function SubmissionModal({
  visible,
  stage = 'idle', // 'uploading' | 'creating' | 'success' | 'error'
  progress = 0,
  error,
  onClose,
  onPrimary,
  primaryText,
}) {
  const isWorking = stage === 'uploading' || stage === 'creating';
  const isSuccess = stage === 'success' && !error;
  const isError = stage === 'error' || !!error;

  const title = isWorking ? 'Publishing your listing' : isSuccess ? 'Listing Submitted' : 'We’re facing a technical issue';
  const message = isWorking
    ? (stage === 'uploading' ? 'Uploading photos securely...' : 'Creating product and tournament...')
    : isSuccess
      ? "Your item is under review. We'll notify you shortly."
      : 'Something went wrong while submitting your listing. Please try again in a bit.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, (isSuccess || isError) && styles.cardCentered]}>
          <Text style={[styles.title, (isSuccess || isError) && styles.titleCentered]}>{title}</Text>

          {isWorking ? (
            <View style={{ alignItems: 'center', marginTop: 14 }}>
              <ActivityIndicator color={colors.primary} size="large" />
              <View style={{ width: '100%', marginTop: 16 }}>
                <ProgressBar value={progress || 0} height={10} />
              </View>
              <Text style={styles.message}>{message}</Text>
            </View>
          ) : isSuccess ? (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <CheckCircle2 size={48} color={colors.accent} />
              <Text style={[styles.message, { textAlign: 'center' }]}>{message}</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <AlertTriangle size={48} color="#ffcc66" />
              <Text style={[styles.message, { textAlign: 'center' }]}>{message}</Text>
              {error ? <Text style={[styles.errorTxt]}>{String(error)}</Text> : null}
            </View>
          )}

          <View style={[styles.actions, (isSuccess || isError) && styles.actionsCentered]}>
            {isWorking ? (
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
                <Text style={styles.btnGhostTxt}>Hide</Text>
              </TouchableOpacity>
            ) : isSuccess ? (
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onPrimary || onClose}>
                <Text style={styles.btnPrimaryTxt}>{primaryText || 'Go to My Listings'}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
                  <Text style={styles.btnGhostTxt}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onPrimary}>
                  <Text style={styles.btnPrimaryTxt}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '86%', backgroundColor: '#1E2128', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 16 },
  cardCentered: { alignItems: 'center' },
  title: { color: colors.white, fontWeight: '900', fontSize: 18 },
  titleCentered: { textAlign: 'center', width: '100%' },
  message: { color: colors.textSecondary, marginTop: 10 },
  errorTxt: { color: '#ffb3b3', marginTop: 6, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  actionsCentered: { justifyContent: 'center' },
  btn: { height: 44, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { borderWidth: 1, borderColor: '#3A4051' },
  btnGhostTxt: { color: colors.white, fontWeight: '800' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryTxt: { color: colors.white, fontWeight: '800' },
});
