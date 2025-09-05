import React, { memo, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import ProgressBar from '../common/ProgressBar';
import useGameCard from './useGameCard';
import LinearGradient from 'react-native-linear-gradient';
import { Star, Share2, Zap, Info, Clock } from 'lucide-react-native';

function GameCard({ item, onPress, onPlay, onCardPress, onShare, now }) {
  const { faved, toggleFav, progress, endsIn, loading, handlePlay, ended, msLeft, calcReady } = useGameCard(item, now);
  const onPlayPress = useCallback(() => handlePlay(onPlay || onPress), [handlePlay, onPlay, onPress]);
  const goDetails = useCallback(() => (onCardPress || onPress)?.(item), [onCardPress, onPress, item]);
  // Treat tournament status OVER/UNFILLED as ended, regardless of countdown
  const tourStatus = item?.tournamentStatus || item?.tournament?.status || item?.raw?.tournament?.status;
  const statusEnded = tourStatus === 'OVER' || tourStatus === 'UNFILLED';
  const showEndedUI = !!statusEnded;

  return (
    <View style={styles.card}>
      {/* Image header */}
      <TouchableOpacity activeOpacity={0.85} onPress={goDetails}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageOverlay}
          />
          <TouchableOpacity style={[styles.roundIcon, styles.leftIcon]} onPress={toggleFav} activeOpacity={0.8}>
            <Star size={22} color={colors.white} {...(faved ? { fill: colors.accent } : {})} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundIcon, styles.rightIcon]} activeOpacity={0.8} onPress={() => onShare?.(item)}>
            <Share2 size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{item.title}</Text>
        </View>
      </TouchableOpacity>

      {/* Details */}
      <TouchableOpacity activeOpacity={0.85} onPress={goDetails}>
        <View style={styles.body}>
          <View style={styles.rowBetween}>
            <Text style={styles.subtle}>Per Game Play</Text>
            <Text style={styles.coinText}>{item.coinPerPlay} Zishcoin</Text>
          </View>

          <Text style={styles.progressLabel}>
            {item.playsCompleted} / {item.playsTotal} game play completed
          </Text>
          <ProgressBar value={progress} />

          {item.badge ? (
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Zap color={colors.white} size={14} style={{marginRight: 6}} />
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
              <Info color={colors.warning} size={16} style={{marginLeft: 8}} />
            </View>
          ) : (
            <View style={{ height: 12 }} />
          )}

          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <View style={styles.rowLeft}>
              {showEndedUI ? (
                <Text style={styles.endedMsg}>Game ended</Text>
              ) : endsIn !== 'Ended' ? (
                <>
                  <Clock size={18} color={colors.textSecondary} style={{marginRight: 6}} />
                  <Text style={styles.subtle}>Ends in:</Text>
                  <Text style={styles.endsIn}>{' '}{endsIn}</Text>
                </>
              ) : null}
            </View>
            <View style={styles.gameTypeWrap}>
              <Image source={{ uri: item.gameTypeIcon }} style={styles.gameIcon} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={[styles.rowBetween, { marginTop: 16, alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 }]}>
        {calcReady ? (
          showEndedUI ? (
            <View style={[styles.playGrad, { backgroundColor: '#3A4051' }]}>
              <Text style={styles.playText}>Game End</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.playBtn} onPress={onPlayPress} activeOpacity={0.85} disabled={loading}>
              <LinearGradient colors={[colors.primary, colors.gradientEnd]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.playGrad, loading && { opacity: 0.7 }]}>
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.playText}>Play Now</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )
        ) : (
          <View style={[styles.playGrad, { backgroundColor: '#3A4051', opacity: 0.5 }]} />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.subtle}>Game Type :</Text>
          <Text style={styles.gameType}>{' '}{item.gameType}</Text>
        </View>
      </View>
    </View>
  );
}

export default memo(GameCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2B303B',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2E3440',
    marginBottom: 16,
  },
  imageWrap: {
    position: 'relative',
    height: 160,
    backgroundColor: '#1F232C',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  title: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  roundIcon: {
    position: 'absolute',
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: { left: 12 },
  rightIcon: { right: 12 },
  body: { padding: 14 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtle: { color: colors.textSecondary, fontSize: 14 },
  coinText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  progressLabel: {
    color: colors.white,
    marginTop: 8,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#4C2A80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: { color: colors.white, fontWeight: '600' },
  infoIcon: { color: colors.textSecondary, marginLeft: 6 },
  clock: { color: colors.textSecondary, marginRight: 6 },
  endsIn: { color: colors.accent, fontWeight: '700' },
  endedMsg: { color: colors.error, fontWeight: '700' },
  gameTypeWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1F232C',
  },
  gameIcon: { width: '100%', height: '100%' },
  playBtn: { borderRadius: 12, overflow: 'hidden' },
  playGrad: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  gameType: { color: colors.white, fontWeight: '600' },
});
 
