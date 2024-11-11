import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: username,
                password: password,
            });

            if (error) {
                throw new Error(error.message);
            }

            onLogin(data.session.access_token);
            navigate('/faq-editor');
        } catch (err) {
            console.error('Login failed:', err.message);
            alert('Login failed, please check credentials.');
        }
    };

    return (
        <div className="login_body">
            <form className="login_form" onSubmit={handleLogin}>
                <h1 className="login_title">Login</h1>
                <div className="login_input_box">
                    <input
                        type="text"
                        placeholder="Email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="login_input_box">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="login_check">
                    <button className="login_button" type="submit">Login</button>
                </div>
            </form>
        </div>
    );
}

export default Login;