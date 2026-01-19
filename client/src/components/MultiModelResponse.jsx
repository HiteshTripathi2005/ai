import React, { useState } from 'react';
import { Check, ChevronRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ToolCallRenderer from './ToolCallRenderer';
import cx from 'clsx';
import { modelNames } from '../data/model';

function MultiModelResponse({ msg, onSelectModel }) {
  const responses = msg.multiModelResponses || [];
  const [expandedModel, setExpandedModel] = useState(null);
  
  // Find selected response
  const selectedResponse = responses.find(r => r.selected);
  
  // If there's a selected response and we're not in selection mode, show only that
  const showOnlySelected = selectedResponse && !expandedModel;

  const renderParts = (parts) => {
    return parts.map((part, index) => {
      if (part.type === 'text') {
        return (
          <div key={`part-${index}`} className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                ul: ({children}) => <ul style={{listStyleType: 'disc'}}>{children}</ul>,
                ol: ({children}) => <ol style={{listStyleType: 'decimal'}}>{children}</ol>,
                li: ({children}) => <li>{children}</li>
              }}
            >
              {part.text}
            </ReactMarkdown>
          </div>
        );
      } else if (part.type === 'tool-call') {
        return (
          <div key={`part-${index}`}>
            <ToolCallRenderer part={part} index={index} />
          </div>
        );
      }
      return null;
    });
  };

  if (showOnlySelected) {
    // Show only the selected response
    return (
      <div className="w-full flex mb-4 justify-start">
        <div className="max-w-[min(85%,700px)] mr-12">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {modelNames[selectedResponse.model]?.name || selectedResponse.model}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  Selected
                </span>
              </div>
              <button
                onClick={() => setExpandedModel('all')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View all responses
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {renderParts(selectedResponse.parts)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show all responses in selection mode
  return (
    <div className="w-full mb-4">
      <div className="mb-2 px-2 text-xs text-zinc-500 dark:text-zinc-400">
        {selectedResponse ? 'All model responses:' : 'Compare and select your preferred response:'}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {responses.map((response, idx) => (
          <div
            key={idx}
            className={cx(
              "border rounded-lg p-4 transition-all",
              response.selected
                ? "border-green-500 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10"
                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-500"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {modelNames[response.model]?.name || response.model}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {modelNames[response.model]?.provider || ''}
                </div>
              </div>
              {response.selected ? (
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  <Check className="h-3 w-3" />
                  Selected
                </div>
              ) : (
                <button
                  onClick={() => onSelectModel(msg.id, response.model)}
                  className="text-xs px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Select
                </button>
              )}
            </div>
            <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 max-h-64 overflow-y-auto">
              {renderParts(response.parts)}
            </div>
          </div>
        ))}
      </div>
      {selectedResponse && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setExpandedModel(null)}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Show only selected response
          </button>
        </div>
      )}
    </div>
  );
}

export default MultiModelResponse;

