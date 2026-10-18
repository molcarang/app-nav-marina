import { createContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { anchorDistanceMeters, anchorWatchStatus, filterAnchorWatch, validAnchorDraft } from '../model/anchor';

const STORAGE_KEY = '@anchor_watch_v1';
export const AnchorWatchContext = createContext(null);

export function useAnchorWatch(position, receivedAt, connected) {
    const [draft, setDraft] = useState(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [now, setNow] = useState(Date.now);
    const busy = useRef(false);
    const [filtered, setFiltered] = useState(null);
    useEffect(() => {
        let mounted = true;
        AsyncStorage.getItem(STORAGE_KEY).then(raw => {
            const saved = raw ? JSON.parse(raw) : null;
            if (mounted && validAnchorDraft(saved)) setDraft(saved);
        }).catch(() => { if (mounted) setError('anchorLoadError'); })
            .finally(() => { if (mounted) setReady(true); });
        return () => { mounted = false; };
    }, []);
    useEffect(() => {
        if (!draft) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [draft]);
    const activate = async next => {
        if (!ready || busy.current || !validAnchorDraft(next)) return false;
        busy.current = true;
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            setNow(Date.now());
            setDraft(next);
            setError('');
            return true;
        } finally { busy.current = false; }
    };
    const deactivate = async () => {
        if (!ready || busy.current) return;
        busy.current = true;
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setDraft(null);
            setError('');
        } catch { setError('anchorDisableError'); }
        finally { busy.current = false; }
    };
    const rawStatus = anchorWatchStatus(draft, position, receivedAt, connected, Math.max(now, Date.now()));
    useEffect(() => {
        setFiltered(previous => ({ draft, observation: filterAnchorWatch(
            previous?.draft === draft ? previous.observation : null, rawStatus, receivedAt,
        ) }));
    }, [draft, rawStatus, receivedAt]);
    const status = rawStatus === 'outside'
        ? (filtered?.draft === draft && filtered.observation.status === 'outside' ? 'outside' : 'pending')
        : rawStatus;
    const distanceMeters = rawStatus === 'watching' || rawStatus === 'outside'
        ? anchorDistanceMeters(draft.center, position) : null;
    return { draft, ready, error, activate, deactivate, status, distanceMeters };
}
