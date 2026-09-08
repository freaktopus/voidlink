import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';

export function LoadingOverlay() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.2, {
        duration: 900,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <Animated.View style={pulseStyle}>
          <MaterialIcons name="map" size={36} color={Colors.dark.text} />
        </Animated.View>

        <Text style={styles.text}>Preparing map…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  box: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 10
  }
});
