import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { submitScore, joinTournament } from "../services/tournaments";
import { getProductById } from "../services/products";
import { fetchMyWallet } from "../store/wallet/walletSlice";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from "react-native";

export default function GameResultModal({
  visible,
  result = {},
  scene,
  tournamentId,
  productId,
  onRequestClose, // called on system/backdrop close
  onBack, // user tapped Back button
  onPlayAgain, // user tapped Play Again
}) {
  const [isVisible, setIsVisible] = useState(visible);
  const lastSubmitKeyRef = useRef(null);
  const [submitErr, setSubmitErr] = useState(null);
  const [playErr, setPlayErr] = useState(null);
  const [joining, setJoining] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const coins = useSelector((s) => s.wallet.availableZishCoins);

  // Animated values scoped to this component
  const overlayOpacity = useMemo(() => new Animated.Value(0), []);
  const cardScale = useMemo(() => new Animated.Value(0.9), []);

  const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
  const confettiCount = 14;
  const confetti = useMemo(
    () =>
      Array.from({ length: confettiCount }).map((_, i) => ({
        id: i,
        x: Math.random() * (SCREEN_WIDTH - 30),
        delay: Math.random() * 600,
        spin: new Animated.Value(0),
        base: Math.random() * 360,
        translateY: new Animated.Value(-80 - Math.random() * 120),
        color: ["#FF5A5F", "#2ECC71", "#FFD166", "#4DA3FF", "#B39DDB"][i % 5],
      })),
    [SCREEN_WIDTH]
  );

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    confetti.forEach((c) => {
      c.translateY.setValue(-80 - Math.random() * 120);
      c.spin.setValue(0);
      Animated.sequence([
        Animated.delay(c.delay),
        Animated.parallel([
          Animated.timing(c.translateY, {
            toValue: SCREEN_HEIGHT + 80,
            duration: 1600 + Math.random() * 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(c.spin, {
            toValue: 1,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  const animateOut = (done) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 0.96,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start(() => done && done());
  };

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      // small delay to ensure Modal is mounted
      const t = setTimeout(animateIn, 10);
      return () => clearTimeout(t);
    } else if (isVisible) {
      animateOut(() => setIsVisible(false));
    }
  }, [visible]);

  const score = (() => {
    if (typeof result?.levelFinishTime === 'number') return result.levelFinishTime;
    if (result?.levelFinishTime != null) return Number(result.levelFinishTime) || 0;
    if (typeof result?.score === 'number') return result.score;
    return Number(result?.score) || 0;
  })();
  const title = "Congratulations!";
    console.log("chlllaa")

  // Auto-submit score when modal opens the first time
  useEffect(() => {
    console.log(isVisible, "result modal visible")
    if (!isVisible) return;
    setSubmitErr(null);
    console.log("chlllaa")
    const key = `${tournamentId || ''}|${Number(score)}`;
    if (lastSubmitKeyRef.current === key) return;
    (async () => {
      try {
    console.log(tournamentId,"chlllaa 2")

        if (tournamentId && Number.isFinite(Number(score))) {
        const result =   await submitScore(tournamentId, Number(score));
    console.log(result, "chlllaa 3")

          lastSubmitKeyRef.current = key;
        }
      } catch (e) {
        // Keep UI friendly; store error for potential debug text
        setSubmitErr(e?.message || 'Failed to submit score');
      }
    })();
  }, [isVisible, tournamentId, score]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={() => (onRequestClose ? onRequestClose() : onBack && onBack())}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: overlayOpacity,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        {/* Confetti (lightweight) */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
          {confetti.map((c) => (
            <Animated.View
              key={c.id}
              style={{
                position: "absolute",
                width: 10,
                height: 16,
                borderRadius: 2,
                backgroundColor: c.color,
                left: c.x,
                transform: [
                  { translateY: c.translateY },
                  { rotate: `${c.base}deg` },
                  {
                    rotate: c.spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", Math.random() > 0.5 ? "360deg" : "-360deg"] }),
                  },
                ],
                opacity: 0.9,
              }}
            />
          ))}
        </View>

        <Animated.View
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 20,
            paddingVertical: 22,
            paddingHorizontal: 18,
            transform: [{ scale: cardScale }],
            backgroundColor: "#0B1220",
            borderWidth: 1,
            borderColor: "#24324A",
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 56, textAlign: "center" }}>{score >= 50 ? "🏆" : "✨"}</Text>
            <Text
              style={{
                fontSize: 24,
                color: "#E6F0FF",
                fontWeight: Platform.OS === "ios" ? "700" : "bold",
                marginTop: 6,
              }}
            >
              {title}
            </Text>
            <Text style={{ fontSize: 14, color: "#AFC1DC", marginTop: 6 }}>Your score is recorded</Text>
          </View>

          <View
            style={{
              backgroundColor: "#0E1A31",
              borderColor: "#1A2B4A",
              borderWidth: 1,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: "#9AB0CF" }}>Scene</Text>
              <Text style={{ color: "#E6F0FF", fontWeight: "600" }}>{result?.scene || scene}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: "#9AB0CF" }}>Score</Text>
              <Text style={{ color: "#E6F0FF", fontWeight: "700" }}>{Number.isFinite(score) ? String(score) : "-"}</Text>
            </View>
            {submitErr ? (
              <View style={{ marginTop: 6 }}>
                <Text style={{ color: "#FF7A7A" }}>Note: {submitErr}</Text>
              </View>
            ) : null}
            {result?.time != null && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: "#9AB0CF" }}>Time</Text>
                <Text style={{ color: "#E6F0FF", fontWeight: "600" }}>{String(result.time)}</Text>
              </View>
            )}
            {result?.coins != null && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: "#9AB0CF" }}>Coins</Text>
                <Text style={{ color: "#E6F0FF", fontWeight: "600" }}>{String(result.coins)}</Text>
              </View>
            )}
            {result?.details && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ color: "#9AB0CF", marginBottom: 4 }}>Details</Text>
                <Text style={{ color: "#CFE0FF" }} numberOfLines={3}>
                  {typeof result.details === "string" ? result.details : JSON.stringify(result.details)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#28406A",
                backgroundColor: "#122545",
                marginRight: 10,
              }}
              activeOpacity={0.85}
              onPress={() => (onBack ? onBack() : onRequestClose && onRequestClose())}
            >
              <Text style={{ color: "#CFE0FF", textAlign: "center", fontWeight: "600" }}>Back</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: joining ? "#3A4051" : (score >= 70 ? "#2ECC71" : score >= 50 ? "#4DA3FF" : "#6C77FF"),
              }}
              activeOpacity={0.9}
              onPress={async () => {
                if (!onPlayAgain || joining) return;
                setPlayErr(null);
                try {
                  if (!token) throw new Error('Login required');
                  // quick wallet check
                  const required = Number(result?.coinPerPlay || 0); // may not be present; fallback later
                  if (Number(coins || 0) <= 0 && required > 0) throw new Error('Insufficient coins');

                  if (!productId) throw new Error('Missing product');
                  setJoining(true);
                  const fresh = await getProductById(productId, token);
                  const status = fresh?.tournament?.status || fresh?.tournamentStatus;
                  const playsCompleted = Number(fresh?.playsCompleted ?? fresh?.tournament?.playsCompleted ?? 0);
                  const playsTotal = Number(fresh?.playsTotal ?? fresh?.tournament?.playsTotal ?? 0);
                  const full = playsTotal > 0 && playsCompleted >= playsTotal;
                  const ended = status === 'OVER' || status === 'UNFILLED';
                  if (ended || full) throw new Error('No seats left or game ended.');
                  const tId = fresh?.tournament?._id || tournamentId;
                  if (!tId) throw new Error('Tournament unavailable');
                  try {
                    await joinTournament(tId, token);
                  } catch (e) {
                    if (e?.status === 402 || e?.data?.error === 'INSUFFICIENT_FUNDS') {
                      throw new Error('Insufficient coins');
                    }
                    throw e;
                  }
                  try { dispatch(fetchMyWallet()); } catch {}
                  onPlayAgain();
                } catch (e) {
                  setPlayErr(e?.message || 'Unable to start new play');
                } finally {
                  setJoining(false);
                }
              }}
            >
              <Text style={{ color: "#0B1220", textAlign: "center", fontWeight: "700" }}>{joining ? 'Please wait...' : 'Play Again'}</Text>
            </TouchableOpacity> */}
          </View>
          {playErr ? (
            <Text style={{ color: "#FF7A7A", textAlign: 'center', marginTop: 10 }}>{playErr}</Text>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
