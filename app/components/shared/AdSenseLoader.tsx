'use client';

import { useEffect } from "react";

const SCRIPT_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8449266040565561";
const ALLOWED_MODES = new Set(["development", "production"]);

export default function AdSenseLoader() {
    useEffect(() => {
        if (!ALLOWED_MODES.has(process.env.NODE_ENV ?? "production")) {
            return;
        }

        if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
            return;
        }

        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    return null;
}
