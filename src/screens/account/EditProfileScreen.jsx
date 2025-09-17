import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';
import AppModal from '../../components/common/AppModal';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../../store/auth/authSlice';
import useGalleryPermission from '../../hooks/useGalleryPermission';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { setCountry as setCountryGlobal } from '../../store/app/appSlice';
import users from '../../services/users';
import { uploadImage } from '../../services/uploads';
import ImagePickerSheet from '../../components/common/ImagePickerSheet';
import useCameraPermission from '../../hooks/useCameraPermission';
import { getAccessToken } from '../../services/tokenManager';

export default function EditProfileScreen({ navigation, route }) {
  const { user, token } = useSelector((s) => s.auth || {});
  const dispatch = useDispatch();
  const [name, setName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [avatarUri, setAvatarUri] = useState(user?.avatar || user?.avatarUrl || user?.image || null);
  const [country, setCountry] = useState(user?.address?.country || '');
  const ensureGallery = useGalleryPermission();
  const ensureCamera = useCameraPermission();
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const sub = navigation.addListener('focus', () => {
      // Keep form in sync with store without re-calling getMe on every focus
      const doc = user || {};
      setName(doc?.username || '');
      setEmail(doc?.email || '');
      setAvatarUri(doc?.avatar || doc?.avatarUrl || doc?.image || null);
      // Apply selectedCountry if passed back from picker
      const picked = route?.params?.selectedCountry;
      if (picked) setCountry(picked);
      else setCountry(doc?.address?.country || '');
    });
    return sub;
  }, [navigation, user, route?.params?.selectedCountry]);

  const save = async () => {
    try {
      // Allow updating name and country
      const patch = {};
      if (name && name !== user?.username) patch.username = name;
      const currentCountry = user?.address?.country || '';
      if (country && country !== currentCountry) patch.address = { ...(user?.address || {}), country };
      if (Object.keys(patch).length === 0) {
        navigation.goBack();
        return;
      }
      let bearer = token;
      if (!bearer) { try { bearer = await getAccessToken(); } catch {} }
      if (!bearer) throw new Error('Missing auth token');
      const updated = await users.updateMe(patch, { token: bearer });
      const doc = updated?.data || updated;
      if (doc) {
        dispatch(setUser(doc));
      }
      navigation.goBack();
    } catch (err) {
      // Basic fallback: stay on screen; could show toast
      console.warn('Failed to update profile', err?.message || err);
    }
  };
  const cancel = () => navigation.goBack();
  const deleteAccount = () => setConfirmOpen(true);
  const confirmDelete = async () => {
    setConfirmOpen(false);
    await dispatch(logout());
  };

  const startGallery = async () => {
    const ok = await ensureGallery();
    if (!ok) return;
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 });
    await handlePicked(res);
  };
  const startCamera = async () => {
    const ok = await ensureCamera();
    if (!ok) return;
    const res = await launchCamera({ mediaType: 'photo', quality: 0.9, cameraType: 'front', saveToPhotos: true });
    await handlePicked(res);
  };
  const handlePicked = async (res) => {
    if (res && res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      const uri = asset.uri;
      if (!uri) return;
      try {
        setAvatarUri(uri);
        const uploaded = await uploadImage(asset);
        const imageUrl = uploaded?.url;
        if (imageUrl) {
          let bearer = token;
          if (!bearer) { try { bearer = await getAccessToken(); } catch {} }
          if (!bearer) throw new Error('Missing auth token');
          const updated = await users.updateMe({ avatar: imageUrl }, { token: bearer });
          const doc = updated?.data || updated;
          if (doc) dispatch(setUser(doc));
          setAvatarUri(imageUrl);
        }
      } catch (e) {
        console.warn('Avatar upload failed:', e?.message || e);
      }
    }
  };

  const avatarSource = useMemo(() => {
    if (avatarUri && typeof avatarUri === 'string') return { uri: avatarUri };
    try { return require('../../assets/zishes_logo.png'); } catch { return undefined; }
  }, [avatarUri]);

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
            <Image source={avatarSource} style={styles.avatar} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
            <TouchableOpacity style={styles.changeBtn} onPress={() => setPickerOpen(true)}><Text style={styles.changeTxt}>Change Photo</Text></TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.cardForm}>
            <Label>Full Name</Label>
            <Input value={name} onChangeText={setName} placeholder="Your name" />

            <Label>Email Address</Label>
            <View style={[styles.input, { justifyContent: 'center' }]}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{email || '—'}</Text>
            </View>

            <Label>Country</Label>
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => navigation.navigate('CountrySelect', { mode: 'pick' })}
              activeOpacity={0.85}
            >
              <Text style={{ color: country ? colors.white : colors.textSecondary, fontWeight: '600' }}>
                {country || 'Select your country'}
              </Text>
              <Text style={{ color: colors.textSecondary }}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={save}>
            <Text style={styles.actionTxt}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={cancel}>
            <Text style={styles.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
          {/* Delete account moved to Settings/Manage Account */}
      </KeyboardAwareScrollView>

      <AppModal
        visible={confirmOpen}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
      <ImagePickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPickCamera={() => {
          // Close sheet first, then open camera to avoid iOS modal race causing auto-dismiss
          setPickerOpen(false);
          setTimeout(() => { startCamera(); }, 300);
        }}
        onPickGallery={() => {
          setPickerOpen(false);
          setTimeout(() => { startGallery(); }, 300);
        }}
        title="Change Photo"
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
