'use client';

import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface SqlResultsTableProps {
  content: string;
}

interface ParsedSqlContent {
  columns: string[];
  data: string[][];
  comments: string[];
  warnings: string[];
  errors: string[];
}

const parseSqlContent = (content: string): ParsedSqlContent => {
  const lines = content.split('\n');
  const dataLines: string[] = [];
  const commentLines: string[] = [];
  const errorLines: string[] = [];
  const warningLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith('#')) {
      commentLines.push(line);
      if (line.toLowerCase().includes('error')) {
        errorLines.push(line);
      } else if (line.toLowerCase().includes('warning')) {
        warningLines.push(line);
      }
    } else if (line.trim()) {
      dataLines.push(line);
    }
  });

  const result: ParsedSqlContent = {
    columns: [],
    data: [],
    comments: commentLines,
    warnings: warningLines,
    errors: errorLines,
  };

  if (dataLines.length > 0) {
    const rows = dataLines.map((row) => row.split(';'));
    if (rows.length > 0) {
      result.columns = rows[0];
      result.data = rows.slice(1);
    }
  }

  return result;
};

export function SqlResultsTable({ content }: SqlResultsTableProps) {
  const [parsed, setParsed] = useState<ParsedSqlContent>(() => parseSqlContent(content));

  useEffect(() => {
    setParsed(parseSqlContent(content));
  }, [content]);

  const hasMessages = parsed.comments.length > 0 || parsed.errors.length > 0 || parsed.warnings.length > 0;

  return (
    <Box>
      {hasMessages && (
        <Accordion sx={{ mb: 2 }} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Query Information ({parsed.comments.length + parsed.errors.length + parsed.warnings.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {parsed.errors.map((line, index) => (
                <Alert key={`error-${index}`} severity="error" sx={{ fontSize: '0.875rem' }}>
                  {line.replace('#', '').trim()}
                </Alert>
              ))}
              {parsed.warnings.map((line, index) => (
                <Alert key={`warning-${index}`} severity="warning" sx={{ fontSize: '0.875rem' }}>
                  {line.replace('#', '').trim()}
                </Alert>
              ))}
              {parsed.comments
                .filter(
                  (comment) =>
                    !comment.toLowerCase().includes('error') &&
                    !comment.toLowerCase().includes('warning')
                )
                .map((line, index) => (
                  <Typography key={`comment-${index}`} variant="body2" color="text.secondary">
                    {line.replace('#', '').trim()}
                  </Typography>
                ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {parsed.data.length > 0 && parsed.columns.length > 0 ? (
        <Paper elevation={1}>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {parsed.columns.map((column, index) => (
                    <TableCell key={index} sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {parsed.data.map((row, rowIndex) => (
                  <TableRow key={rowIndex} hover>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Typography
                          component="span"
                          sx={{
                            maxWidth: 240,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'inline-block',
                          }}
                          title={cell}
                        >
                          {cell || '-'}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 1, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              {parsed.data.length} rows returned
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Alert severity="info">No data returned from SQL query.</Alert>
      )}
    </Box>
  );
}
