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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">{resource.title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold transition-colors">&times;</button>
                </div>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="flex flex-col items-center gap-4">
                            <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="text-purple-300">Generating personalized advice...</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-300 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-teal-400 mb-2">Top Tips</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-300">
                                {content.tips?.map((tip, index) => <li key={index}>{tip}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-teal-400 mb-2">A Simple Exercise: {content.exercise?.title}</h3>
                            <ol className="list-decimal list-inside space-y-2 text-gray-300">
                                {content.exercise?.steps?.map((step, index) => <li key={index}>{step}</li>)}
                            </ol>
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold text-teal-400 mb-2">Positive Affirmation</h3>
                            <p className="text-center italic text-xl border-t border-b border-gray-700 py-4 text-purple-300">"{content.affirmation}"</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceDetailModal;