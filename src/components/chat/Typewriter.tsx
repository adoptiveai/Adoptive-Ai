import { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
    content: string;
    speed?: number;
    onComplete?: () => void;
}

export function Typewriter({ content, speed = 10, onComplete }: TypewriterProps) {
    const [displayedContent, setDisplayedContent] = useState('');
    const indexRef = useRef(0);
    const contentRef = useRef(content);

    // Keep content ref up to date
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    useEffect(() => {
        // If we've already displayed everything, and new content arrives, we just need to continue
        // But if content is completely reset (which shouldn't happen for a single message usually, but good to be safe),
        // we might need to reset index. For now, we assume append-only or complete replacement.

        // If the displayed content is already longer than or equal to target content (and they match), do nothing.
        if (displayedContent === content) {
            if (indexRef.current !== content.length) {
                indexRef.current = content.length;
            }
            onComplete?.();
            return;
        }

        const intervalId = setInterval(() => {
            const currentLength = indexRef.current;
            const targetContent = contentRef.current;

            if (currentLength < targetContent.length) {
                // Add next character
                // We can add multiple characters if we want to speed up for long texts, but for now 1 char at a time
                // To make it smoother/faster for large chunks, we could calculate a dynamic step
                const nextChar = targetContent.charAt(currentLength);
                setDisplayedContent((prev) => prev + nextChar);
                indexRef.current += 1;
            } else {
                clearInterval(intervalId);
                onComplete?.();
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [content, speed, onComplete, displayedContent]);

    // If content changed significantly (e.g. completely different string), reset?
    // For this use case, we assume `content` grows. 
    // If `content` is shorter than `displayedContent`, it means we probably switched messages or something, so reset.
    if (content.length < displayedContent.length && !displayedContent.startsWith(content)) {
        setDisplayedContent('');
        indexRef.current = 0;
    }

    return <>{displayedContent}</>;
}
