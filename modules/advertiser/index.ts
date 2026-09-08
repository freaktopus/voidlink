// Reexport the native module. On web, it will be resolved to AdvertiserModule.web.ts
// and on native platforms to AdvertiserModule.ts
export * from './src/Advertiser.types';
export { default } from './src/AdvertiserModule';

