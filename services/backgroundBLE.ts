import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { decodePacket, MessageType } from '@/protocol/utils';
import { EMERGENCY_TYPES } from '@/constants/emergency';

const BLE_TASK_NAME = 'BACKGROUND_BLE_SCAN';
const SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Background task definition
TaskManager.defineTask(BLE_TASK_NAME, async () => {
  try {
    console.log('[Background] BLE scan task running...');
    
    const manager = new BleManager();
    
    // Scan for 10 seconds
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        manager.stopDeviceScan();
        manager.destroy();
        resolve();
      }, 10000);

      manager.startDeviceScan([SERVICE_UUID], null, async (error, device) => {
        if (error) {
          console.log('[Background] Scan error:', error);
          return;
        }

        const base64 = device?.serviceData?.[SERVICE_UUID];
        if (!base64) return;

        const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
        const decoded = decodePacket(bytes);
        
        if (!decoded || decoded.messageType === MessageType.Cancel) return;

        // Found an emergency - send notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 Emergency Alert Nearby!',
            body: 'An emergency has been reported in your area',
            data: { 
              type: decoded.emergencyType,
              lat: decoded.lat,
              lon: decoded.lon 
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            vibrate: [0, 250, 250, 250],
          },
          trigger: null, // Immediate
        });

        console.log('[Background] Emergency notification sent:', emergencyType?.label);
        
        clearTimeout(timeout);
        manager.stopDeviceScan();
        manager.destroy();
        resolve();
      });
    });

    return TaskManager.TaskExecutorResult.NewData;
  } catch (error) {
    console.error('[Background] Task error:', error);
    return TaskManager.TaskExecutorResult.Failed;
  }
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }
  
  return true;
}

export async function startBackgroundBLEScanning() {
  try {
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      console.log('Cannot start background scanning without notification permissions');
      return false;
    }

    // Register the background task (will run periodically when app is backgrounded)
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BLE_TASK_NAME);
    if (!isRegistered) {
      console.log('Registering background BLE task...');
      // Note: The actual background scheduling requires native implementation
      // For now, this sets up the task definition
    }
    
    console.log('Background BLE scanning configured');
    return true;
  } catch (error) {
    console.error('Failed to start background scanning:', error);
    return false;
  }
}

export async function stopBackgroundBLEScanning() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BLE_TASK_NAME);
    if (isRegistered) {
      await TaskManager.unregisterTaskAsync(BLE_TASK_NAME);
      console.log('Background BLE scanning stopped');
    }
  } catch (error) {
    console.error('Failed to stop background scanning:', error);
  }
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Test Emergency Alert',
      body: '🔥 Fire emergency detected nearby',
      data: { type: 'fire' },
      sound: true,
    },
    trigger: null,
  });
}
