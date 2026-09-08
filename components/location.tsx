import { StyleSheet, View } from 'react-native';
import { memo } from "react";
import { Colors } from '@/constants/theme';
import { MarkerView } from '@maplibre/maplibre-react-native';

export const UserLocationMarker = memo(
  ({ coordinate }: { coordinate: [number, number] }) => {
    return (
      <MarkerView
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.wrapper}>
          <View style={styles.pulse} />
          <View style={styles.dot} />
        </View>
      </MarkerView>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.coordinate[0] === nextProps.coordinate[0] &&
      prevProps.coordinate[1] === nextProps.coordinate[1]
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    width: 60,          
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 2,
  },
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(112, 111, 211, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(112, 111, 211, 0.5)',
    zIndex: 1,
  },
});
