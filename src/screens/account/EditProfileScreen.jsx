import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';
import AppModal from '../../components/common/AppModal';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/auth/authSlice';

export default function EditProfileScreen({ navigation }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState(user?.email || 'john.doe@example.com');
  const [country, setCountry] = useState('India');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const save = () => {
    // TODO: integrate profile update API later
    navigation.goBack();
  };
  const cancel = () => navigation.goBack();
  const deleteAccount = () => setConfirmOpen(true);
  const confirmDelete = async () => {
    setConfirmOpen(false);
    await dispatch(logout());
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={24}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
          {/* Avatar Card */}
          <View style={styles.cardCenter}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80&auto=format&fit=crop' }} style={styles.avatar} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
            <TouchableOpacity style={styles.changeBtn}><Text style={styles.changeTxt}>Change Photo</Text></TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.cardForm}>
            <Label>Full Name</Label>
            <Input value={name} onChangeText={setName} placeholder="John Doe" />

            <Label>Email Address</Label>
            <Input value={email} onChangeText={setEmail} placeholder="john.doe@example.com" keyboardType="email-address" autoCapitalize="none" />

            <Label>Country of Play</Label>
            <Input value={country} onChangeText={setCountry} placeholder="India" />
          </View>

          {/* Actions */}
          <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={save}>
            <Text style={styles.actionTxt}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={cancel}>
            <Text style={styles.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={deleteAccount}>
            <Text style={styles.deleteTxt}>Delete Account</Text>
          </TouchableOpacity>
      </KeyboardAwareScrollView>

      <AppModal
        visible={confirmOpen}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  );
}

function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}
function Input(props) {
  return <TextInput {...props} placeholderTextColor={colors.textSecondary} style={styles.input} />;
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  cardCenter: { backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 16, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 10 },
  name: { color: colors.white, fontWeight: '800', fontSize: 20 },
  email: { color: colors.textSecondary, marginTop: 2 },
  changeBtn: { backgroundColor: '#111', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginTop: 12 },
  changeTxt: { color: colors.white, fontWeight: '700' },

  cardForm: { backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 16, marginBottom: 18 },
  label: { color: colors.white, marginTop: 8, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#343846', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.white },

  actionBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtn: { backgroundColor: '#4A4A50' },
  cancelBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3A4051' },
  deleteBtn: { backgroundColor: '#C65B5B' },
  actionTxt: { color: colors.white, fontWeight: '800' },
  cancelTxt: { color: colors.white, fontWeight: '800' },
  deleteTxt: { color: colors.white, fontWeight: '800' },
});
