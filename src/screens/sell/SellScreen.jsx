import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { Bell } from 'lucide-react-native';
import ProgressBar from '../../components/common/ProgressBar';
import Button from '../../components/ui/Button';
import BottomSheet from '../../components/common/BottomSheet';
import SaveDraftModal from '../../components/modals/SaveDraftModal';
// import CongratsModal from '../../components/modals/CongratsModal';
import SubmissionModal from '../../components/modals/SubmissionModal';
import { useDispatch, useSelector } from 'react-redux';
import { clearSubmitState, resetDraft, loadFromDraft, saveCurrentAsNewDraft, setPendingLeaveRoute, clearDraftStorage } from '../../store/listingDraft/listingDraftSlice';
import { publishListing } from '../../store/listingDraft/listingDraftSlice';
import { BackHandler } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import PhotosStep from './steps/PhotosStep';
import DetailsStep from './steps/DetailsStep';
import PlayToWinStep from './steps/PlayToWinStep';
import DeliveryStep from './steps/DeliveryStep';
import PoliciesStep from './steps/PoliciesStep';
import ReviewStep from './steps/ReviewStep';
import { TabView, SceneMap } from 'react-native-tab-view';
import PagerView from 'react-native-pager-view';

export default function SellScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomNavOffset = 10;
  const bottomBarPadding = 0
  const isFocused = useIsFocused();
  const loaded = useSelector((s) => s.listingDraft.loaded);
  const isDirty = useSelector((s) => s.listingDraft.isDirty);
  const submitting = useSelector((s) => s.listingDraft.submitting);
  const submitStage = useSelector((s) => s.listingDraft.submitStage);
  const submitProgress = useSelector((s) => s.listingDraft.submitProgress);
  const submitError = useSelector((s) => s.listingDraft.submitError);
  const pendingLeaveToRoute = useSelector((s) => s.listingDraft.ui.pendingLeaveToRoute);
  const details = useSelector((s) => s.listingDraft.details);
  const policies = useSelector((s) => s.listingDraft.policies);
  const delivery = useSelector((s) => s.listingDraft.delivery);
  const draftOriginCountry = useSelector((s) => s.listingDraft.originCountry);
  const userCountry = useSelector((s) => s.auth?.user?.address?.country || s.app?.country || null);

  const steps = useMemo(
    () => [
      { key: 'photos', title: 'Photos' },
      { key: 'details', title: 'Details' },
      { key: 'play', title: 'Play-to-Win' },
      { key: 'delivery', title: 'Delivery' },
      { key: 'policies', title: 'Policies' },
      { key: 'review', title: 'Review & Publish' },
    ],
    []
  );

  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [draftOpen, setDraftOpen] = useState(false);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [forceAskName, setForceAskName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [leaveAfterAction, setLeaveAfterAction] = useState(null); // route name to leave to
  // const [congratsOpen, setCongratsOpen] = useState(false);
  const [hideSubmitModal, setHideSubmitModal] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const policiesAccepted = useMemo(
    () => !!(policies?.listing && policies?.dispute && policies?.antifraud && policies?.agreeAll),
    [policies]
  );
  const routes = steps;
  const progress = (index + 1) / steps.length;
  const listingExtensionAck = !!policies?.listingExtensionAck;
  const ensurePoliciesAccepted = useCallback(() => {
    if (policiesAccepted) return true;
    setDialog({
      title: 'Accept Required Policies',
      message: 'Please agree to all required policy checkboxes before continuing.',
      primary: { label: 'OK' },
    });
    return false;
  }, [policiesAccepted]);

  const deliverySelected = useMemo(() => {
    const method = (delivery?.method || '').trim();
    return method.length > 0;
  }, [delivery?.method]);

  const ensureDeliverySelected = useCallback(() => {
    if (deliverySelected) return true;
    setDialog({
      title: 'Delivery Required',
      message: 'Please choose a delivery option or add pickup details before continuing.',
      primary: { label: 'OK' },
    });
    return false;
  }, [deliverySelected]);

  const attemptSetIndex = useCallback((nextIndex) => {
    if (nextIndex === index) return;
    const movingForward = nextIndex > index;
    const currentKey = routes[index]?.key;
    if (movingForward && currentKey === 'policies' && !ensurePoliciesAccepted()) {
      return;
    }
    if (movingForward && currentKey === 'delivery' && !ensureDeliverySelected()) {
      return;
    }
    if (movingForward && currentKey === 'play' && !listingExtensionAck) {
      setDialog({
        title: 'Acknowledge Listing Limit',
        message: 'Please confirm you understand the listing can only be extended once before continuing.',
        primary: { label: 'OK' },
      });
      return;
    }
    if (nextIndex >= 0 && nextIndex < routes.length) {
      setIndex(nextIndex);
    }
  }, [index, routes, ensurePoliciesAccepted, ensureDeliverySelected, listingExtensionAck]);

  const goNext = useCallback(() => {
    if (index < routes.length - 1) {
      attemptSetIndex(index + 1);
    }
  }, [attemptSetIndex, index, routes]);

  const goTo = useCallback((key) => {
    const i = routes.findIndex((r) => r.key === key);
    if (i >= 0) {
      attemptSetIndex(i);
    }
  }, [routes, attemptSetIndex]);

  const activeKey = routes[index]?.key;
  const title = useMemo(() => {
    switch (activeKey) {
      case 'photos':
        return 'Create Listing · Photos';
      case 'details':
        return 'Create Listing · Details';
      case 'play':
        return 'Create Listing · Play-to-Win';
      case 'delivery':
        return 'Create Listing · Delivery';
      case 'policies':
        return 'Create Listing · Policies';
      case 'review':
        return "Let's Zish It";
      default:
        return 'Create Listing';
    }
  }, [activeKey]);
  const isReview = activeKey === 'review';

  const onPrimary = async () => {
    if (isReview) {
      if (submitting) return;
      try {
        await dispatch(publishListing()).unwrap();
      } catch (err) {
        const message = typeof err === 'string' ? err : err?.message || 'Please review your listing and try again.';

        const lower = message.toLowerCase();
        if (lower.includes('photo')) goTo('photos');
        else if (lower.includes('description') || lower.includes('name') || lower.includes('quantity')) goTo('details');
        else if (lower.includes('gameplay') || lower.includes('end date') || lower.includes('game') || lower.includes('price per')) goTo('play');
        else if (lower.includes('delivery') || lower.includes('pickup')) goTo('delivery');
        else if (lower.includes('terms')) goTo('policies');

        setDialog({
          title: 'Cannot publish yet',
          message,
          primary: { label: 'OK' },
        });
      }
    } else {
      if (routes[index]?.key === 'policies' && !ensurePoliciesAccepted()) return;
      goNext();
    }
  };

  const closeDialog = useCallback(() => setDialog(null), []);

  const initializedRef = useRef(false);
  const loadedDraftRef = useRef(null);
  const loadedDraftKeyRef = useRef(null);

  // Initialize: reset by default; prefill only if draftData is provided.
  useEffect(() => {
    const draftData = route?.params?.draftData;
    if (draftData) {
      const draftKey =
        route?.params?.draftId ??
        route?.params?.editingProductId ??
        draftData?.id ??
        draftData?.draftId ??
        draftData?.details?.productId ??
        null;
      const alreadyLoaded =
        loadedDraftRef.current === draftData ||
        (draftKey != null && loadedDraftKeyRef.current === draftKey);
      if (!alreadyLoaded) {
        dispatch(loadFromDraft(draftData));
        loadedDraftRef.current = draftData;
        loadedDraftKeyRef.current = draftKey;
        initializedRef.current = true;
      } else {
        loadedDraftRef.current = draftData;
        loadedDraftKeyRef.current = draftKey;
      }
      return;
    }

    loadedDraftRef.current = null;
    loadedDraftKeyRef.current = null;

    if (!userCountry) {
      if (!initializedRef.current) {
        dispatch(resetDraft());
        initializedRef.current = true;
      }
      return;
    }

    if (!initializedRef.current || draftOriginCountry !== userCountry) {
      if (draftOriginCountry && draftOriginCountry !== userCountry) {
        dispatch(clearDraftStorage(userCountry));
      }
      dispatch(resetDraft({ originCountry: userCountry }));
      initializedRef.current = true;
    }
  }, [dispatch, route?.params?.draftData, userCountry, draftOriginCountry]);

  // Intercept Android back to prompt save if there are unsaved changes
  useEffect(() => {
    const onBack = () => {
      if (isDirty) {
        setLeaveAfterAction('BACK');
        setForceAskName(!details?.name);
        setNameInput(details?.name || '');
        setSavePromptOpen(true);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [isDirty, dispatch, navigation, details?.name]);

  // If tab bar requested leave to a route
  useEffect(() => {
    if (!isFocused) return;
    if (pendingLeaveToRoute) {
      setLeaveAfterAction(pendingLeaveToRoute);
      setForceAskName(!details?.name);
      setNameInput(details?.name || '');
      setSavePromptOpen(true);
    }
  }, [pendingLeaveToRoute, details?.name, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      setSavePromptOpen(false);
    }
  }, [isFocused]);

  const closeSavePrompt = useCallback(() => {
    setSavePromptOpen(false);
    dispatch(setPendingLeaveRoute(null));
  }, [dispatch]);

  const handleAfterLeave = useCallback((target) => {
    if (!target) return;
    if (target === 'BACK') navigation.goBack();
    else navigation.navigate(target);
    dispatch(setPendingLeaveRoute(null));
    setLeaveAfterAction(null);
  }, [dispatch, navigation]);

  const resetListingForm = useCallback(() => {
    dispatch(resetDraft({ originCountry: userCountry }));
    setIndex(0);
    setForceAskName(false);
    setNameInput('');
  }, [dispatch, userCountry]);

  const handleDiscard = useCallback(async () => {
    closeSavePrompt();
    try {
      await dispatch(clearDraftStorage(userCountry)).unwrap();
    } catch (_) {
      // Ignore storage errors; reset state regardless so UI clears.
    }
    dispatch(resetDraft({ originCountry: userCountry }));
    handleAfterLeave(leaveAfterAction || 'BACK');
  }, [dispatch, leaveAfterAction, handleAfterLeave, userCountry, closeSavePrompt]);

  const handleSaveDraft = useCallback(async () => {
    const name = forceAskName ? (nameInput || '').trim() : (details?.name || '').trim();
    if (!name) {
      if (!forceAskName) setForceAskName(true);
      return;
    }
    try {
      await dispatch(saveCurrentAsNewDraft({ name })).unwrap();
      const nextTarget = leaveAfterAction || 'BACK';
      resetListingForm();
      closeSavePrompt();
      handleAfterLeave(nextTarget);
    } catch (_) {
      // ignore errors, keep modal open for retry
    }
  }, [dispatch, forceAskName, nameInput, details?.name, closeSavePrompt, handleAfterLeave, leaveAfterAction, resetListingForm]);

  // Ensure result modal shows even if user hid while submitting
  useEffect(() => {
    if (submitStage === 'success' || submitStage === 'error') {
      setHideSubmitModal(false);
    }
  }, [submitStage]);

  // When a new submission starts, ensure the modal is shown again
  useEffect(() => {
    if (submitting) setHideSubmitModal(false);
  }, [submitting]);

  // Track keyboard visibility to adjust TabView behavior
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Stable scenes: memoize SceneMap so scenes don't remount on every keystroke
  const renderScene = useMemo(() => {
    const PhotosRoute = () => (
      <View style={{ flex: 1 }}>
        <PhotosStep />
      </View>
    );
    const DetailsRoute = () => (
      <View style={{ flex: 1 }}>
        <DetailsStep />
      </View>
    );
    const PlayRoute = () => (
      <View style={{ flex: 1 }}>
        <PlayToWinStep />
      </View>
    );
    const DeliveryRoute = () => (
      <View style={{ flex: 1 }}>
        <DeliveryStep />
      </View>
    );
    const PoliciesRoute = () => (
      <View style={{ flex: 1 }}>
        <PoliciesStep />
      </View>
    );
    const ReviewRoute = () => (
      <View style={{ flex: 1 }}>
        <ReviewStep onEdit={goTo} />
      </View>
    );
    return SceneMap({
      photos: PhotosRoute,
      details: DetailsRoute,
      play: PlayRoute,
      delivery: DeliveryRoute,
      policies: PoliciesRoute,
      review: ReviewRoute,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Notifications' })}>
          <Bell size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabChipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {routes.map((route, idx) => {
            const focused = index === idx;
            return (
              <TouchableOpacity
                key={route.key}
                style={[styles.tabChip, focused && styles.tabChipActive]}
                onPress={() => attemptSetIndex(idx)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabChipText, focused && styles.tabChipTextActive]}>{route.title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tabs using react-native-tab-view */}
      <TabView
        navigationState={{ index, routes }}
        onIndexChange={attemptSetIndex}
        initialLayout={{ width }}
        swipeEnabled={!keyboardOpen}
        renderPager={(pagerProps) => (
          <PagerView {...pagerProps} keyboardDismissMode="none" />
        )}
        renderScene={renderScene}
        renderTabBar={() => null}
      />

      {/* Progress under tabs */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <ProgressBar value={progress} height={8} />
      </View>

      {/* Bottom actions mimic screenshot */}
      <View style={[styles.bottomBar, { bottom: bottomNavOffset, paddingBottom: bottomBarPadding }]}>
        <Button
          title="Save Draft"
          variant="outline"
          onPress={async () => {
            const needsName = !details?.name;
            if (needsName) {
              setForceAskName(true);
              setNameInput('');
              setLeaveAfterAction(null);
              setSavePromptOpen(true);
            } else {
              try {
                await dispatch(saveCurrentAsNewDraft({ name: details.name })).unwrap();
                resetListingForm();
                setDraftOpen(true);
              } catch (_) {
                // noop
              }
            }
          }}
          style={{ flex: 1, marginRight: 10 }}
        />
        <Button title={isReview ? "Let's Zish It !!" : 'Next'} onPress={onPrimary} style={{ flex: 1 }} disabled={submitting} />
      </View>

      <SaveDraftModal
        visible={draftOpen}
        variant="success"
        onClose={() => setDraftOpen(false)}
        successTitle="Saved as Draft"
        successSubtitle="Your listing has been saved. You can return and finish anytime."
        successPrimaryLabel="Keep Editing"
        successSecondaryLabel="Go to Drafts"
        onSuccessPrimary={() => setDraftOpen(false)}
        onSuccessSecondary={() => {
          setDraftOpen(false);
          navigation.navigate('Profile', { screen: 'Drafts' });
        }}
      />

      {/* Submission modal with progress + success/error states */}
      <SubmissionModal
        visible={!hideSubmitModal && (submitting || submitStage === 'success' || submitStage === 'error')}
        stage={submitStage}
        progress={submitProgress}
        error={submitError}
        onClose={() => { setHideSubmitModal(true); }}
        onPrimary={() => {
          if (submitStage === 'success') {
            setHideSubmitModal(true);
            try { dispatch(clearSubmitState()); } catch {}
            const tabsNav = navigation.getParent?.();
            const params = { screen: 'MyListings', params: { forceRefresh: Date.now() } };
            if (tabsNav?.navigate) {
              tabsNav.navigate('Profile', params);
            } else {
              navigation.navigate('Profile', params);
            }
          } else if (submitStage === 'error') {
            onPrimary(); // retry
          }
        }}
        primaryText={submitStage === 'success' ? 'Go to My Listings' : undefined}
      />

      <BottomSheet visible={!!dialog} onClose={closeDialog} full={false}>
        <View style={{ padding: 8 }}>
          <Text style={styles.dialogTitle}>{dialog?.title || ''}</Text>
          <Text style={styles.dialogMessage}>{dialog?.message || ''}</Text>
          <View style={{ flexDirection: dialog?.secondary ? 'row' : 'column', marginTop: 18, gap: 12 }}>
            {dialog?.secondary ? (
              <Button
                title={dialog.secondary.label || 'Cancel'}
                variant="outline"
                fullWidth={false}
                onPress={() => {
                  closeDialog();
                  dialog?.secondary?.action?.();
                }}
                style={{ flex: 1 }}
              />
            ) : null}
            <Button
              title={dialog?.primary?.label || 'OK'}
              fullWidth={false}
              onPress={() => {
                closeDialog();
                dialog?.primary?.action?.();
              }}
              style={{ flex: dialog?.secondary ? 1 : undefined }}
            />
          </View>
        </View>
      </BottomSheet>

      {/* Save/Leave Prompt */}
      <SaveDraftModal
        visible={isFocused && savePromptOpen}
        requireName={forceAskName}
        nameValue={nameInput}
        onChangeName={setNameInput}
        onClose={closeSavePrompt}
        onDiscard={handleDiscard}
        onSave={handleSaveDraft}
        onHome={() => {
          closeSavePrompt();
          handleAfterLeave('Home');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  tabChipsWrapper: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  tabScroll: {
    paddingRight: 20,
    alignItems: 'center',
  },
  tabChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#1E2128',
    borderWidth: 1,
    borderColor: '#343B49',
    marginRight: 8,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tabChipText: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  tabChipTextActive: { color: colors.white },
  dialogTitle: { color: colors.white, fontWeight: '900', fontSize: 18, textAlign: 'center' },
  dialogMessage: { color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#22252C' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 12, backgroundColor: colors.black, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#22252C', flexDirection: 'row' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderTxt: { color: colors.textSecondary },
});
