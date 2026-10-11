import React, { useState, useEffect, useReducer, useMemo } from 'react';
import LoginScreen from './LoginScreen';
import GameApp from '../../game/GameApp';
import { initialEntry, entryReducer, entrySummary } from '../../game/entry/entryExperience.js';
import { SharedWorldProvider } from '../../game/entry/SharedWorld.jsx';
import TitleScreen from '../../game/entry/TitleScreen.jsx';
import WorldMusic from '../../game/audio/WorldMusic.jsx';
import { progressService } from '../../game/services/progressService.js';
import { gameplayPersistence } from '../../game/gameplay/gameplayState.js';
import { normalizeGameProfile } from '../../game/services/profileAdapter.js';
import '../../game/entry/entryExperience.css';

export default function MusicSuite() {
    const [entry, dispatch] = useReducer(entryReducer, undefined, initialEntry);
    const userId = entry.userId;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (userId !== null) return;
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        fetch('backend/api.php?action=get_users', { signal: controller.signal })
            .then(async response => {
                if (!response.ok) throw new Error('No se pudieron cargar los perfiles.');
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error('No se pudieron cargar los perfiles.');
                if (!controller.signal.aborted) setUsers(data);
            })
            .catch(reason => { if (!controller.signal.aborted) setError(reason.message); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [retry, userId]);

    const profiles = useMemo(() => users.map(user => {
        const summary = entrySummary(progressService.loadAdventure(user.id));
        const gameplay = gameplayPersistence().load(user.id);
        let preferred; try { preferred = localStorage.getItem(`user_avatar_${user.id}`); } catch { /* Optional local preference. */ }
        return { ...user, avatarId: normalizeGameProfile(user, preferred)?.avatarId ?? 1, summary, petId: gameplay.equippedPetId };
    }), [users, userId]);
    return <SharedWorldProvider presentation={false}>
    {entry.screen === 'TITLE' ? <TitleScreen onEnter={() => { window.dispatchEvent(new Event('valley-entry-unlock')); dispatch({ type: 'ENTER' }); }}/> : entry.screen === 'PROFILES' ? <LoginScreen
        users={profiles} loading={loading} error={error} onRetry={() => setRetry(value => value + 1)} onBack={() => dispatch({ type: 'BACK' })}
        onLogin={id => {
            if (users.some(user => Number(user.id) === Number(id))) dispatch({ type: 'PROFILE', userId: id });
        }}
    /> : <GameApp key={userId} sharedEntry userId={userId} onExitApp={() => dispatch({ type: 'EXIT' })} />}
    {userId === null && <div className="entry-sound"><WorldMusic unlockOnEntry active={entry.screen !== 'TITLE'} immediatePause={entry.screen === 'TITLE'}/></div>}
    </SharedWorldProvider>;
}
