export enum EmergencyType {
  Medical = 0,
  Fire = 1,
  Police = 2,
  Accident = 3,
  Natural = 4,
  Rescue = 5,
}

export enum MessageType {
  Emergency = 0,
  Cancel = 1,
}

const SCALE = 1e7;

/**
 * FORMAT (ASCII):
 * messageType*emergencyType*latE7*lonE7
 * Example (Emergency):
 * 0*1*283142104*846407451
 * Example (Cancel):
 * 1*1*283142104*846407451
 */
export function encodePacket(
  emergencyType: EmergencyType,
  lat: number,
  lon: number,
  messageType: MessageType = MessageType.Emergency
): Uint8Array {
  const latE7 = Math.round(lat * SCALE);
  const lonE7 = Math.round(lon * SCALE);
  const text = `${messageType}*${emergencyType}*${latE7}*${lonE7}`;

  return new TextEncoder().encode(text);
}

export function decodePacket(bytes: Uint8Array): {
  messageType: MessageType;
  emergencyType: EmergencyType;
  lat: number;
  lon: number;
} | null {
  try {
    const text = new TextDecoder().decode(bytes);
    const parts = text.split('*');

    if (parts.length !== 4) {
      // Try old format for backward compatibility
      if (parts.length === 3) {
        const emergencyType = Number(parts[0]);
        const latE7 = Number(parts[1]);
        const lonE7 = Number(parts[2]);

        if (
          Number.isNaN(emergencyType) ||
          Number.isNaN(latE7) ||
          Number.isNaN(lonE7)
        ) {
          return null;
        }

        return {
          messageType: MessageType.Emergency,
          emergencyType,
          lat: latE7 / SCALE,
          lon: lonE7 / SCALE,
        };
      }
      return null;
    }

    const messageType = Number(parts[0]);
    const emergencyType = Number(parts[1]);
    const latE7 = Number(parts[2]);
    const lonE7 = Number(parts[3]);

    if (
      Number.isNaN(messageType) ||
      Number.isNaN(emergencyType) ||
      Number.isNaN(latE7) ||
      Number.isNaN(lonE7)
    ) {
      return null;
    }

    return {
      messageType,
      emergencyType,
      lat: latE7 / SCALE,
      lon: lonE7 / SCALE,
    };
  } catch {
    return null;
  }
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getEmergencyTypeValue(type: string): EmergencyType {
  const typeMap: Record<string, EmergencyType> = {
    medical: EmergencyType.Medical,
    fire: EmergencyType.Fire,
    police: EmergencyType.Police,
    accident: EmergencyType.Accident,
    natural: EmergencyType.Natural,
    rescue: EmergencyType.Rescue,
  };

  return typeMap[type.toLowerCase()] ?? EmergencyType.Medical;
}

export const EMERGENCY_TYPE_ID_TO_STRING: Record<number, string> = {
  0: 'medical',
  1: 'fire',
  2: 'police',
  3: 'accident',
  4: 'natural',
  5: 'rescue',
};
