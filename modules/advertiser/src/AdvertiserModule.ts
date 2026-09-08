import { NativeModule, requireNativeModule } from 'expo';

import { ModuleEvents, startAdvertising, stopAdvertising } from './Advertiser.types';

declare class AdvertiserModule extends NativeModule<ModuleEvents> {
  startAdvertising: startAdvertising;
  stopAdvertising: stopAdvertising;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AdvertiserModule>('Advertiser');
