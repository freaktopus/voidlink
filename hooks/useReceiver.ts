import { useEffect, useRef, useState } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';
import { decodePacket } from '@/protocol/utils';
import { decode } from 'punycode';
import { db } from '../utils/db'

const SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';

export function useReceiver() {
  const managerRef = useRef<BleManager | null>(null);
  const [receivedPackets, setReceivedPackets] = useState<any[]>([]); // you can type this better

  useEffect(() => {
    const manager = new BleManager();
    managerRef.current = manager;

    const startScan = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        if (
          granted['android.permission.BLUETOOTH_SCAN'] !== 'granted' ||
          granted['android.permission.ACCESS_FINE_LOCATION'] !== 'granted'
        ) {
          console.log('BLE permissions denied');
          return;
        }
      }

      manager.startDeviceScan([SERVICE_UUID], null, (error, device) => {
        if (error) {
          console.log('Scan error:', error);
          return;
        }

        const base64 = device?.serviceData?.[SERVICE_UUID];
        if (!base64) return;

        const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
        console.log("Received Bytes: ", bytes);
        const decoded = decodePacket(bytes);
        console.log(" Received Decoded: ", decoded);
        if (!decoded) return;

        console.log("Decoded receivedPackets is : ", decoded)
        db.add({ id: (decoded.lat + decoded.lon).toString(), packet: decoded })

        console.log("Data added in db: ", (decoded.lat + decoded.lon).toString())
        console.log("Data added in db: ", db.get((decoded.lat + decoded.lon).toString()))

        setReceivedPackets(prev => {
          if (prev.find(p => p.id === device.id)) return prev; // optional: avoid duplicates
          return [...prev, { id: device.id, ...decoded }];
        });

      });
    };

    startScan();

    return () => {
      manager.stopDeviceScan();
      manager.destroy();
    };
  }, []);

  return { receivedPackets };
}

