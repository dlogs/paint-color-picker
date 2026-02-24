import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'pcp_global_settings';

export interface GlobalSettings {
    disabledCollections: string[]; // Format: "Brand - Collection"
}

const defaultSettings: GlobalSettings = {
    disabledCollections: [],
};

export function useGlobalSettings() {
    const [settings, setSettings] = useState<GlobalSettings>(() => {
        try {
            const item = window.localStorage.getItem(SETTINGS_KEY);
            return item ? JSON.parse(item) : defaultSettings;
        } catch (error) {
            console.error('Failed to parse global settings', error);
            return defaultSettings;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save global settings', error);
        }
    }, [settings]);

    const toggleCollection = (collectionId: string) => {
        setSettings(prev => {
            const isDisabled = prev.disabledCollections.includes(collectionId);
            return {
                ...prev,
                disabledCollections: isDisabled
                    ? prev.disabledCollections.filter(id => id !== collectionId)
                    : [...prev.disabledCollections, collectionId]
            };
        });
    };

    return {
        settings,
        toggleCollection,
    };
}
