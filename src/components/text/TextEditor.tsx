"use client";

import { useState } from "react";
import { Copy, Check, Trash2, Clipboard, Sparkles } from "lucide-react";

interface TextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  sourceLanguageName?: string;
}

export function TextEditor({
  value,
  onChange,
  placeholder = "Type, speak, or paste any text in Tamil, Hindi, English, Spanish, or 30+ languages...",
  sourceLanguageName,
}: TextEditorProps) {
  const [copied, setCopied] = useState(false);

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(value ? `${value}\n${text}` : text);
      }
    } catch (err) {
      console.error("Paste failed", err);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="w-full flex flex-col rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-xl">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">
            {sourceLanguageName ? `${sourceLanguageName} Source Text` : "Input Editor"}
          </span>
        </div>

        {/* Toolbar Buttons: Copy, Paste, Clear */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePaste}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-[11px] font-medium transition-colors"
            title="Paste from clipboard"
          >
            <Clipboard className="h-3 w-3" />
            <span className="hidden sm:inline">Paste</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!value}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-[11px] font-medium transition-colors disabled:opacity-40"
            title="Copy text"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleClear}
            disabled={!value}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/10 text-[11px] font-medium transition-colors disabled:opacity-40"
            title="Clear all text"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Text Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="w-full p-4 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
      />

      {/* Editor Footer / Word & Character Counter (Section 15) */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-slate-950/20 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
        <span className="text-[10px] text-slate-500">Unicode UTF-8</span>
      </div>
    </div>
  );
}
