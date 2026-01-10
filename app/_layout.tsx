import React, { Suspense } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Text } from 'react-native';

export default function Layout() {
  return (
    <Suspense fallback={<Text>Loading DB…</Text>}>
      <SQLiteProvider
        databaseName="bible.db"
        assetSource={{ assetId: require('./assets/bible.db') }} // adjust if needed
        useSuspense
      >
        <Stack screenOptions={{ headerShown: false }} />
      </SQLiteProvider>
    </Suspense>
  );
}
