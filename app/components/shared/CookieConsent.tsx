"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "foconoenem_cookie_consent_v1";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                setVisible(true);
            }
        } catch {
            setVisible(true);
        }
    }, []);

    const acceptConsent = () => {
        localStorage.setItem(STORAGE_KEY, "accepted");
        setVisible(false);
    };

    if (!visible) {
        return null;
    }

    return (
        <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
            <div className="cookie-consent__content">
                <p className="cookie-consent__text">
                    Utilizamos cookies essenciais para manter sua sessão, preferências de tema e métricas básicas de desempenho.
                    Nenhum dado sensível é compartilhado com terceiros sem consentimento.
                </p>
                <div className="cookie-consent__actions">
                    <button type="button" className="btn btn-primary text-sm" onClick={acceptConsent}>
                        Entendi e aceito
                    </button>
                    <a
                        href="/privacidade"
                        className="text-sm font-semibold text-primary underline decoration-dotted"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Saiba mais
                    </a>
                </div>
            </div>
        </div>
    );
}
