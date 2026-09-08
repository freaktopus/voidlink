import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { PermissionsRequest } from '@/components/PermissionsRequest';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PermissionsRequest onPermissionsGranted={() => setPermissionsGranted(true)}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Home' , headerShown: false}} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </PermissionsRequest>
    </ThemeProvider>
  );
}
