import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking, BackHandler } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';

const TYPE_COPY = {
  force: {
    title: 'Update Required',
    body: 'A new version of Zishes is available with critical fixes. Update now to continue playing.',
    primary: 'Update Now',
  },
  soft: {
    title: 'Update Available',
    body: 'We’ve added new features and improvements. Update now for the best experience.',
    primary: 'Update',
    secondary: 'Later',
  },
};

export default function AppUpdateModal({
  visible,
  type = 'soft',
  latestVersion,
  minRequiredVersion,
  storeUrl,
  onLater,
}) {
  const copy = TYPE_COPY[type] || TYPE_COPY.soft;

  const handleUpdate = () => {
    if (storeUrl) Linking.openURL(storeUrl).catch(() => {});
  };

  const handleLater = () => {
    if (type === 'force') {
      BackHandler.exitApp();
      return;
    }
    if (onLater) onLater();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleLater}>
      <View style={styles.backdrop}>
        <LinearGradient colors={['#20263C', '#131722']} style={styles.card}>
          <View style={styles.headerBadge}>
            <Text style={styles.badgeText}>Update</Text>
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <View style={styles.versionRow}>
            {latestVersion ? (
              <Text style={styles.versionText}>Latest: <Text style={styles.versionStrong}>{latestVersion}</Text></Text>
            ) : null}
            {minRequiredVersion ? (
              <Text style={[styles.versionText, { marginTop: latestVersion ? 6 : 0 }]}>Minimum: <Text style={styles.versionStrong}>{minRequiredVersion}</Text></Text>
            ) : null}
          </View>
          <TouchableOpacity style={[styles.button, styles.primary]} onPress={handleUpdate}>
            <Text style={styles.buttonText}>{copy.primary}</Text>
          </TouchableOpacity>
          {type !== 'force' ? (
            <TouchableOpacity style={[styles.button, styles.secondary]} onPress={handleLater}>
              <Text style={[styles.buttonText, { color: colors.white }]}>Later</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.forceHint}>Updating is required to keep playing.</Text>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124, 93, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: { color: colors.accent, fontWeight: '700', letterSpacing: 1 },
  title: { color: colors.white, fontWeight: '800', fontSize: 24 },
  body: { color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
  versionRow: { marginTop: 18 },
  versionText: { color: colors.textSecondary },
  versionStrong: { color: colors.white, fontWeight: '700' },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  forceHint: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 16 },
});

