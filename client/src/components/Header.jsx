import React from 'react';
import { Menu, Sparkles, EllipsisVertical, Bot } from "lucide-react";

function ModelTag({ name }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-300">
      <Bot className="h-3.5 w-3.5"/> {name}
    </span>
  );
}

export default function Header({ width, setWidth  }) {
  return (
    <header className="h-14 border-b border-zinc-200/60 dark:border-zinc-800/60 px-3 md:px-5 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 backdrop-blur">
      <div className="flex items-center gap-5">
        <button className={width === 0 ? "" : "md:hidden"} onClick={() => setWidth(width === 0 ? 280 : 0)} aria-label="Open sidebar">
          <Menu className="h-4 w-4"/>
        </button>
        <div className="text-sm text-zinc-500">AI Chat</div>
      </div>
      <div className="flex items-center gap-2">
        <ModelTag name="GPT-Style"/>
        <button className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <Sparkles className="h-4 w-4"/> Explore
        </button>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <EllipsisVertical className="h-5 w-5"/>
        </button>
      </div>
    </header>
  );
}
