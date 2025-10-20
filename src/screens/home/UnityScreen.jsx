import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, BackHandler } from "react-native";
import UnityView from "@azesmway/react-native-unity";
import GameResultModal from "../../components/GameResultModal";

export default function UnityScreen({ navigation, route }) {
  const unityRef = useRef(null);
  const { scene, tournamentId, productId, onlyTutorial = false } = route.params ?? {};
  const [showUnity, setShowUnity] = useState(false);
  const [unityReady, setUnityReady] = useState(false);
  const [pendingScene, setPendingScene] = useState(scene || null);
  const [pendingOnlyTutorial, setPendingOnlyTutorial] = useState(!!onlyTutorial);
  const [sent, setSent] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setPendingScene(scene || null);
    setPendingOnlyTutorial(!!onlyTutorial);
    setShowUnity(true);
    setSent(false);
    setShowResult(false);
    setResult(null);
  }, [scene, onlyTutorial]);

  useEffect(() => {
    if (!showUnity) return;
    if (!unityReady) return;
    if (!pendingScene) return;
    if (sent) return;
    try {
       unityRef.current?.postMessage(
        "UnityMessageManager",
        "MessageFromRN",
        JSON.stringify({ action: "openGame", scene: pendingScene, onlyTutorial: pendingOnlyTutorial })
      );
      setSent(true);
    } catch (err) {
      console.warn("Failed to post openGame", err);
    }
  }, [showUnity, unityReady, pendingScene, pendingOnlyTutorial, sent]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeUnity();
      return true;
    });
    return () => sub.remove();
  }, []);

  const closeUnity = (shouldNavigateBack = true) => {
    try { unityRef.current?.unloadUnity?.(); } catch {}
    setShowUnity(false);
    setPendingScene(null);
    setPendingOnlyTutorial(false);  
    setSent(false);
    if (shouldNavigateBack) {
      navigation.goBack();
    }
  };

  const openResult = (payload) => {
    try { unityRef.current?.unloadUnity?.(); } catch {}
    setShowUnity(false);
    setSent(false);
    setResult(payload || {});
    setShowResult(true);
  };

  const routeOnlyTutorial = route?.params?.onlyTutorial;

  const dismissResult = useCallback((thenClose = false) => {
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
  }, [closeUnity, scene, pendingScene, pendingOnlyTutorial, routeOnlyTutorial]);

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
            console.log(rawMessage, "unityRawMessage");
            try {
              const msg =
                typeof rawMessage === "string" && rawMessage.trim().length
                  ? JSON.parse(rawMessage)
                  : rawMessage;

              if (msg.action === "unityReady" || msg.action.unityReady === "unityReady") {
                setUnityReady(true);
                setSent(false);
              }
              if (msg.action === "Data") {
                if (msg.scene) {
                  openResult(msg);
                }
              }
              if (msg.action === "closeUnity") {
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
