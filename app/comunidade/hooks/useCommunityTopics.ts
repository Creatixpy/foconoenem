"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, withSupabaseTimeout } from "@/lib/supabase";

type CommunityTopic = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  created_at: string;
};

export function useCommunityTopics() {
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await withSupabaseTimeout(async (signal) => {
        return await supabase
          .from("community_topics")
          .select("*")
          .order("title", { ascending: true })
          .abortSignal(signal);
      });

      if (error) throw error;
      setTopics(data ?? []);
    } catch (error) {
      console.error("Erro ao carregar tópicos:", error);
      setError("Não foi possível carregar os tópicos agora. Tente novamente em alguns minutos.");
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  return { topics, loading, error, reload: loadTopics };
}
