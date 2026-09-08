import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, NativeEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = new NativeEventEmitter(BleManagerModule);

export const useBle = () => {
  const [connection, setConnection] = useState(false);
  const [bleState, setBleState] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleAndroidPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {

      await BleManager.enableBluetooth();
      if (Platform.Version >= 31) {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = permissions.every(permission =>
          results[permission] === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.warn('Some BLE permissions denied:', results);
          return false;
        }

        return true;
      } else if (Platform.Version >= 23) {
        const locationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location access to scan for Bluetooth devices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return locationPermission === PermissionsAndroid.RESULTS.GRANTED;
      }

      return true;
    } catch (err) {
      console.error('[handleAndroidPermissions] Error:', err);
      return false;
    }
  };

  useEffect(() => {
    let stateSubscription: any;

    const initBle = async () => {
      try {
        console.log('Starting BLE initialization...');

        const permissionGranted = await handleAndroidPermissions();
        if (!permissionGranted) {
          console.warn('BLE permissions denied');
          setConnection(false);
          setIsInitialized(true);
          return;
        }

        await BleManager.start({ showAlert: true });
        console.debug('BleManager started.');

        stateSubscription = bleEmitter.addListener('BleManagerDidUpdateState', ({ state }) => {
          console.debug('BLE State updated:', state);
          setBleState(state);
          setConnection(state === 'on');
        });

        bleEmitter.addListener('BleManagerDiscoverPeripheral', (device) => {
          console.log("---> Discovered Device:", device);
        });

        setIsInitialized(true);

      } catch (error) {
        console.error('Failed to initialize BLE:', error);
        setConnection(false);
        setIsInitialized(true);
      }
    };

    initBle();

    return () => {
      if (stateSubscription) {
        stateSubscription.remove();
      }
      BleManager.stopScan().catch(err => console.log('Stop scan error:', err));
    };
  }, []);

  return { connection, bleState, isInitialized };
};
