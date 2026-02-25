'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOnboardingStatus(exhibitionCount: number): {
    shouldShowOnboarding: boolean;
    dismissOnboarding: () => void;
} {
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState<boolean>(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem('3dsnap_onboarding_dismissed');
        if (exhibitionCount === 0 && isDismissed !== 'true') {
            setShouldShowOnboarding(true);
        }
    }, [exhibitionCount]);

    const dismissOnboarding = useCallback(() => {
        localStorage.setItem('3dsnap_onboarding_dismissed', 'true');
        setShouldShowOnboarding(false);
    }, []);

    return { shouldShowOnboarding, dismissOnboarding };
}
