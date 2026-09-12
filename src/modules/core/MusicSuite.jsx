import React, { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';
import InstrumentSelection from './InstrumentSelection';
import PianoMagico from '../piano-magico/PianoMagico'; // Piano Mágico
import UkeHero from '../uke-hero/UkeHero'; // Ukelele
import MusicStudio from '../studio/MusicStudio'; // Estudio Grabación

const API_URL = 'backend/api.php';

export default function MusicSuite() {
    const [userId, setUserId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [currentApp, setCurrentApp] = useState('menu'); // 'menu', 'piano', 'guitar'
    const [users, setUsers] = useState([]);

    // Cargar usuarios al iniciar
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API_URL}?action=get_users`);
                const data = await res.json();
                setUsers(data || []);
            } catch (e) {
                console.error("Error fetching users:", e);
            }
        };
        fetchUsers();
    }, []);

    // Cargar perfil cuando userId cambie
    useEffect(() => {
        if (!userId) {
            setProfile(null);
            setCurrentApp('menu');
            return;
        }
        const loadProfile = async () => {
            try {
                const resProfile = await fetch(`${API_URL}?action=get_profile&user_id=${userId}`);
                const dataProfile = await resProfile.json();
                if (dataProfile) setProfile({ name: dataProfile.name, avatarId: dataProfile.avatar_id, totalScore: dataProfile.total_score });
            } catch (e) {
                console.error("Error fetching profile", e);
            }
        };
        loadProfile();
    }, [userId]);

    const handleLogin = (id) => {
        setUserId(id);
        setCurrentApp('menu');
    };

    const handleLogout = () => {
        setUserId(null);
    };

    // Renderizar la vista correspondiente
    if (!userId) {
        return <LoginScreen users={users} onLogin={handleLogin} />;
    }

    if (currentApp === 'menu') {
        return <InstrumentSelection profile={profile} onSelectApp={setCurrentApp} onLogout={handleLogout} />;
    }

    if (currentApp === 'piano') {
        return <PianoMagico userId={userId} onExit={() => setCurrentApp('menu')} />;
    }

    if (currentApp === 'guitar') {
        return <UkeHero userId={userId} onExit={() => setCurrentApp('menu')} />;
    }

    if (currentApp === 'studio') {
        return <MusicStudio userId={userId} onExit={() => setCurrentApp('menu')} />;
    }

    return null;
}
