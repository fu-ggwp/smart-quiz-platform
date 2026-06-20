"use client";

import { useEffect, useState } from "react";

import { studySetsService } from "@/services/study-sets.service";

function getItems(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.items ?? [];
}

export function usePublicStudySets() {
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPublicStudySets() {
      setLoading(true);

      try {
        const { data } = await studySetsService.listPublic();

        if (active) {
          setStudySets(getItems(data));
          setError(null);
        }
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPublicStudySets();

    return () => {
      active = false;
    };
  }, []);

  return { error, loading, query, setQuery, studySets };
}
