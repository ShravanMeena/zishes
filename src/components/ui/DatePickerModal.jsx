import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';

export default function DatePickerModal({ visible, value, onClose, onConfirm, min, max, title = 'Select Date' }) {
  const base = value ? new Date(value) : new Date();
  const [year, setYear] = useState(base.getFullYear());
  const [month, setMonth] = useState(base.getMonth());
  const [day, setDay] = useState(base.getDate());

  useEffect(() => {
    if (visible) {
      const d = value ? new Date(value) : new Date();
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setDay(d.getDate());
    }
  }, [visible, value]);

  const years = useMemo(() => {
    const cur = new Date().getFullYear();
    const start = (min ? new Date(min).getFullYear() : cur - 2);
    const end = (max ? new Date(max).getFullYear() : cur + 5);
    const arr = [];
    for (let y = start; y <= end; y++) arr.push(y);
    return arr;
  }, [min, max]);

  const months = useMemo(() => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], []);

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  useEffect(() => { if (day > daysInMonth) setDay(daysInMonth); }, [daysInMonth]);

  const confirm = () => {
    const selected = new Date(year, month, day);
    onConfirm?.(selected);
  };

  const Item = ({ label, selected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.item, selected && styles.itemSelected]}>
      <Text style={[styles.itemTxt, selected && styles.itemTxtSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.columns}>
            <ScrollView style={styles.col} contentContainerStyle={styles.colContent}>
              {months.map((m, i) => (
                <Item key={m} label={m} selected={i === month} onPress={() => setMonth(i)} />
              ))}
            </ScrollView>
            <ScrollView style={styles.col} contentContainerStyle={styles.colContent}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <Item key={d} label={d} selected={d === day} onPress={() => setDay(d)} />
              ))}
            </ScrollView>
            <ScrollView style={styles.col} contentContainerStyle={styles.colContent}>
              {years.map((y) => (
                <Item key={y} label={y} selected={y === year} onPress={() => setYear(y)} />
              ))}
            </ScrollView>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.primary]} onPress={confirm}><Text style={styles.btnTxt}>Set Date</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function formatDateYYYYMMDD(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E2128', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#343B49' },
  title: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  columns: { flexDirection: 'row', gap: 8 },
  col: { flex: 1, maxHeight: 240, borderWidth: 1, borderColor: '#343B49', borderRadius: 12 },
  colContent: { paddingVertical: 6 },
  item: { paddingVertical: 10, alignItems: 'center' },
  itemSelected: { backgroundColor: '#2B2F39' },
  itemTxt: { color: colors.white },
  itemTxtSelected: { color: colors.accent, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },
});

