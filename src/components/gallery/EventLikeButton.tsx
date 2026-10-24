'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, User, Sparkles } from 'lucide-react';
import { useLike } from '@/hooks/useLike';

interface EventLikeButtonProps {
  eventId: string;
  eventTitle: string;
  currentUserId: string | null;
}

export default function EventLikeButton({
  eventId,
  eventTitle,
  currentUserId,
}: EventLikeButtonProps) {
  const { liked, likeCount, likers, toggleLike, loading, error } = useLike(
    eventId,
    eventTitle,
    currentUserId
  );
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleClick = async () => {
    if (!currentUserId) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 4500);
      return;
    }
    await toggleLike();
  };

  // Up to 4 avatars to display
  const displayedLikers = likers.slice(0, 4);
  const extraCount = Math.max(0, likeCount - displayedLikers.length);

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Heart Action & Count */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          aria-label={liked ? 'Unlike event' : 'Like event'}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
            liked
              ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
              liked
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-400 group-hover:text-rose-500'
            }`}
          />
          <span className="font-extrabold text-[12px] tabular-nums">
            {likeCount}
          </span>
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            {likeCount === 1 ? 'Like' : 'Likes'}
          </span>
        </button>

        {/* Instagram-style Likers Avatar Stack */}
        {displayedLikers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden py-0.5">
              {displayedLikers.map((liker, idx) => {
                const initials = liker.full_name
                  ? liker.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'U';

                return (
                  <div
                    key={idx}
                    title={liker.full_name}
                    className="relative w-6 h-6 rounded-full ring-2 ring-white overflow-hidden bg-emerald-700 text-white flex items-center justify-center text-[9px] font-bold shadow-xs shrink-0"
                  >
                    {liker.avatar_url ? (
                      <Image
                        src={liker.avatar_url}
                        alt={liker.full_name}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* +N and Names Text */}
            <span className="text-[11px] text-slate-500 font-medium">
              {displayedLikers[0]?.full_name?.split(' ')[0]}
              {displayedLikers.length > 1 &&
                `, ${displayedLikers[1]?.full_name?.split(' ')[0]}`}
              {extraCount > 0 && (
                <span className="text-slate-700 font-bold ml-1">
                  +{extraCount} more
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Login Prompt Tooltip when unauthenticated visitor clicks */}
      {showLoginPrompt && (
        <div className="absolute left-0 bottom-full mb-2 z-20 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-fade-in">
          <span>Please sign in to like this event</span>
          <Link
            href="/login"
            className="text-emerald-400 font-bold underline hover:text-emerald-300 ml-1"
          >
            Login
          </Link>
        </div>
      )}

      {/* Error message */}
      {error && (
        <span className="text-[11px] text-rose-600 font-medium animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
}
