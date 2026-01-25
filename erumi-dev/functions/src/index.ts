import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({ maxInstances: 10 });

// Gemini API 프록시
export const gemini = onRequest(
    { cors: true, secrets: ["GEMINI_API_KEY"] },
    async (req, res) => {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                res.status(500).json({ error: "API key not configured" });
                return;
            }

            const { prompt, model = "gemini-2.0-flash" } = req.body;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 1024,
                        },
                    }),
                }
            );

            const data = await response.json();
            res.json(data);
        } catch (error) {
            logger.error("Gemini API error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// KASI API 프록시
export const kasi = onRequest(
    { cors: true, secrets: ["KASI_API_KEY"] },
    async (req, res) => {
        try {
            const apiKey = process.env.KASI_API_KEY;
            if (!apiKey) {
                res.status(500).json({ error: "API key not configured" });
                return;
            }

            const { endpoint, params } = req.body;

            const url = new URL(`https://apis.data.go.kr/${endpoint}`);
            url.searchParams.set("serviceKey", apiKey);

            // 요청 파라미터 추가
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.set(key, String(value));
                });
            }

            const response = await fetch(url.toString());
            const data = await response.json();

            res.json(data);
        } catch (error) {
            logger.error("KASI API error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);
