import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MarkerView } from '@maplibre/maplibre-react-native';
import { EmergencyMarker } from '@/constants/emergency';
import { Colors } from '@/constants/theme';

interface RadarMarkerProps {
  marker: EmergencyMarker;
  emergencyType: any;
  onPress: (marker: EmergencyMarker) => void;
  onLongPress?: (marker: EmergencyMarker) => void;
}

export const RadarMarker = memo(({ marker, emergencyType, onPress, onLongPress }: RadarMarkerProps) => {
  const handlePress = () => {
    console.log("RadarMarker tapped:", marker.id);
    onPress(marker);
  };
  
  const handleLongPress = () => {
    console.log("RadarMarker long pressed:", marker.id);
    onLongPress?.(marker);
  };
  
  return (
    <MarkerView
      key={marker.id}
      coordinate={marker.coordinates}
      anchor={{ x: 0.5, y: 0.5 }} 
    >
      <TouchableOpacity 
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        style={styles.touchable} 
      >
        <View style={styles.radarContainer}>
          <View style={[
            styles.markerCenter, 
            { 
              borderColor: emergencyType?.color || Colors.light.tint,
              backgroundColor:'rgba(255, 255, 255, 0.9)',
            }
          ]}>
            <Text style={styles.markerEmoji}>{emergencyType?.icon}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </MarkerView>
  );
});

const styles = StyleSheet.create({
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarContainer: {
    width: 70, 
    height: 70, 
    alignItems: 'center',
    justifyContent: 'center',
  },
    markerCenter: {
    borderWidth: 3,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerEmoji: {
    fontSize: 22,
  },
});
