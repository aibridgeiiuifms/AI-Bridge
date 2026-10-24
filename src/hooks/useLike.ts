'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/tracking/trackEvent';
import { EventLikerInfo } from '@/types/database';

interface UseLikeResult {
  liked: boolean;
  likeCount: number;
  likers: EventLikerInfo[];
  toggleLike: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useLike(
  eventId: string,
  eventTitle: string,
  currentUserId: string | null
): UseLikeResult {
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likers, setLikers] = useState<EventLikerInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastClickRef = useRef<number>(0);
  const supabase = createClient();

  // Load summary and user's like state
  const loadLikeData = useCallback(async () => {
    if (!eventId) return;

    try {
      // 1. Fetch aggregated like summary view
      const { data: summary } = await supabase
        .from('event_like_summary')
        .select('like_count, likers')
        .eq('event_id', eventId)
        .maybeSingle();

      if (summary) {
        setLikeCount(summary.like_count || 0);
        setLikers(Array.isArray(summary.likers) ? summary.likers : []);
      } else {
        // Fallback if view is empty or event has no likes yet
        const { count } = await supabase
          .from('event_likes')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventId);
        setLikeCount(count || 0);
        setLikers([]);
      }

      // 2. Check if current user has already liked this event
      if (currentUserId) {
        const { data: userLike } = await supabase
          .from('event_likes')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', currentUserId)
          .maybeSingle();

        setLiked(Boolean(userLike));
      } else {
        setLiked(false);
      }
    } catch (err: any) {
      console.error('Error fetching event likes:', err);
    }
  }, [eventId, currentUserId]);

  useEffect(() => {
    loadLikeData();
  }, [loadLikeData]);

  // Toggle like/unlike with optimistic update & rollback
  const toggleLike = useCallback(async () => {
    if (!currentUserId) {
      setError('Please sign in to like this event.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // 500ms debounce
    const now = Date.now();
    if (now - lastClickRef.current < 500) return;
    lastClickRef.current = now;

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    const nextCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    // Optimistic UI state update
    setLiked(nextLiked);
    setLikeCount(nextCount);
    setLoading(true);
    setError(null);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/events';

    try {
      if (nextLiked) {
        // User is liking
        const { error: insertErr } = await supabase.from('event_likes').insert({
          event_id: eventId,
          user_id: currentUserId,
        });

        if (insertErr) {
          // If already liked (unique constraint), silent catch
          if (!insertErr.message.includes('unique_event_like')) {
            throw insertErr;
          }
        }

        trackEvent('event_liked', currentPath, {
          event_id: eventId,
          event_title: eventTitle,
        });
      } else {
        // User is unliking
        const { error: deleteErr } = await supabase
          .from('event_likes')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', currentUserId);

        if (deleteErr) throw deleteErr;

        trackEvent('event_unliked', currentPath, {
          event_id: eventId,
          event_title: eventTitle,
        });
      }

      // Re-fetch summary in background for accurate avatar list
      loadLikeData();
    } catch (err: any) {
      console.error('Failed to toggle like:', err);
      // Rollback to prior state
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setError('Failed to update like. Please try again.');
      setTimeout(() => setError(null), 3500);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, liked, likeCount, eventId, eventTitle, loadLikeData]);

  return {
    liked,
    likeCount,
    likers,
    toggleLike,
    loading,
    error,
  };
}
