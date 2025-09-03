import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const Heading = ({ children, style }) => (
  <Text style={[styles.h1, style]}>{children}</Text>
);

export const Subheading = ({ children, style }) => (
  <Text style={[styles.h2, style]}>{children}</Text>
);

export const Body = ({ children, style }) => (
  <Text style={[styles.body, style]}>{children}</Text>
);

export const Caption = ({ children, style }) => (
  <Text style={[styles.caption, style]}>{children}</Text>
);

export const LinkText = ({ children, style }) => (
  <Text style={[styles.link, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  h1: { color: colors.white, fontSize: 22, fontWeight: '800' },
  h2: { color: colors.white, fontSize: 18, fontWeight: '700' },
  body: { color: colors.white, fontSize: 14 },
  caption: { color: colors.textSecondary, fontSize: 12 },
  link: { color: colors.accent, fontWeight: '700' },
});

export default { Heading, Subheading, Body, Caption, LinkText };

