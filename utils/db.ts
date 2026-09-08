export type latLong = string;

export interface Packet {
  [key: string]: any;
}

export interface Marker {
  id: string,
  type: string,
  coordinates: [number, number],
  timestamp: Date
}

const toMarker = (p: Packet): Marker => ({
  id: p.id,
  type: p.packet.type,
  coordinates: [p.packet.lat, p.packet.lon],
  timestamp: new Date(),
})

export class PacketDB {
  private store = new Map<latLong, Packet>();

  add(packet: Packet): void {
    this.store.set(packet.id, packet)
  }

  remove(id: string): boolean {
    return this.store.delete(id);
  }

  get(id: string): Packet | undefined {
    return this.store.get(id);
  }

  list(): Packet[] {
    return Array.from(this.store.values())
  }

  clear(): void {
    this.store.clear();
  }

  syncMarkerWithDB(current: Marker[], removeDeleted = false): Marker[] {
    const dbPackets = this.list()
    const dbByID = new Map(dbPackets.map(p => [p.id, p.packet]))

    const updatedMarker: Marker[] = []
    const seen = new Set<string>()

    for (const m of current) {
      const p = dbByID.get(m.id);

      if (p) {
        updatedMarker.push({ ...m, coordinates: [p.lat, p.lon], timestamp: new Date() })
        seen.add(m.id);
      } else if (!removeDeleted) {
        updatedMarker.push(m);
      }
    }

    for (const p of dbPackets) {
      if (!seen.has(p.id)) {
        console.log('RECEIVED:::::', p);
        updatedMarker.push(toMarker(p));
      }
    }

    return updatedMarker

  }

}

export const db = new PacketDB();
