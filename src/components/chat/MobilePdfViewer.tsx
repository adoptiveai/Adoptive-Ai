'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source to unpkg CDN for the installed version
// Note: We use the version matching package.json (approx 5.4.149)
// If this fails due to CORS or version mismatch, we might need to copy worker to public/
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface MobilePdfViewerProps {
    url: string;
}

export function MobilePdfViewer({ url }: MobilePdfViewerProps) {
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load the PDF
                const loadingTask = pdfjsLib.getDocument(url);
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

        if (url) {
            loadPdf();
        }

        return () => {
            isActive = false;
        };
    }, [url]);

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

function PdfPage({ pdf, pageNumber }: { pdf: pdfjsLib.PDFDocumentProxy; pageNumber: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        const renderPage = async () => {
            if (!canvasRef.current || !pdf) return;

            try {
                const page = await pdf.getPage(pageNumber);

                // Adjust scale for mobile screens
                // Use a reasonable scale like 1.0 or responsive based on window width
                // For simplicity, we assume standard width fitting
                const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better resolution

                // Calculate scale to fit parent container width, considering device pixel ratio for sharpness
                const containerWidth = window.innerWidth - 32; // minus padding
                const scale = containerWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale: scale > 0 ? scale * (window.devicePixelRatio || 1) : 1.0 });

                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;

                // Ensure canvas fits visually within container
                canvas.style.width = '100%';
                canvas.style.height = 'auto';

                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport,
                };

                await page.render(renderContext as any).promise;
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
