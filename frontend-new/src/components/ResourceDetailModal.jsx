import React, { useState, useEffect } from 'react';

// Helper function to get resource content from Gemini API
async function getResourceContentWithAI(topic) {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const prompt = `
        As a compassionate psychologist, provide helpful content for someone struggling with "${topic}".
        Provide your response in a structured JSON format. Do not include any text outside of the JSON object.
        The JSON object should have the following keys:
        - "title": A string with the title of the resource (e.g., "Guidance for ${topic}").
        - "tips": An array of 3-4 strings, each being a short, actionable tip.
        - "exercise": An object with "title" and "steps" (an array of strings) for a simple, helpful exercise.
        - "affirmation": A single, encouraging affirmation string.
        Topic: "${topic}"
    `;
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        }
    };
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const result = await response.json();
        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
            const content = JSON.parse(result.candidates[0].content.parts[0].text);
            return content;
        } else {
            return { title: `Error Generating Content`, tips: [], exercise: {title: "", steps: []}, affirmation: "Could not generate content at this time." };
        }
    } catch (error) {
        console.error("AI Resource Generation Error:", error);
        return { title: `Error Generating Content`, tips: [], exercise: {title: "", steps: []}, affirmation: "Could not generate content at this time." };
    }
}

const ResourceDetailModal = ({ resource, onClose }) => {
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            const aiContent = await getResourceContentWithAI(resource.title);
            setContent(aiContent);
            setIsLoading(false);
        };
        fetchContent();
    }, [resource]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
            <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-emote shadow-emote-glow">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 className="emote-title-gradient text-emote-section">{resource.title}</h2>
                    <button type="button" onClick={onClose} className="emote-icon-btn h-9 w-9" aria-label="Close">
                        <span className="text-emote-page leading-none text-slate-500">&times;</span>
                    </button>
                </div>
                {isLoading ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-4">
                        <svg className="h-8 w-8 animate-spin text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-emote-muted text-slate-600">Generating personalized advice…</p>
                    </div>
                ) : (
                    <div className="space-y-6 text-slate-700">
                        <div>
                            <h3 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-teal-600">Top tips</h3>
                            <ul className="list-inside list-disc space-y-2 text-emote-body leading-relaxed">
                                {content.tips?.map((tip, index) => <li key={index}>{tip}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-teal-600">Exercise: {content.exercise?.title}</h3>
                            <ol className="list-inside list-decimal space-y-2 text-emote-body leading-relaxed">
                                {content.exercise?.steps?.map((step, index) => <li key={index}>{step}</li>)}
                            </ol>
                        </div>
                        <div>
                            <h3 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-teal-600">Affirmation</h3>
                            <p className="border-y border-slate-200 py-4 text-center text-emote-card-title italic text-sky-800">&ldquo;{content.affirmation}&rdquo;</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceDetailModal;