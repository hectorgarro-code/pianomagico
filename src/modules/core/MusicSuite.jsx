import React, { useState, useEffect, useReducer } from 'react';
import LoginScreen from './LoginScreen';
import GameApp from '../../game/GameApp';
import { profileEntryReducer, getEntryScreen } from './profileEntryFlow.js';

export default function MusicSuite() {
    const [userId, dispatch] = useReducer(profileEntryReducer, null);
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

    if (getEntryScreen(userId) === 'PROFILE') return <LoginScreen
        users={users} loading={loading} error={error} onRetry={() => setRetry(value => value + 1)}
        onLogin={id => {
            if (users.some(user => Number(user.id) === Number(id))) dispatch({ type: 'SELECT_PROFILE', userId: id });
        }}
    />;

    return <GameApp key={userId} userId={userId} onExitApp={() => dispatch({ type: 'EXIT_VALLE' })} />;
}
