import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import Navbar from '@/components/Navbar';
import { colors } from '@/theme/theme';
import AuthProvider from '@/providers/auth-provider'
import { SplashScreenController } from '@/components/splash-screen-controller'

function RootNavigator() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <Navbar />
        <View style={styles.main}>
          <Slot />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SplashScreenController />
      <RootNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  main: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
