import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, Alert } from "react-native";
import UnityView from "@azesmway/react-native-unity";

export default function UnityScreenOld() {
  const unityRef = useRef(null);

  const [showUnity, setShowUnity] = useState(false);
  const [unityReady, setUnityReady] = useState(true);
  const [pendingScene, setPendingScene] = useState(null);
  const [sent, setSent] = useState(false);

  // Launch the selected game (fresh runtime every time)
  const requestGame = (scene) => {
    setPendingScene(scene);
    setShowUnity(true);  
    setSent(false);
  };

  // Send openGame exactly once after "unityReady"
  useEffect(() => {
    if (showUnity && unityReady && pendingScene && unityRef.current && !sent) {
      unityRef.current.postMessage(
        "UnityMessageManager",
        "MessageFromRN",
        JSON.stringify({ action: "openGame", scene: pendingScene })
      );
      setSent(true);
    }
  }, [showUnity, unityReady, pendingScene, sent]);

  // Close & reset (really unload Unity)
  const closeUnity = () => {
    try { unityRef.current?.unloadUnity?.(); } catch {}
    setShowUnity(false);         // unmount UnityView -> auto unload as well
    // setUnityReady(false);
    setPendingScene(null);
    setSent(false);
  };

  // Android hardware back -> close Unity runtime
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showUnity) { closeUnity(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [showUnity]);

  return (
    <View style={styles.container}>
      {showUnity ? (
        <UnityView
          ref={unityRef}
          style={styles.fill}           // MUST give size
          fullScreen
          androidKeepPlayerMounted={false} // ensure it does not persist on Android
          onUnityMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.message || "{}");
              
              // {"action": "Data", "levelFinishTime": 14.819347381591797, "scene": "Game1"}
              
              if (msg.action === "unityReady") setUnityReady(true);
              if (msg.action === "Data") {
                if(msg.scene){
                  closeUnity()
                  Alert.alert(JSON.stringify(msg))
                }
              };
              if (msg.action === "closeUnity") closeUnity(); // Unity can tell RN to exit
              // (Optional) if Unity sends {"action":"sceneOpened","scene":"Game1"}
            } catch {}
          }}
        />
      ) : (
        // Launcher (only visible when Unity is not mounted)
        <View style={styles.launcher}>
          <TouchableOpacity style={styles.btn} onPress={() => requestGame("Game1")}>
            <Text style={styles.btnTxt}>Play Game 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => requestGame("Game2")}>
            <Text style={styles.btnTxt}>Play Game 2</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Unity opens full-screen after you choose a game</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  launcher: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  btn: { backgroundColor: "#E53935", padding: 14, borderRadius: 12, minWidth: 220 },
  btnTxt: { color: "#fff", fontWeight: "700", textAlign: "center" },
  hint: { color: "#bbb" }
});