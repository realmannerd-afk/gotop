"use client";

import { useEffect } from 'react';
import { trackImpressions } from '@/app/actions';

interface ImpressionTrackerProps {
  listingIds: string[];
  placement: string;
}

export function ImpressionTracker({ listingIds, placement }: ImpressionTrackerProps) {
  useEffect(() => {
    if (listingIds.length === 0) return;
    
    // We use a small delay to ensure the user actually "saw" the page (e.g. didn't immediately bounce)
    const timeout = setTimeout(() => {
      trackImpressions(listingIds, placement).catch(console.error);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [listingIds, placement]);
  
  return null;
}
