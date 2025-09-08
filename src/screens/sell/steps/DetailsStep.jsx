import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../../../theme/colors';
import { ChevronDown } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateDetails } from '../../../store/listingDraft/listingDraftSlice';

export default function DetailsStep() {
  const dispatch = useDispatch();
  const form = useSelector((s) => s.listingDraft.details);
  const set = (k, v) => dispatch(updateDetails({ [k]: v }));

  const categories = useMemo(() => ['Electronics', 'Gaming', 'Fashion', 'Home & Kitchen', 'Sports', 'Collectibles'], []);
  const conditions = useMemo(() => ['New', 'Like New', 'Good', 'Fair'], []);
  const [showCat, setShowCat] = useState(false);
  const [showCond, setShowCond] = useState(false);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
    >
      <FieldLabel>Item Name</FieldLabel>
      <Input placeholder="E.g., Vintage Gaming Console" value={form.name} onChangeText={(t)=>set('name', t)} />

      <FieldLabel>Item Description</FieldLabel>
      <Input multiline numberOfLines={4} style={{ height: 120, textAlignVertical: 'top' }} placeholder="Describe your item in detail, including condition, features, and any accessories." value={form.description} onChangeText={(t)=>set('description', t)} />

      <FieldLabel>Category</FieldLabel>
      <Select placeholder="Select a category" value={form.category} onPress={() => setShowCat(true)} />

      <FieldLabel>Condition</FieldLabel>
      <Select placeholder="Select a condition" value={form.condition} onPress={() => setShowCond(true)} />

      <FieldLabel>Quantity</FieldLabel>
      <Input placeholder="Number of items" keyboardType="numeric" value={form.qty} onChangeText={(t)=>set('qty', t)} />

      {/* <FieldLabel>Product ID</FieldLabel>
      <Input placeholder="Product ID" value={form.productId} onChangeText={(t)=>set('productId', t)} /> */}
      {/* Dropdowns */}
      <PickerModal
        visible={showCat}
        title="Select Category"
        options={categories}
        onClose={() => setShowCat(false)}
        onSelect={(v) => { set('category', v); setShowCat(false); }}
      />
      <PickerModal
        visible={showCond}
        title="Select Condition"
        options={conditions}
        onClose={() => setShowCond(false)}
        onSelect={(v) => { set('condition', v); setShowCond(false); }}
      />
    </KeyboardAwareScrollView>
  );
}

function FieldLabel({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Input(props) {
  return <TextInput {...props} placeholderTextColor={colors.textSecondary} style={[styles.input, props.style]} />;
}

function Select({ placeholder, value, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.input, styles.select]}>
      <Text style={[styles.selectTxt, { color: value ? colors.white : colors.textSecondary }]}>{value || placeholder}</Text>
      <ChevronDown size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

function PickerModal({ visible, title, options, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalBackdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={styles.optionRow} onPress={() => onSelect(opt)}>
              <Text style={styles.optionTxt}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 140 },
  label: { color: colors.white, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  input: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, color: colors.white },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectTxt: { fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1E2128', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#343B49' },
  modalTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  optionRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2B2F39' },
  optionTxt: { color: colors.white, fontWeight: '600' },
});
