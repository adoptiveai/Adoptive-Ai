'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { agentClient } from '@/services/agentClient';
import type { AnnotationItem } from '@/types/api';
import { dt } from '@/config/displayTexts';
import { PDFDocument, rgb } from 'pdf-lib';

interface PdfViewerDialogProps {
  open: boolean;
  documentName?: string;
  blockIndices?: number[];
  debug?: boolean;
  keywords?: string[];
  onClose: () => void;
  userId?: string;
}

interface PdfState {
  url: string | null;
  annotations: AnnotationItem[];
  loading: boolean;
  error: string | null;
}

const initialState: PdfState = {
  url: null,
  annotations: [],
  loading: false,
  error: null,
};

export function PdfViewerDialog({ open, documentName, blockIndices, debug, keywords, onClose, userId }: PdfViewerDialogProps) {
  const [state, setState] = useState<PdfState>(initialState);
  const blockSignature = blockIndices?.join(',') ?? '';
  const keywordsSignature = keywords?.join(',') ?? '';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (!open || !documentName) return;
    let active = true;
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const blob = await agentClient.getPdf(documentName);

        const annotationsResponse = debug
          ? await agentClient.debugPdfBlocks({ pdf_file: documentName, user_id: userId })
          : blockIndices && blockIndices.length > 0
            ? await agentClient.getAnnotations({ pdf_file: documentName, block_indices: blockIndices, keywords, user_id: userId })
            : { annotations: [] as AnnotationItem[] };

        const annotations = annotationsResponse.annotations || [];

        // Default to original blob
        objectUrl = URL.createObjectURL(blob);

        // If there are annotations, modify the PDF using pdf-lib
        if (annotations.length > 0) {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            for (const ann of annotations) {
              // Assuming annotation.page is 1-based
              const pageIndex = ann.page - 1;
              if (pageIndex >= 0 && pageIndex < pages.length) {
                const page = pages[pageIndex];
                const { height } = page.getSize();

                // Draw highlight (yellow rectangle with opacity)
                // pdf-lib uses bottom-left origin. We assume annotations are top-left based (standard for screen coords).
                // y_pdf = page_height - y_top_left - height_rect
                page.drawRectangle({
                  x: ann.x,
                  y: height - ann.y - ann.height,
                  width: ann.width,
                  height: ann.height,
                  color: rgb(1, 1, 0),
                  opacity: 0.4,
                });
              }
            }

            const modifiedPdfBytes = await pdfDoc.save();
            // Cast to any to avoid TypeScript error with Blob constructor
            const modifiedBlob = new Blob([modifiedPdfBytes as any], { type: 'application/pdf' });

            // Revoke the original object URL since we are replacing it
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            objectUrl = URL.createObjectURL(modifiedBlob);
          } catch (e) {
            console.error('Error applying highlights:', e);
            // If highlighting fails, we still show the original PDF (objectUrl is already set)
          }
        }

        if (!active) return;
        setState({ url: objectUrl, annotations, loading: false, error: null });
      } catch (error) {
        if (!active) return;
        setState({ url: null, annotations: [], loading: false, error: error instanceof Error ? error.message : String(error) });
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setState(initialState);
    };
  }, [open, documentName, debug, userId, blockSignature, blockIndices, keywordsSignature, keywords]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" fullScreen={isMobile}>
      <DialogTitle>
        {debug ? dt.PDF_DIALOG_DEBUG_PREFIX + ' ' + documentName : dt.PDF_DIALOG_TITLE || 'PDF Viewer'}
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: '100%' }}>
        {state.loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
        {!state.loading && state.error && <Alert severity="error">{state.error}</Alert>}
        {!state.loading && state.url && (
          <Stack spacing={2} sx={{ height: '100%', minHeight: { xs: 'calc(100vh - 100px)', md: '80vh' } }}>
            <Box sx={{ flex: 1, height: '100%' }}>
              <object data={state.url} type="application/pdf" width="100%" height="100%" style={{ minHeight: isMobile ? 'calc(100vh - 150px)' : '800px' }}>
                <p>
                  Your browser does not support PDF embedding.
                  <a href={state.url} download={documentName} target="_blank" rel="noopener noreferrer">
                    Download PDF
                  </a>
                </p>
              </object>
            </Box>
            {state.annotations.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {dt.SOURCE_PDFs || 'Highlighted Segments'}
                </Typography>
                {/* <Stack spacing={1}>
                  {state.annotations.map((annotation, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      Page {annotation.page}: x={annotation.x.toFixed(2)}, y={annotation.y.toFixed(2)} width={annotation.width.toFixed(2)} height={annotation.height.toFixed(2)}
                    </Typography>
                  ))}
                </Stack> */}
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{dt.PDF_DIALOG_CLOSE_BUTTON || 'Close'}</Button>
      </DialogActions>
    </Dialog>
  );
}
