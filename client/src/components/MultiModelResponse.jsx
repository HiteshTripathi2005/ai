import React, { useState } from 'react';
import { Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ToolCallRenderer from './ToolCallRenderer';
import { modelNames } from '../data/model';

function MultiModelResponse({ msg, onSelectModel }) {
  const responses = msg.multiModelResponses || [];
  const [showAll, setShowAll] = useState(false);
  const selectedResponse = responses.find(r => r.selected);

  const renderParts = (parts) => {
    return parts.map((part, i) => {
      if (part.type === 'text') {
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} className="prose prose-sm dark:prose-invert">
            {part.text}
          </ReactMarkdown>
        );
      }
      if (part.type === 'tool-call') {
        return <ToolCallRenderer key={i} part={part} index={i} />;
      }
      return null;
    });
  };

  // Show only selected
  if (selectedResponse && !showAll) {
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[80%]">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {modelNames[selectedResponse.model]?.name}
              </span>
              <button
                onClick={() => setShowAll(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="text-sm">{renderParts(selectedResponse.parts)}</div>
          </div>
        </div>
      </div>
    );
  }

  // Show all responses
  return (
    <div className="mb-4">
      <p className="text-xs text-zinc-500 mb-2">Select your preferred response:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {responses.map((response, i) => (
          <div
            key={i}
            className={`border rounded-lg p-4 ${
              response.selected
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium">
                  {modelNames[response.model]?.name}
                </div>
                <div className="text-xs text-zinc-500">
                  {modelNames[response.model]?.provider}
                </div>
              </div>
              {response.selected ? (
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center gap-1">
                  <Check className="h-3 w-3" /> Selected
                </span>
              ) : (
                <button
                  onClick={() => onSelectModel(msg.id, response.model)}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Select
                </button>
              )}
            </div>
            <div className="text-sm max-h-64 overflow-y-auto">
              {renderParts(response.parts)}
            </div>
          </div>
        ))}
      </div>
      {selectedResponse && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-zinc-600 hover:text-zinc-900 mt-2 mx-auto block"
        >
          Show only selected
        </button>
      )}
    </div>
  );
}

export default MultiModelResponse;

