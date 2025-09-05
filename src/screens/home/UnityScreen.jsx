import React, { useRef, useEffect, useState } from "react";
import { View, BackHandler } from "react-native";
import UnityView from "@azesmway/react-native-unity";
import GameResultModal from "../../components/GameResultModal";

export default function UnityScreen({ navigation, route }) {
  const unityRef = useRef(null);
  const { scene, tournamentId, productId } = route.params;
  const [unityReady, setUnityReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if ( scene && unityRef.current && !sent) {
      unityRef.current.postMessage(
        "UnityMessageManager",
        "MessageFromRN",
        JSON.stringify({ action: "openGame", scene })
      );
      setSent(true);
    }
  }, [scene, sent]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeUnity();
      return true;
    });
    return () => sub.remove();
  }, []);

  const closeUnity = () => {
    unityRef.current?.unloadUnity?.();
    navigation.goBack();
  };

  const openResult = (payload) => {
    setResult(payload || {});
    setShowResult(true);
  };

  const dismissResult = (thenClose = false) => {
    setShowResult(false);
    if (thenClose) {
      // small delay to let the modal play its exit animation
      setTimeout(() => closeUnity(), 240);
    }
  };

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
      <UnityView
        ref={unityRef}
        style={{ flex:1 }}
        fullScreen
        androidKeepPlayerMounted={false}
        onUnityMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.message || "{}");
            console.log(msg)
            if (msg.action === "unityReady") {
              setUnityReady(true);
            }
            if (msg.action === "Data" && msg.scene === scene) {
              // Show animated result modal with details
              openResult(msg);
            }
            if (msg.action === "closeUnity") {
              closeUnity();
            }
          } catch {}
        }}
      />

      <GameResultModal
        visible={showResult}
        result={result}
        scene={scene}
        tournamentId={tournamentId}
        productId={productId}
        onRequestClose={() => dismissResult(true)}
        onBack={() => dismissResult(true)}
        onPlayAgain={() => {
          dismissResult(false);
          setTimeout(() => {
            try {
              unityRef.current?.postMessage(
                "UnityMessageManager",
                "MessageFromRN",
                JSON.stringify({ action: "openGame", scene })
              );
            } catch {}
          }, 220);
        }}
      />
    </View>
  );
}
