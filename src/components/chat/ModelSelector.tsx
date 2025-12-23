'use client';

import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
} from '@mui/material';
import { useChatStore } from '@/store/chatStore';

const AVAILABLE_MODELS = [
    { value: 'gpt-5.1', label: 'GPT-5.1' },
    { value: 'gpt-5', label: 'GPT-5' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'o1', label: 'o1 (Reasoning)' },
    { value: 'o4-mini', label: 'o4-mini (Reasoning)' },
];

interface ModelSelectorProps {
    disabled?: boolean;
}

export function ModelSelector({ disabled }: ModelSelectorProps) {
    const { selectedModel, setSelectedModel, isStreaming } = useChatStore();

    const handleChange = (event: SelectChangeEvent<string>) => {
        setSelectedModel(event.target.value);
    };

    return (
        <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="model-selector-label">Model</InputLabel>
            <Select
                labelId="model-selector-label"
                id="model-selector"
                value={selectedModel}
                label="Model"
                onChange={handleChange}
                disabled={disabled || isStreaming}
                sx={{
                    '& .MuiSelect-select': {
                        py: 0.75,
                    },
                }}
            >
                {AVAILABLE_MODELS.map((model) => (
                    <MenuItem key={model.value} value={model.value}>
                        {model.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
