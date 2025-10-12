import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Keyboard, ScrollView, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../../../theme/colors';
import { ChevronDown } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateDetails } from '../../../store/listingDraft/listingDraftSlice';
import useCategories from '../../../hooks/useCategories';

export default function DetailsStep() {
  const dispatch = useDispatch();
  const form = useSelector((s) => s.listingDraft.details);
  const set = useCallback((k, v) => dispatch(updateDetails({ [k]: v })), [dispatch]);
  const setMany = useCallback((values) => dispatch(updateDetails(values)), [dispatch]);

  const { categories: allCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const categoryOptions = useMemo(() => {
    if (!Array.isArray(allCategories)) return [];
    return allCategories
      .filter((cat) => cat?.id !== 'all')
      .map((cat, idx) => ({
        key: cat?.id || cat?.rawId || cat?.label || cat?.name || `category-${idx}`,
        label: cat?.label || cat?.name || 'Category',
        value: cat?.rawId || cat?.id,
      }))
      .filter((opt) => opt.value);
  }, [allCategories]);
  const conditions = useMemo(() => ['New', 'Like New', 'Good', 'Fair'], []);
  const conditionOptions = useMemo(
    () => conditions.map((label) => ({ key: label, label, value: label })),
    [conditions]
  );
  const [showCat, setShowCat] = useState(false);
  const [showCond, setShowCond] = useState(false);

  const selectedCategoryLabel = useMemo(() => {
    if (form?.categoryLabel) return form.categoryLabel;
    if (!form?.category) return '';
    const match = categoryOptions.find(
      (opt) => String(opt.value) === String(form.category) || opt.label === form.category
    );
    return match?.label || (typeof form?.category === 'string' ? form.category : '');
  }, [form?.category, form?.categoryLabel, categoryOptions]);

  useEffect(() => {
    if (!form?.category || !categoryOptions.length) return;
    const matchByValue = categoryOptions.find((opt) => String(opt.value) === String(form.category));
    if (matchByValue) {
      if (form.categoryLabel !== matchByValue.label) {
        setMany({ categoryLabel: matchByValue.label });
      }
      return;
    }
    const matchByLabel = categoryOptions.find((opt) => opt.label === form.category);
    if (matchByLabel) {
      setMany({ category: matchByLabel.value, categoryLabel: matchByLabel.label });
    }
  }, [form?.category, form?.categoryLabel, categoryOptions, setMany]);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      enableOnAndroid
      extraScrollHeight={20}
    >
      <FieldLabel>Item Name</FieldLabel>
      <Input placeholder="Listing title" value={form.name} onChangeText={(t)=>set('name', t)} />

      <FieldLabel>Item Description</FieldLabel>
      <Input
        multiline
        numberOfLines={4}
        style={{ height: 120, textAlignVertical: 'top' }}
        placeholder="Condition, features, accessories"
        value={form.description}
        onChangeText={(t)=>set('description', t)}
      />

      <FieldLabel>Category</FieldLabel>
      <Select
        placeholder={categoriesLoading && !categoryOptions.length ? 'Loading categories…' : 'Choose category'}
        value={selectedCategoryLabel}
        onPress={() => {
          if (categoriesLoading && !categoryOptions.length) return;
          setShowCat(true);
        }}
        disabled={categoriesLoading && !categoryOptions.length}
      />
      {(!categoriesLoading && !categoryOptions.length && !categoriesError) ? (
        <Text style={styles.helperText}>No categories available.</Text>
      ) : null}
      {categoriesError ? (
        <Text style={styles.helperError}>{categoriesError}</Text>
      ) : null}

      <FieldLabel>Condition</FieldLabel>
      <Select placeholder="Choose condition" value={form.condition} onPress={() => setShowCond(true)} />

      <FieldLabel>Quantity</FieldLabel>
      <Input
        placeholder="Total quantity"
        keyboardType="numeric"
        value={form.qty}
        onChangeText={(t)=>set('qty', t)}
      />

      {/* <FieldLabel>Product ID</FieldLabel>
      <Input placeholder="Product ID" value={form.productId} onChangeText={(t)=>set('productId', t)} /> */}
      {/* Dropdowns */}
      <PickerModal
        visible={showCat}
        title="Select Category"
        options={categoryOptions}
        loading={categoriesLoading}
        error={categoriesError}
        onClose={() => setShowCat(false)}
        onSelect={(opt) => {
          if (!opt) return;
          setMany({ category: opt.value, categoryLabel: opt.label });
          setShowCat(false);
        }}
      />
      <PickerModal
        visible={showCond}
        title="Select Condition"
        options={conditionOptions}
        onClose={() => setShowCond(false)}
        onSelect={(opt) => {
          if (!opt) return;
          set('condition', opt.value);
          setShowCond(false);
        }}
      />
    </KeyboardAwareScrollView>
  );
}

function FieldLabel({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Input({ style, multiline, onSubmitEditing, returnKeyType, ...rest }) {
  const handleSubmit = onSubmitEditing || (!multiline ? () => Keyboard.dismiss() : undefined);
  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={colors.textSecondary}
      style={[styles.input, style]}
      blurOnSubmit={!multiline}
      returnKeyType={returnKeyType || (multiline ? 'default' : 'done')}
      onSubmitEditing={handleSubmit}
    />
  );
}

function Select({ placeholder, value, onPress, disabled }) {
  const displayText = value || placeholder;
  const color = value ? colors.white : colors.textSecondary;
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.8}
      style={[styles.input, styles.select, disabled && styles.selectDisabled]}
      disabled={disabled}
    >
      <Text style={[styles.selectTxt, { color }]} numberOfLines={1}>
        {displayText}
      </Text>
      <ChevronDown size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

function PickerModal({ visible, title, options, onClose, onSelect, loading, error }) {
  const normalized = Array.isArray(options) ? options : [];
  const handleSelect = (opt) => {
    if (!opt) return;
    onSelect?.(opt);
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalBackdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          {loading ? (
            <View style={styles.modalLoadingRow}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.modalLoadingText}>Loading…</Text>
            </View>
          ) : error ? (
            <Text style={styles.modalError}>{error}</Text>
          ) : normalized.length ? (
            <ScrollView style={styles.optionScroll} contentContainerStyle={styles.optionList}>
              {normalized.map((opt) => (
                <TouchableOpacity
                  key={opt.key || String(opt.value || opt.label)}
                  style={styles.optionRow}
                  onPress={() => handleSelect(opt)}
                >
                  <Text style={styles.optionTxt}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.modalEmpty}>No options available.</Text>
          )}
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
  selectTxt: { fontWeight: '600', flex: 1, marginRight: 12 },
  selectDisabled: { opacity: 0.6 },
  helperText: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
  helperError: { color: '#FFB4B4', fontSize: 12, marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1E2128', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#343B49' },
  modalTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  optionScroll: { maxHeight: 320 },
  optionList: { paddingBottom: 6 },
  optionRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2B2F39' },
  optionTxt: { color: colors.white, fontWeight: '600' },
  modalLoadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  modalLoadingText: { color: colors.white, fontWeight: '600', marginLeft: 10 },
  modalError: { color: '#FFB4B4', fontWeight: '600', paddingVertical: 12 },
  modalEmpty: { color: colors.textSecondary, fontWeight: '600', paddingVertical: 12 },
});
