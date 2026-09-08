export type ModuleEvents = {
  onAdvertiseStatusChanged: (params: OnAdvertiseStatusChanged) => void;
};
type OnAdvertiseStatusChanged =
  | { success: true; uuid: string; payload: string }
  | { success: false; error: string }
  | { success: true; stopped: true };


export type startAdvertising = (
  uuid: string, 
  payloadHex: string
) => void

export type stopAdvertising = () => void 



