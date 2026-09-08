import AdvertiserModule from "@/modules/advertiser/src/AdvertiserModule";
import { bytesToHex, EmergencyType, encodePacket, getEmergencyTypeValue, MessageType } from "@/protocol/utils";

const UUID = '00001234-0000-1000-8000-00805f9b34fb';

export const setupListener = () => {
  console.log('Setting up listener...');

  const subscription = AdvertiserModule.addListener(
    'onAdvertiseStatusChanged',
    (event) => {
      console.log('Event received:', event);
    }
  );

  return subscription;
};

export const startAdvertising = async (type: string, lat: number, lon: number, ttl: number = 10) => {
  console.log("Start Advertisinsg")
  console.log("Sender type: ", type)

  console.log(lat, lon)

  const typeValue = getEmergencyTypeValue(type);

  const bytes = encodePacket(typeValue, lat, lon);
  console.log("sender bytes value: ", bytes)
  const hex = bytesToHex(bytes);
  console.log("sender hex value: ", hex)
  AdvertiserModule.startAdvertising(UUID, hex);

  setTimeout(() => {
    AdvertiserModule.stopAdvertising();
    console.log('Stopped advertising after TTL expired');
  }, ttl * 1000);
};

export const stopAdvertising = async () => {
  console.log('Stopping BLE advertising...');
  AdvertiserModule.stopAdvertising();
};

export const broadcastCancellation = async (type: string, lat: number, lon: number, ttl: number = 5) => {
  console.log("Broadcasting cancellation");
  console.log("Cancel type: ", type);
  console.log(lat, lon);

  const typeValue = getEmergencyTypeValue(type);
  const bytes = encodePacket(typeValue, lat, lon, MessageType.Cancel);
  
  console.log("cancel bytes value: ", bytes);
  const hex = bytesToHex(bytes);
  console.log("cancel hex value: ", hex);
  
  AdvertiserModule.startAdvertising(UUID, hex);

  setTimeout(() => {
    AdvertiserModule.stopAdvertising();
    console.log('Stopped broadcasting cancellation after TTL expired');
  }, ttl * 1000);
};

