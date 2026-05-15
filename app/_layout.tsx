import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import '../global.css';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

const queryClient = new QueryClient();

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading, isOnboarded, setSession, setIsLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, newSession) => {
      setSession(newSession);
      setIsLoading(false);

      if (newSession) {
        await fetchUser();
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchUser().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && !isOnboarded && !(segments as string[]).includes('onboarding')) {
      router.replace('/(auth)/onboarding');
    } else if (session && isOnboarded && inAuthGroup) {
      router.replace('/(tabs)/chats');
    }
  }, [session, isLoading, isOnboarded, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}
