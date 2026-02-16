"use client";

import { useState, useEffect } from "react";

interface WgerMedia {
  images: string[];
  videos: string[];
  nameTr: string | null;
  nameEn: string | null;
}

// Client-side cache
const mediaCache = new Map<string, WgerMedia>();

/**
 * Fetches wger media (images and videos) for a given exercise ID.
 * Returns cached data immediately if available.
 */
export function useWgerMedia(exerciseId: string) {
  const [media, setMedia] = useState<WgerMedia | null>(
    mediaCache.get(exerciseId) || null
  );
  const [loading, setLoading] = useState(!mediaCache.has(exerciseId));

  useEffect(() => {
    if (mediaCache.has(exerciseId)) {
      setMedia(mediaCache.get(exerciseId)!);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/wger?id=${exerciseId}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        const mediaData: WgerMedia = {
          images: data.images || [],
          videos: data.videos || [],
          nameTr: data.nameTr || null,
          nameEn: data.nameEn || null,
        };
        mediaCache.set(exerciseId, mediaData);
        if (!cancelled) {
          setMedia(mediaData);
        }
      } catch {
        // Silently fail - static images will be used as fallback
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMedia();
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  return {
    media,
    loading,
    hasVideo: (media?.videos.length ?? 0) > 0,
    hasWgerImage: (media?.images.length ?? 0) > 0,
    videoUrl: media?.videos[0] || null,
    wgerImageUrl: media?.images[0] || null,
  };
}
