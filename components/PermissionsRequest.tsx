import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Linking, Pressable } from 'react-native';
import * as Location from 'expo-location';
import { PermissionsAndroid } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface PermissionsRequestProps {
  onPermissionsGranted: () => void;
  children: React.ReactNode;
}

export const PermissionsRequest: React.FC<PermissionsRequestProps> = ({ 
  onPermissionsGranted, 
  children 
}) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const requestAllPermissions = async () => {
    setRequesting(true);
    try {
      if (Platform.OS === 'android') {
        // Request Bluetooth/Nearby devices permissions first
        const bluetoothPermissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(bluetoothPermissions);

        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Please grant all permissions to use this app. You can change this in Settings.',
            [
              { text: 'Try Again', onPress: () => requestAllPermissions() },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          setRequesting(false);
          return false;
        }

        // Request location permissions
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        
        if (locationStatus.status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'This app needs access to your location to find nearby emergencies and share your location.',
            [
              { text: 'Try Again', onPress: () => requestAllPermissions() },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          setRequesting(false);
          return false;
        }

        setPermissionsGranted(true);
        onPermissionsGranted();
        return true;
      } else {
        // iOS permissions
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        
        if (locationStatus.status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'This app needs access to your location to find nearby emergencies.',
            [
              { text: 'Try Again', onPress: () => requestAllPermissions() },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          setRequesting(false);
          return false;
        }

        setPermissionsGranted(true);
        onPermissionsGranted();
        return true;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
      setRequesting(false);
      return false;
    }
  };

  if (!permissionsGranted) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Permissions Required
          </ThemedText>
          
          <ThemedText style={styles.description}>
            This app needs the following permissions to function properly:
          </ThemedText>

          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <ThemedText style={styles.emoji}>📍</ThemedText>
              <View style={styles.permissionText}>
                <ThemedText type="defaultSemiBold">Location</ThemedText>
                <ThemedText style={styles.permissionDescription}>
                  To find nearby emergencies and share your location
                </ThemedText>
              </View>
            </View>

            <View style={styles.permissionItem}>
              <ThemedText style={styles.emoji}>📱</ThemedText>
              <View style={styles.permissionText}>
                <ThemedText type="defaultSemiBold">Nearby Devices</ThemedText>
                <ThemedText style={styles.permissionDescription}>
                  To communicate with nearby devices in emergencies
                </ThemedText>
              </View>
            </View>
          </View>

          <Pressable 
            onPress={requestAllPermissions} 
            style={[styles.button, requesting && styles.buttonDisabled]}
            disabled={requesting}
          >
            <ThemedText style={styles.buttonText}>
              {requesting ? 'Requesting...' : 'Grant Permissions'}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.8,
  },
  permissionsList: {
    gap: 20,
    marginBottom: 40,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  emoji: {
    fontSize: 32,
  },
  permissionText: {
    flex: 1,
    gap: 5,
  },
  permissionDescription: {
    opacity: 0.7,
    fontSize: 14,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    backDisabled: {
    backgroundColor: '#999999',
    opacity: 0.6,
  },
  buttongroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: 16,
  },
});
