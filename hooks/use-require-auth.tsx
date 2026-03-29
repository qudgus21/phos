"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoginModal } from "@/components/ui/login-modal";
import type { User } from "@supabase/supabase-js";

export function useRequireAuth() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user) {
        callback();
      } else {
        setLoginOpen(true);
      }
    },
    [user],
  );

  const loginModal = (
    <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
  );

  return { user, requireAuth, loginModal };
}
