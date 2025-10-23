import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, BackHandler, Alert, Platform } from "react-native";
import UnityView from "@azesmway/react-native-unity";
import GameResultModal from "../../components/GameResultModal";

export default function UnityScreen({ navigation, route }) {
  const debugLog = useCallback((...args) => {
    console.log("[UnityScreen]", ...args);
  }, []);

  const unityRef = useRef(null);
  const { scene, tournamentId, productId, onlyTutorial = false } = route.params ?? {};
  const [showUnity, setShowUnity] = useState(false);
  const [unityReady, setUnityReady] = useState(false);
  const [pendingScene, setPendingScene] = useState(scene || null);
  const [pendingOnlyTutorial, setPendingOnlyTutorial] = useState(!!onlyTutorial);
  const [sent, setSent] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [hasUnityMessage, setHasUnityMessage] = useState(false);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  useEffect(() => {
    debugLog("Route params updated", {
      scene,
      tournamentId,
      productId,
      onlyTutorial,
      platform: Platform.OS,
    });
    setPendingScene(scene || null);
    setPendingOnlyTutorial(!!onlyTutorial);
    setShowUnity(true);
    setSent(false);
    setShowResult(false);
    setResult(null);
    setHasUnityMessage(false);
    setFallbackTriggered(false);
  }, [scene, onlyTutorial, debugLog]);

  useEffect(() => {
    if (!showUnity) return;
    if (!pendingScene) return;
    if (hasUnityMessage) return;
    if (fallbackTriggered) return;
    const timer = setTimeout(() => {
      debugLog("No Unity messages within 4s, forcing openGame for current scene", {
        scene: pendingScene,
        onlyTutorial: pendingOnlyTutorial,
      });
      setUnityReady(true);
      setSent(false);
      setFallbackTriggered(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [
    showUnity,
    pendingScene,
    pendingOnlyTutorial,
    hasUnityMessage,
    fallbackTriggered,
    debugLog,
  ]);

  useEffect(() => {
    if (!showUnity) return;
    if (!unityReady) return;
    if (!pendingScene) return;
    if (sent) return;
    try {
      debugLog("Posting openGame to Unity", {
        scene: pendingScene,
        onlyTutorial: pendingOnlyTutorial,
        unityReady,
      });
      unityRef.current?.postMessage(
        "UnityMessageManager",
        "MessageFromRN",
        JSON.stringify({ action: "openGame", scene: pendingScene, onlyTutorial: pendingOnlyTutorial })
      );
      setSent(true);
      debugLog("openGame message dispatched");
    } catch (err) {
      console.warn("Failed to post openGame", err);
    }
  }, [showUnity, unityReady, pendingScene, pendingOnlyTutorial, sent, debugLog]);

  const closeUnity = useCallback((shouldNavigateBack = true) => {
    debugLog("Closing Unity view", { shouldNavigateBack });
    try { unityRef.current?.unloadUnity?.(); } catch {}
    setShowUnity(false);
    setPendingScene(null);
    setPendingOnlyTutorial(false);  
    setSent(false);
    if (shouldNavigateBack) {
      debugLog("Navigating back from Unity screen");
      navigation.goBack();
    }
  }, [debugLog, navigation]);

  useEffect(() => {
    debugLog("Registering hardware back handler");
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      debugLog("Hardware back press received");
      closeUnity();
      return true;
    });
    return () => sub.remove();
  }, [debugLog, closeUnity]);

  const openResult = (payload) => {
    debugLog("Opening result modal with payload", payload);
    try { unityRef.current?.unloadUnity?.(); } catch {}
    setShowUnity(false);
    setSent(false);
    setResult(payload || {});
    setShowResult(true);
  };

  const routeOnlyTutorial = route?.params?.onlyTutorial;

  const dismissResult = useCallback((thenClose = false) => {
    debugLog("Dismissing result modal", { thenClose });
    setShowResult(false);
    if (thenClose) {
      // small delay to let the modal play its exit animation
      setTimeout(() => closeUnity(), 240);
    } else {
      setPendingScene(scene || pendingScene);
      setPendingOnlyTutorial(!!(routeOnlyTutorial ?? pendingOnlyTutorial));
      setShowUnity(true);
      setSent(false);
    }
  }, [closeUnity, scene, pendingScene, pendingOnlyTutorial, routeOnlyTutorial, debugLog]);

  const goToTournaments = useCallback(() => {
    setShowResult(false);
    closeUnity(false);
    navigation.goBack?.();
    const params = { screen: 'TournamentsWon', params: { forceRefreshKey: `unity-${Date.now()}` } };
    const parent = navigation.getParent?.();
    setTimeout(() => {
      if (parent?.navigate) {
        parent.navigate('Profile', params);
      } else {
        navigation.navigate('Profile', params);
      }
    }, 50);
  }, [closeUnity, navigation]);

  const score = typeof result?.score === "number" ? result.score : Number(result?.score) || 0;
  const title =
    score >= 90
      ? "Legendary!"
      : score >= 70
      ? "Amazing!"
      : score >= 50
      ? "Great Job!"
      : score > 0
      ? "Nice Try!"
      : "All Done!";

  return (
    <View style={{ flex:1, backgroundColor:"#000" }}>
      {showUnity ? (
        <UnityView
          ref={unityRef}
          style={{ flex:1 }}
          fullScreen
          androidKeepPlayerMounted={false}
          onUnityMessage={(e) => {
            const rawMessage = e?.nativeEvent?.message;
            debugLog("Received message from Unity", rawMessage);
            try {
              const msg =
                typeof rawMessage === "string" && rawMessage.trim().length
                  ? JSON.parse(rawMessage)
                  : rawMessage;

              setHasUnityMessage(true);

              if (msg.action === "unityReady" || msg.action.unityReady === "unityReady") {
                debugLog("Unity reported ready");
                setUnityReady(true);
                setSent(false);
              }
              if (msg.action === "Data") {
                debugLog("Unity sent game result data", msg);
                if (msg.scene) {
                  openResult(msg);
                }
              }
              if (msg.action === "closeUnity") {
                debugLog("Unity requested close");
                closeUnity();
              }
            } catch (error) {
              console.warn("Failed to parse unity message", rawMessage, error);
            }
          }}
        />
      ) : null}

      <GameResultModal
        visible={showResult}
        result={result}
        scene={scene}
        tournamentId={tournamentId}
        onRequestClose={() => dismissResult(true)}
        onBack={() => dismissResult(true)}
        onViewTournaments={goToTournaments}
      />
    </View>
  );
}
