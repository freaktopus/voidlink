import { StyleSheet, View, Alert, Text, TouchableOpacity } from 'react-native';
import { MapView, Camera, OfflineManager, OfflinePackStatus, OfflinePack, OfflinePackError, CameraRef, MapViewRef } from '@maplibre/maplibre-react-native';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NEPAL_BOUNDS, STYLE_URL } from '@/constants/map';
import { EMERGENCY_TYPES, EmergencyMarker, EmergencyType } from '@/constants/emergency';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/hooks/useLocation';
import { UserLocationMarker } from '@/components/location';
import { RadarMarker } from '@/components/markers/RadarMarker';
import { EmergencyTypeItem } from '@/components/emergency/EmergencyTypeItem';
import { ActiveEmergencyItem } from '@/components/emergency/ActiveEmergencyItem';
import { useBle } from '@/hooks/useBle';
import { setupListener, startAdvertising } from '@/utils/advertise';
import { LoadingOverlay } from '@/components/ui/loadingoverlay';
import { useReceiver } from '@/hooks/useReceiver';
import { EMERGENCY_TYPE_ID_TO_STRING } from '@/protocol/utils';
import { db } from '@/utils/db';

export default function Home() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [markers, setMarkers] = useState<EmergencyMarker[]>([]);
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);
  const [pendingLocation, setPendingLocation] = useState<any>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapViewRef>(null);

  const { connection, bleState } = useBle();
  const { receivedPackets } = useReceiver();
  const { location, loading } = useLocation();

  const userLocation = useMemo(() =>
    location ? [location.longitude, location.latitude] as [number, number] : null,
    [location?.longitude, location?.latitude]
  );

  useEffect(() => {
    const sub = setupListener();
    // setTimeout(() => stopAdvertising(), 10000);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (receivedPackets.length === 0) return;

    console.log(db.list())
    // setMarkers(
    //   db.list()
    // );
  }, [receivedPackets]);

  useEffect(() => {
    if (!loading && location) {
      cameraRef.current?.moveTo([location?.longitude, location?.latitude], 300);
    }

  }, [loading])

  const progressListener = useCallback((_offlineRegion: OfflinePack, status: OfflinePackStatus) => {
    setProgress(status.percentage);
  }, []);

  const errorListener = useCallback((_offlineRegion: OfflinePack, err: OfflinePackError) => {
    console.error('Download error:', err);
    setIsDownloading(false);
    Alert.alert('Download Failed', err.message || 'Unable to download map.');
  }, []);

  const downloadNepalMap = useCallback(async () => {
    setIsDownloading(true);
    setProgress(0);

    try {
      await OfflineManager.createPack({
        name: 'NepalMap',
        styleURL: STYLE_URL,
        minZoom: 6,
        maxZoom: 14,
        bounds: [NEPAL_BOUNDS.ne, NEPAL_BOUNDS.sw],
      }, progressListener, errorListener);
    } catch (error: any) {
      console.error('Download failed:', error);
      setIsDownloading(false);
    }
  }, [progressListener, errorListener]);

  useEffect(() => {
    (async () => {
      try {
        const packs = await OfflineManager.getPacks();
        const existingPack = packs.find((pack: any) => pack.name === 'NepalMap');
        if (!existingPack) {
          await downloadNepalMap();
        }
      } catch (error) {
        console.error('Error checking packs:', error);
      }
    })();
  }, [downloadNepalMap]);

  const handleLongMapPress = useCallback((event: any) => {
    const coords = event.geometry.coordinates;
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services to mark emergencies.');
      return;
    }
    bottomSheetRef.current?.expand();
    setPendingLocation(coords);
  }, [location]);

  useEffect(() => {
    if (isSelecting && selectedType && pendingLocation) {
      handleMapPress(null);
    }
  }, [isSelecting, selectedType, pendingLocation]);

  const handleMapPress = useCallback(async (event: any) => {
    if (!isSelecting || !selectedType) return;
    const coords = event ? event.geometry.coordinates : pendingLocation;
    cameraRef.current?.moveTo(coords, 200);
    if (!coords) return;

    if (!location) {
      Alert.alert('Location Required', 'Please enable location services.');
      setIsSelecting(false);
      setSelectedType(null);
      setPendingLocation(null);
      return;
    }

    const newMarker: EmergencyMarker = {
      id: Date.now().toString(),
      type: selectedType,
      coordinates: coords,
      timestamp: new Date(),
    };

    console.debug(pendingLocation)

    await startAdvertising(newMarker.type, newMarker.coordinates[0], newMarker.coordinates[1]);

    setMarkers(prev => [...prev, newMarker]);
    setIsSelecting(false);
    setSelectedType(null);
    setPendingLocation(null);
    bottomSheetRef.current?.close();
  }, [isSelecting, selectedType, pendingLocation, location]);

  const startMarking = useCallback((type: EmergencyType) => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services.');
      return;
    }
    setSelectedType(type);
    setIsSelecting(true);
    bottomSheetRef.current?.close();
  }, [location]);

  const removeMarker = useCallback((id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
    if (selectedMarkerId === id) {
      setSelectedMarkerId(null);
    }
  }, [selectedMarkerId]);

  const handleMarkerPress = useCallback(async (marker: EmergencyMarker) => {
    setSelectedMarkerId(marker.id);
    cameraRef.current?.moveTo(marker.coordinates, 300);
    bottomSheetRef.current?.expand();
  }, []);

  const handleActiveEmergencyPress = useCallback((marker: EmergencyMarker) => {
    setSelectedMarkerId(marker.id);
    cameraRef.current?.moveTo(marker.coordinates, 300);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleFabPress = useCallback(() => {
    bottomSheetRef.current?.expand();
    setPendingLocation(null);
    setSelectedMarkerId(null);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedType(null);
  }, []);

  const renderedMarkers = useMemo(() => {
    return markers.map(marker => {
      const emergencyType = EMERGENCY_TYPES.find(t => t.id === marker.type);
      return (
        <RadarMarker
          key={marker.id}
          marker={marker}
          emergencyType={emergencyType}
          onPress={handleMarkerPress}
        />
      );
    });
  }, [markers, handleMarkerPress]);

  const selectedMarker = useMemo(() =>
    markers.find(m => m.id === selectedMarkerId),
    [markers, selectedMarkerId]
  );

  const selectedEmergencyType = useMemo(() =>
    selectedMarker ? EMERGENCY_TYPES.find(t => t.id === selectedMarker.type) : null,
    [selectedMarker]
  );

  const recenterOnUser = () => {
    if (!cameraRef?.current || !location) {
      Alert.alert('Location Unavailable', 'Please enable location services.');
      return;
    }
    cameraRef.current?.moveTo([location.longitude, location.latitude], 300);
  };

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {isDownloading && (
          <View style={styles.progressWrapper}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          </View>
        )}
        {loading && <LoadingOverlay />}
        <MapView
          ref={mapRef}
          style={styles.map}
          mapStyle={STYLE_URL}
          surfaceView={true}
          onPress={handleMapPress}
          onLongPress={handleLongMapPress}
        >
          <Camera ref={cameraRef} />

          {userLocation && (
            <UserLocationMarker coordinate={userLocation} />
          )}

          {renderedMarkers}
        </MapView>

        {location && (
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={recenterOnUser}
            activeOpacity={0.7}
          >
            <MaterialIcons name="my-location" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={28} color={Colors.dark.text} />
        </TouchableOpacity>

        {markers.length > 0 && (
          <View style={styles.markerCount}>
            <MaterialIcons name="warning" size={16} color={Colors.dark.text} style={{ marginRight: 5 }} />
            <Text style={styles.markerCountText}>
              {markers.length} Active {markers.length === 1 ? 'Emergency' : 'Emergencies'}
            </Text>
          </View>
        )}

        {isSelecting && !pendingLocation && (
          <View style={styles.selectionBanner}>
            <Text style={styles.selectionText}>
              {EMERGENCY_TYPES.find(t => t.id === selectedType)?.icon} Tap within 1km to mark emergency
            </Text>
            <TouchableOpacity onPress={handleCancelSelection}>
              <MaterialIcons name="close" size={20} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>
        )}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['50%', '75%']}
          backgroundStyle={styles.bottomSheetBackground}
          enablePanDownToClose
          onClose={() => setSelectedMarkerId(null)}
        >
          <BottomSheetScrollView
            style={styles.bottomSheetContent}
            contentContainerStyle={styles.bottomSheetContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {selectedMarkerId && selectedMarker && selectedEmergencyType ? (
              // Emergency Details View
              <>
                <Text style={styles.bottomSheetTitle}>Emergency Details</Text>
                <View style={styles.emergencyDetailCard}>
                  <View style={styles.emergencyDetailHeader}>
                    <Text style={styles.emergencyDetailIcon}>{selectedEmergencyType.icon}</Text>
                    <View style={styles.emergencyDetailInfo}>
                      <Text style={styles.emergencyDetailType}>{selectedEmergencyType.label}</Text>
                      <Text style={styles.emergencyDetailTime}>
                        {new Date(selectedMarker.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.emergencyDetailCoords}>
                    <MaterialIcons name="place" size={16} color="#666" />
                    <Text style={styles.emergencyDetailCoordsText}>
                      {selectedMarker.coordinates[1].toFixed(6)}, {selectedMarker.coordinates[0].toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      removeMarker(selectedMarker.id);
                      bottomSheetRef.current?.close();
                    }}
                  >
                    <MaterialIcons name="delete" size={20} color="#fff" />
                    <Text style={styles.removeButtonText}>Remove Emergency</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Emergency Type Selection View
              <>
                <Text style={styles.bottomSheetTitle}>Select Emergency Type</Text>
                <Text style={styles.bottomSheetSubtitle}>
                  📍 Mark emergencies within 1km of your location
                </Text>
                <View style={styles.emergencyList}>
                  {EMERGENCY_TYPES.map(emergency => (
                    <EmergencyTypeItem
                      key={emergency.id}
                      icon={emergency.icon}
                      label={emergency.label}
                      color={emergency.color}
                      onPress={() => startMarking(emergency.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {markers.length > 0 && (
              <>
                <Text style={[styles.bottomSheetTitle, styles.activeSectionTitle]}>
                  Active Emergencies ({markers.length})
                </Text>
                <View style={styles.activeMarkersList}>
                  {markers.map(marker => {
                    const emergencyType = EMERGENCY_TYPES.find(t => t.id === marker.type);
                    return (
                      <ActiveEmergencyItem
                        key={marker.id}
                        marker={marker}
                        emergencyType={emergencyType}
                        isSelected={marker.id === selectedMarkerId}
                        onPress={() => handleActiveEmergencyPress(marker)}
                        onRemove={() => removeMarker(marker.id)}
                      />
                    );
                  })}
                </View>
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.tint
  },
  map: {
    flex: 1,
  },
  progressWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#218c74',
  },
  recenterButton: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerCount: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  markerCountText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
  },
  selectionBanner: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 10,
    borderBottomColor: Colors.dark.tint,
    borderBottomWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bottomSheetBackground: {
    backgroundColor: Colors.light.background,
  },
  bottomSheetContent: {
    flex: 1,
  },
  bottomSheetContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  bottomSheetTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activeSectionTitle: {
    marginTop: 24,
    marginBottom: 12,
  },
  bottomSheetSubtitle: {
    color: '#666',
    fontSize: 13,
    marginBottom: 15,
  },
  emergencyList: {
    marginBottom: 10,
  },
  activeMarkersList: {
    gap: 8,
  },
  emergencyDetailCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  emergencyDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyDetailIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  emergencyDetailInfo: {
    flex: 1,
  },
  emergencyDetailType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  emergencyDetailTime: {
    fontSize: 13,
    color: '#666',
  },
  emergencyDetailCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  emergencyDetailCoordsText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
