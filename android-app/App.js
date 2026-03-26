import 'react-native-gesture-handler';
import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import AppSplashScreen from './src/components/common/SplashScreen';

// Import NativeWind CSS
import './src/theme/global.css';

// Keep the native Expo splash visible until we explicitly hide it.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  const [splashReady, setSplashReady] = useState(false);

  console.log('[App] splashReady:', splashReady);

  const onSplashReady = useCallback(() => {
    console.log('[App] Splash animation complete');
    setSplashReady(true);
  }, []);

  // Show splash screen until animation is complete
  if (!splashReady) {
    console.log('[App] Rendering splash screen');
    return <AppSplashScreen onReady={onSplashReady} />;
  }

  console.log('[App] Rendering main app');
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
