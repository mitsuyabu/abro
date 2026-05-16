'use client';

import { useState, useRef } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = '何でも聞いてください...' }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex items-end gap-3 bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
      <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 mb-0.5">
        <span className="text-sm">＋</span>
      </button>
      <textarea
        ref={textareaRef}
        className="flex-1 resize-none bg-transparent text-primary text-sm outline-none placeholder:text-muted min-h-[24px] max-h-[200px]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        rows={1}
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition-colors ${
          value.trim() && !disabled ? 'bg-primary text-white hover:opacity-80' : 'bg-gray-100 text-muted'
        }`}
      >
        <span className="text-sm">↑</span>
      </button>
    </div>
  );
}
