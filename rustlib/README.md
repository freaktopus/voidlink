```
cargo ndk -o ../modules/rust-module/android/src/main/jniLibs \
  -t arm64-v8a \
  -t armeabi-v7a \
  -t x86_64 \
  -t x86 \
  build --release

```
