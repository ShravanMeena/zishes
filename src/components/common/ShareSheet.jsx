import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Share, Modal, Pressable } from 'react-native';
import { colors } from '../../theme/colors';
import { Facebook, Twitter, Instagram, Send, Link2 } from 'lucide-react-native';

export default function ShareSheet({ visible, onClose, url }) {
  const shareTo = async (platform) => {
    try { await Share.share({ message: url }); } catch {}
    onClose?.();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalScrim} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.title}>Share</Text>
          <Text style={styles.subtitle}>Share this link via</Text>
          <View style={styles.row}>
            <IconBtn onPress={() => shareTo('facebook')}><Facebook size={22} color="#1877F2" /></IconBtn>
            <IconBtn onPress={() => shareTo('twitter')}><Twitter size={22} color="#1DA1F2" /></IconBtn>
            <IconBtn onPress={() => shareTo('instagram')}><Instagram size={22} color="#C13584" /></IconBtn>
            <IconBtn onPress={() => shareTo('telegram')}><Send size={22} color="#0088cc" /></IconBtn>
          </View>
          <Text style={[styles.subtitle, { marginTop: 16 }]}>Or copy link</Text>
          <View style={styles.copyBox}>
            <Link2 size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput value={url} editable={false} style={{ flex: 1, color: colors.white }} />
            <TouchableOpacity onPress={() => shareTo('copy')} style={styles.copyBtn}><Text style={styles.copyText}>Copy</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
            <Text style={styles.dismissTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function IconBtn({ children, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iconBtn}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalScrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#1E2434', borderRadius: 20, padding: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2E3444' },
  title: { color: colors.white, fontWeight: '800', fontSize: 18 },
  subtitle: { color: colors.textSecondary, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  copyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginTop: 8 },
  copyBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  copyText: { color: colors.white, fontWeight: '700' },
  dismissBtn: { marginTop: 20, alignSelf: 'flex-end', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#343B49' },
  dismissTxt: { color: colors.textSecondary, fontWeight: '700' },
});
