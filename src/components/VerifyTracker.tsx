'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/tracking/trackEvent';

interface VerifyTrackerProps {
  certificateId: string;
  isValid: boolean;
}

export default function VerifyTracker({ certificateId, isValid }: VerifyTrackerProps) {
  useEffect(() => {
    if (!certificateId) return;
    trackEvent('certificate_verified', `/verify/${certificateId}`, {
      certificate_id: certificateId,
      is_valid: isValid,
    });
  }, [certificateId, isValid]);

  return null;
}
