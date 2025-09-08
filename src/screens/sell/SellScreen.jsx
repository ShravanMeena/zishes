import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { Bell } from 'lucide-react-native';
import ProgressBar from '../../components/common/ProgressBar';
import Button from '../../components/ui/Button';
import BottomSheet from '../../components/common/BottomSheet';
// import CongratsModal from '../../components/modals/CongratsModal';
import SubmissionModal from '../../components/modals/SubmissionModal';
import { CheckCircle2 } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loadDraft, saveDraftFromStore, clearSubmitState, resetDraft, loadFromDraft, saveCurrentAsNewDraft, setPendingLeaveRoute } from '../../store/listingDraft/listingDraftSlice';
import { publishListing } from '../../store/listingDraft/listingDraftSlice';
import { BackHandler, Alert } from 'react-native';

import PhotosStep from './steps/PhotosStep';
import DetailsStep from './steps/DetailsStep';
import PlayToWinStep from './steps/PlayToWinStep';
import DeliveryStep from './steps/DeliveryStep';
import PoliciesStep from './steps/PoliciesStep';
import ReviewStep from './steps/ReviewStep';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import PagerView from 'react-native-pager-view';

export default function SellScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const loaded = useSelector((s) => s.listingDraft.loaded);
  const isDirty = useSelector((s) => s.listingDraft.isDirty);
  const submitting = useSelector((s) => s.listingDraft.submitting);
  const submitStage = useSelector((s) => s.listingDraft.submitStage);
  const submitProgress = useSelector((s) => s.listingDraft.submitProgress);
  const submitError = useSelector((s) => s.listingDraft.submitError);
  const pendingLeaveToRoute = useSelector((s) => s.listingDraft.ui.pendingLeaveToRoute);
  const details = useSelector((s) => s.listingDraft.details);

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
  const routes = steps;
  const progress = (index + 1) / steps.length;

  const goNext = () => { if (index < routes.length - 1) setIndex(index + 1); };
  const goTo = (key) => {
    const i = routes.findIndex((r) => r.key === key);
    if (i >= 0) setIndex(i);
  };

  const activeKey = routes[index]?.key;
  const title = activeKey === 'details' ? 'Sell Item - Step 2: Details' : 'Create Listing';
  const isReview = activeKey === 'review';

  const onPrimary = async () => {
    if (isReview) {
      if (submitting) return;
      try { await dispatch(publishListing()).unwrap(); }
      catch (_) { /* handled via modal state */ }
    } else {
      goNext();
    }
  };

  // Initialize: reset by default; prefill only if draftData is provided
  useEffect(() => {
    const draftData = route?.params?.draftData;
    if (draftData) {
      dispatch(loadFromDraft(draftData));
    } else {
      dispatch(resetDraft());
    }
  }, [route?.params?.draftData, dispatch]);

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
    if (pendingLeaveToRoute) {
      setLeaveAfterAction(pendingLeaveToRoute);
      setForceAskName(!details?.name);
      setNameInput(details?.name || '');
      setSavePromptOpen(true);
    }
  }, [pendingLeaveToRoute, details?.name]);

  const handleAfterLeave = (target) => {
    if (!target) return;
    if (target === 'BACK') navigation.goBack();
    else navigation.navigate(target);
    dispatch(setPendingLeaveRoute(null));
    setLeaveAfterAction(null);
  };

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

      {/* Tabs using react-native-tab-view */}
      <TabView
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        swipeEnabled={!keyboardOpen}
        renderPager={(pagerProps) => (
          <PagerView {...pagerProps} keyboardDismissMode="none" />
        )}
        renderScene={renderScene}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled
            style={{ backgroundColor: 'transparent' }}
            contentContainerStyle={styles.tabsRow}
            // No active bottom border/indicator as requested
            indicatorStyle={{ backgroundColor: 'transparent', height: 0 }}
            tabStyle={{ width: 'auto' }}
            renderLabel={({ route, focused }) => (
              <Text style={[styles.tabTxt, focused && styles.tabTxtActive]}>{route.title}</Text>
            )}
          />
        )}
      />

      {/* Progress under tabs */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <ProgressBar value={progress} height={8} />
      </View>

      {/* Bottom actions mimic screenshot */}
      <View style={styles.bottomBar}>
        <Button
          title="Save Draft"
          variant="outline"
          onPress={() => {
            const needsName = !details?.name;
            if (needsName) {
              setForceAskName(true);
              setNameInput('');
              setLeaveAfterAction(null);
              setSavePromptOpen(true);
            } else {
              dispatch(saveCurrentAsNewDraft({ name: details.name }))
                .unwrap()
                .then(() => setDraftOpen(true))
                .catch(() => {});
            }
          }}
          style={{ flex: 1, marginRight: 10 }}
        />
        <Button title={isReview ? "Let's Zish It !!" : 'Next'} onPress={onPrimary} style={{ flex: 1 }} disabled={submitting} />
      </View>

      {/* Save Draft sheet (themed, not default alert) */}
      <BottomSheet visible={draftOpen} onClose={() => setDraftOpen(false)} full={false}>
        <View style={{ alignItems: 'center', padding: 8 }}>
          <CheckCircle2 size={36} color={colors.accent} />
          <Text style={{ color: colors.white, fontWeight: '800', fontSize: 18, marginTop: 8 }}>Saved as Draft</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
            Your listing has been saved. You can return and finish anytime.
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            <Button title="Keep Editing" variant="outline" onPress={() => setDraftOpen(false)} fullWidth={false} style={{ flex: 1, marginRight: 8 }} />
            <Button title="Go to Drafts" onPress={() => { setDraftOpen(false); navigation.navigate('Profile', { screen: 'Drafts' }); }} fullWidth={false} style={{ flex: 1 }} />
          </View>
        </View>
      </BottomSheet>

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
            navigation.navigate('Profile', { screen: 'MyListings' });
          } else if (submitStage === 'error') {
            onPrimary(); // retry
          }
        }}
        primaryText={submitStage === 'success' ? 'Go to My Listings' : undefined}
      />

      {/* Save/Leave Prompt */}
      <BottomSheet visible={savePromptOpen} onClose={() => { setSavePromptOpen(false); dispatch(setPendingLeaveRoute(null)); }} full={false}>
        <View style={{ padding: 4 }}>
          <Text style={{ color: colors.white, fontWeight: '800', fontSize: 18, textAlign: 'center' }}>Save your progress?</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
            You have unsaved changes. Save as a draft or discard.
          </Text>
          {forceAskName ? (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: colors.white, fontWeight: '700', marginBottom: 6 }}>Item Name (required)</Text>
              <TextInput
                placeholder="Enter item name"
                placeholderTextColor={colors.textSecondary}
                style={{ backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, color: colors.white }}
                value={nameInput}
                onChangeText={setNameInput}
                // Do not autoFocus to avoid immediate keyboard overlay on open
              />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            <Button
              title="Discard"
              variant="outline"
              onPress={() => { setSavePromptOpen(false); handleAfterLeave(leaveAfterAction); }}
              fullWidth={false}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Save & Continue"
              onPress={async () => {
                const name = forceAskName ? (nameInput || '').trim() : (details?.name || '').trim();
                if (!name) return; // keep the modal open until name provided
                try {
                  await dispatch(saveCurrentAsNewDraft({ name })).unwrap();
                  setSavePromptOpen(false);
                  handleAfterLeave(leaveAfterAction);
                } catch (_) { /* ignore */ }
              }}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 6, gap: 12, alignItems: 'center' },
  tabItem: { paddingVertical: 6, paddingHorizontal: 6 },
  tabTxt: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  tabTxtActive: { color: colors.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#22252C' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 12, backgroundColor: colors.black, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#22252C', flexDirection: 'row' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderTxt: { color: colors.textSecondary },
});
