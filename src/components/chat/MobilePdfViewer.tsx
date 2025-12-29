'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';

// We'll import pdfjs dynamically to avoid issues with Next.js/ESM at the top level
// This also helps with some bundler-specific issues with GlobalWorkerOptions

interface MobilePdfViewerProps {
    url: string;
}

export function MobilePdfViewer({ url }: MobilePdfViewerProps) {
    const [pdf, setPdf] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfjs, setPdfjs] = useState<any>(null);

    useEffect(() => {
        const initPdfjs = async () => {
            try {
                // Dynamically import pdfjs-dist
                const lib = await import('pdfjs-dist');
                // Set worker source
                if (typeof window !== 'undefined') {
                    lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
                }
                setPdfjs(lib);
            } catch (err: any) {
                console.error('Error initializing pdfjs:', err);
                setError('Failed to initialize PDF viewer');
                setLoading(false);
            }
        };

        initPdfjs();
    }, []);

    useEffect(() => {
        if (!pdfjs || !url) return;

        let isActive = true;

        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load the PDF
                const loadingTask = pdfjs.getDocument(url);
                const loadedPdf = await loadingTask.promise;

                if (isActive) {
                    setPdf(loadedPdf);
                    setLoading(false);
                }
            } catch (err: any) {
                if (isActive) {
                    console.error('Error loading PDF:', err);
                    setError(err.message || 'Failed to load PDF');
                    setLoading(false);
                }
            }
        };

        loadPdf();

        return () => {
            isActive = false;
        };
    }, [url, pdfjs]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error">Error: {error}</Typography>
            </Box>
        );
    }

    if (!pdf) return null;

    return (
        <Stack spacing={2} alignItems="center" sx={{ width: '100%', height: '100%', overflowY: 'auto', p: 1, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Rendering {pdf.numPages} pages via Canvas (Mobile Mode)
            </Typography>
            {Array.from(new Array(pdf.numPages), (el, index) => (
                <PdfPage key={`page_${index + 1}`} pdf={pdf} pageNumber={index + 1} />
            ))}
        </Stack>
    );
}

function PdfPage({ pdf, pageNumber }: { pdf: any; pageNumber: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        const renderPage = async () => {
            if (!canvasRef.current || !pdf) return;

            try {
                const page = await pdf.getPage(pageNumber);

                // Adjust scale for mobile screens
                const viewport = page.getViewport({ scale: 2.0 });

                // Calculate scale to fit parent container width
                const containerWidth = window.innerWidth - 32;
                const scale = containerWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale: scale > 0 ? scale * (window.devicePixelRatio || 1) : 1.0 });

                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;

                canvas.style.width = '100%';
                canvas.style.height = 'auto';

                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport,
                };

                await page.render(renderContext).promise;
                setRendered(true);
            } catch (err) {
                console.error(`Error rendering page ${pageNumber}:`, err);
            }
        };

        renderPage();
    }, [pdf, pageNumber]);

    return (
        <Box sx={{ boxShadow: 1, borderRadius: 1, bgcolor: 'background.paper', overflow: 'hidden', width: '100%' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />
        </Box>
    );
}
