import React, { useState, useEffect } from 'react';
import { getResourceContent } from '../../../lib/gemini';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

const ResourceDetailModal = ({ resource, onClose }) => {
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            const aiContent = await getResourceContent(resource.title);
            setContent(aiContent);
            setIsLoading(false);
        };
        fetchContent();
    }, [resource]);
    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="emote-title-gradient">{resource.title}</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-4">
                        <svg className="h-8 w-8 animate-spin text-emote-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-emote-muted text-emote-ink-soft">Generating personalized advice…</p>
                    </div>
                ) : (
                    <div className="space-y-6 text-emote-ink-soft">
                        <div>
                            <h3 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">Top tips</h3>
                            <ul className="list-inside list-disc space-y-2 text-emote-body leading-relaxed">
                                {content.tips?.map((tip, index) => <li key={index}>{tip}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">Exercise: {content.exercise?.title}</h3>
                            <ol className="list-inside list-decimal space-y-2 text-emote-body leading-relaxed">
                                {content.exercise?.steps?.map((step, index) => <li key={index}>{step}</li>)}
                            </ol>
                        </div>
                        <div>
                            <h3 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">Affirmation</h3>
                            <p className="border-y border-emote-border py-4 text-center text-emote-card-title italic text-emote-accent-2">&ldquo;{content.affirmation}&rdquo;</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ResourceDetailModal;
