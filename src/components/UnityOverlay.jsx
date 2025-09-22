import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, BackHandler, StyleSheet } from "react-native";
import UnityView from "@azesmway/react-native-unity";
import GameResultModal from "../components/GameResultModal";

export default function UnityOverlay({
  visible,
  scene,
  tournamentId,
  productId,
  onClose,
}) {
  const unityRef = useRef(null);
  const [showUnity, setShowUnity] = useState(false);
  const [unityReady, setUnityReady] = useState(true);
  const [pendingScene, setPendingScene] = useState(scene || null);
  const [sent, setSent] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  const closeUnity = useCallback(() => {
    try { unityRef.current?.unloadUnity?.(); } catch {}
    setShowUnity(false);
    setPendingScene(null);
    setSent(false);
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible && scene) {
      setPendingScene(scene);
      setShowUnity(true);
      setSent(false);
      setShowResult(false);
      setResult(null);
    } else {
      setShowUnity(false);
      setSent(false);
    }
  }, [visible, scene]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeUnity();
      return true;
    });
    return () => sub.remove();
  }, [visible, closeUnity]);

  useEffect(() => {
    if (!visible) return;
    if (!showUnity) return;
    if (!unityReady) return;
    if (!pendingScene) return;
    if (sent) return;
    try {
      unityRef.current?.postMessage(
        "UnityMessageManager",
        "MessageFromRN",
        JSON.stringify({ action: "openGame", scene: pendingScene })
      );
      setSent(true);
    } catch (err) {
      console.warn("Failed to post openGame", err);
    }
  }, [visible, showUnity, unityReady, pendingScene, sent]);

  const openResult = useCallback((payload) => {
    try { unityRef.current?.unloadUnity?.(); } catch {}
    setShowUnity(false);
    setSent(false);
    setResult(payload || {});
    setShowResult(true);
  }, []);

  const dismissResult = useCallback((thenClose = false) => {
    setShowResult(false);
    if (thenClose) {
      setTimeout(() => closeUnity(), 240);
    } else {
      setPendingScene(scene || pendingScene);
      setShowUnity(true);
      setSent(false);
    }
  }, [closeUnity, pendingScene, scene]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {showUnity ? (
        <UnityView
          ref={unityRef}
          style={styles.fill}
          fullScreen
          androidKeepPlayerMounted={false}
          onUnityMessage={(e) => {
            const rawMessage = e?.nativeEvent?.message;
            try {
              const msg =
                typeof rawMessage === "string" && rawMessage.trim().length
                  ? JSON.parse(rawMessage)
                  : rawMessage;
              if (msg.action === "unityReady") {
                setUnityReady(true);
                setSent(false);
              }
              if (msg.action === "Data" && msg.scene) {
                openResult(msg);
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
        productId={productId}
        onRequestClose={() => dismissResult(true)}
        onBack={() => dismissResult(true)}
        onPlayAgain={() => {
          dismissResult(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 999,
  },
  fill: {
    flex: 1,
  },
});
