import React, { useRef, useEffect, useState } from "react";
import { View, Alert, BackHandler } from "react-native";
import UnityView from "@azesmway/react-native-unity";

export default function UnityScreen({ navigation, route }) {
  const unityRef = useRef(null);
  const { scene } = route.params;
  const [unityReady, setUnityReady] = useState(false);
  const [sent, setSent] = useState(false);

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
              Alert.alert("Game Finished", JSON.stringify(msg));
              closeUnity();
            }
            if (msg.action === "closeUnity") {
              closeUnity();
            }
          } catch {}
        }}
      />
    </View>
  );
}
