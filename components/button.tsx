import { Colors } from "@/constants/theme";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraRef } from "@maplibre/maplibre-react-native";
import { TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useCallback } from "react";

interface RecenterButtonProps {
  cameraRef: React.RefObject<CameraRef> | null;
  location: { latitude: number; longitude: number } | null;
}

export const RecenterButton = ({ cameraRef, location }: RecenterButtonProps) => {
  const recenterOnUser = useCallback(() => {
    if (!cameraRef?.current || !location) {
      Alert.alert('Location Unavailable', 'Please enable location services.');
      return;
    }
    cameraRef.current.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 15,
      animationDuration: 500,
    });
  }, [cameraRef, location]);

  if (!location) return null;

  return (
    <TouchableOpacity
      style={styles.recenterButton}
      onPress={recenterOnUser}
      activeOpacity={0.7}
    >
      <MaterialIcons name="my-location" size={24} color={Colors.dark.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recenterButton: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    width: 60,
    height: 60,
    borderRadius: 25,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
