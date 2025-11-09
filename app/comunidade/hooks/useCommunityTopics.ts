"use client";

import { useCallback, useEffect, useState } from "react";

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

      const data = await fetchCommunityTopics();
      setTopics(data);
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

async function fetchCommunityTopics(): Promise<CommunityTopic[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const response = await fetch("/api/comunidade/topics", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API de tópicos respondeu ${response.status}`);
  }

  const payload = (await response.json()) as { topics?: CommunityTopic[] };
  return payload.topics ?? [];
}
