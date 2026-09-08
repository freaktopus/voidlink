export const EMERGENCY_TYPES = [
  { id: 'medical', label: 'Medical Emergency', icon: '🏥', color: '#ff5252' },
  { id: 'fire', label: 'Fire', icon: '🔥', color: '#ff793f' },
  { id: 'police', label: 'Police', icon: '👮', color: '#34ace0' },
  { id: 'accident', label: 'Accident', icon: '🚗', color: '#82589F' },
  { id: 'natural', label: 'Natural Disaster', icon: '🌊', color: '#25CCF7' },
  { id: 'rescue', label: 'Rescue', icon: '⛑️', color: '#ffb142' },
] as const;

export type EmergencyType = typeof EMERGENCY_TYPES[number]['id'];

export interface EmergencyMarker {
  id: string;
  type: string;
  coordinates: [number, number];
  timestamp: Date;
  ownerId?: string; // Device ID of the creator
  expiresAt?: Date; // Auto-expiry time
}

// Marker expiry duration (30 minutes)
export const MARKER_EXPIRY_MS = 30 * 60 * 1000;

export const PROTOCOL_TO_EMERGENCY_TYPE: Record<number, EmergencyType> = {
  0: 'medical',
  1: 'fire',
  2: 'police',
  3: 'accident',
  4: 'natural',
  5: 'rescue',
};
