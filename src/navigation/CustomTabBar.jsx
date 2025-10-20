import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User, CreditCard, Heart, ShoppingBag } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useSelector, useDispatch } from 'react-redux';
import { setPendingLeaveRoute } from '../store/listingDraft/listingDraftSlice';
import { StackActions } from '@react-navigation/native';

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const isDirty = useSelector((s) => s.listingDraft.isDirty);
  const dispatch = useDispatch();
  const lastTapRef = useRef({});
  const DOUBLE_TAP_DELAY = 320;
  const ROOT_SCREENS = useMemo(() => ({
    Home: 'HomeIndex',
    Wallet: 'WalletHome',
    Profile: 'ProfileHome',
  }), []);

  // Respect per-screen request to hide tab bar (e.g., Unity)
  const shouldHide = useMemo(() => {
    const focusedOptions = descriptors[state.routes[state.index].key]?.options || {};
    const style = focusedOptions.tabBarStyle || {};
    return style.display === 'none';
  }, [descriptors, state]);

  const anims = useRef(state.routes.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.spring(a, {
        toValue: i === state.index ? 1 : 0,
        useNativeDriver: true,
        friction: 6,
        tension: 120,
      }).start();
    });
  }, [state.index, anims]);

  if (shouldHide) return null;

  const height = 58 + insets.bottom;

  const resetTabToRoot = (route) => {
    const descriptorNav = descriptors[route.key]?.navigation;
    const rootScreen = ROOT_SCREENS[route.name] || null;
    try {
      descriptorNav?.dispatch?.(StackActions.popToTop());
    } catch (_) {}
    if (rootScreen) {
      navigation.navigate(route.name, {
        screen: rootScreen,
        params: { __tabReset: Date.now() },
      });
    } else {
      navigation.navigate(route.name);
    }
  };

  const onPress = (route, isFocused) => {
    const currentRoute = state.routes[state.index];
    // If leaving Sell with unsaved changes, prompt there and block navigation
    if (currentRoute?.name === 'Sell' && route.name !== 'Sell' && isDirty) {
      const evt = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!evt.defaultPrevented) {
        // prevent switch and ask Sell screen to show save modal and then navigate
        dispatch(setPendingLeaveRoute(route.name));
      }
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current[route.key] || 0;
    const isDoubleTap = isFocused && now - lastTap < DOUBLE_TAP_DELAY;
    lastTapRef.current[route.key] = now;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
      data: { isDoubleTap },
    });
    if (event.defaultPrevented) return;

    if (isDoubleTap) {
      resetTabToRoot(route);
      return;
    }

    if (!isFocused) navigation.navigate(route.name);
  };

  const renderIcon = (name, color, size = 22) => {
    switch (name) {
      case 'Home': return <Home color={color} size={size} />;
      case 'Wallet': return <CreditCard color={color} size={size} />;
      case 'Favorites': return <Heart color={color} size={size} />;
      case 'Profile': return <User color={color} size={size} />;
      default: return null;
    }
  };

  return (
    <View style={[styles.wrap, { height, paddingBottom: insets.bottom }]}> 
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const a = anims[index];
        const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
        const color = isFocused ? colors.accent : colors.textSecondary;

        if (route.name === 'Sell') {
          const sellScale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
          return (
            <View key={route.key} style={styles.sellSlot}>
              <Animated.View style={{ transform: [{ scale: sellScale }] }}>
                <TouchableOpacity accessibilityRole="button" onPress={() => onPress(route, isFocused)} activeOpacity={0.9}>
                  <LinearGradient
                    colors={[colors.primary, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sellCircle}
                  >
                    <Text style={styles.sellText}>SELL</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            onPress={() => onPress(route, isFocused)}
            style={styles.tab}
            activeOpacity={0.85}
          >
            <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
              {renderIcon(route.name, color)}
              <Text style={[styles.label, { color }]}>{route.name}</Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.black,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#22252C',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 58 },
  label: { marginTop: 4, fontSize: 12, fontWeight: Platform.OS === 'ios' ? '600' : '700' },
  sellSlot: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  sellCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sellText: { color: colors.white, fontWeight: '900', letterSpacing: 1 },
});
