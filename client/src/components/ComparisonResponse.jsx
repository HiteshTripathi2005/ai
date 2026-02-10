import React, { useState } from 'react';
import { Trophy, Clock, Loader2, Check, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import cx from 'clsx';
import { modelNames } from '../data/model';

function ComparisonResponse({ msg }) {
  const [expandedCards, setExpandedCards] = useState({});

  // Determine data source: live streaming state or persisted MongoDB data
  const comparisonState = msg.comparisonState;
  const comparisonData = msg.comparisonData;

  const toggleExpand = (model) => {
    setExpandedCards(prev => ({ ...prev, [model]: !prev[model] }));
  };

  const getModelDisplay = (modelKey) => {
    const info = modelNames[modelKey];
    return {
      name: info?.name || modelKey.split('/').pop()?.split(':')[0] || modelKey,
      provider: info?.provider || modelKey.split('/')[0] || ''
    };
  };

  const renderMarkdown = (text) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        ul: ({ children }) => <ul style={{ listStyleType: 'disc' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ listStyleType: 'decimal' }}>{children}</ol>,
        li: ({ children }) => <li>{children}</li>
      }}
    >
      {text}
    </ReactMarkdown>
  );

  // --- Render from persisted comparisonData (loaded from MongoDB) ---
  if (comparisonData && !comparisonState) {
    const { responses, bestModel, reasoning } = comparisonData;

    return (
      <div className="w-full mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-2">
          {responses.map((r, idx) => {
            const isWinner = r.model === bestModel;
            const display = getModelDisplay(r.model);
            const isExpanded = expandedCards[r.model] || isWinner;

            return (
              <div
                key={idx}
                className={cx(
                  "border rounded-xl p-4 transition-all",
                  isWinner
                    ? "border-yellow-400 dark:border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10 ring-2 ring-yellow-400/30"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isWinner ? (
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-yellow-400 dark:bg-yellow-500 text-white">
                        <Trophy className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold">
                        #{r.rank || idx + 1}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{display.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{display.provider}</div>
                    </div>
                  </div>
                  {isWinner && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">
                      Best Response
                    </span>
                  )}
                </div>

                <div className={cx(
                  "text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 markdown-content",
                  !isExpanded && "max-h-40 overflow-hidden relative"
                )}>
                  {renderMarkdown(r.response)}
                  {!isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
                  )}
                </div>

                {!isWinner && (
                  <button
                    onClick={() => toggleExpand(r.model)}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <><ChevronUp className="h-3 w-3" /> Show less</>
                    ) : (
                      <><ChevronDown className="h-3 w-3" /> Show full response</>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {reasoning && (
          <div className="mx-2 mt-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Why this was chosen:</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">{reasoning}</div>
          </div>
        )}
      </div>
    );
  }

  // --- Render from live comparisonState (streaming SSE) ---
  if (!comparisonState) return null;

  const { models: modelStatuses, phase, result } = comparisonState;
  const modelKeys = Object.keys(modelStatuses);

  return (
    <div className="w-full mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-2">
        {modelKeys.map((modelKey) => {
          const modelState = modelStatuses[modelKey];
          const display = getModelDisplay(modelKey);
          const isWinner = phase === 'complete' && result?.bestModel === modelKey;
          const rank = phase === 'complete' && result?.rankings
            ? result.rankings.indexOf(modelKeys.indexOf(modelKey) + 1) + 1
            : null;
          const isExpanded = expandedCards[modelKey] || isWinner;

          return (
            <div
              key={modelKey}
              className={cx(
                "border rounded-xl p-4 transition-all",
                isWinner
                  ? "border-yellow-400 dark:border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10 ring-2 ring-yellow-400/30"
                  : phase === 'complete'
                  ? "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Status icon */}
                  {modelState.status === 'pending' && (
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                      <Clock className="h-4 w-4" />
                    </div>
                  )}
                  {modelState.status === 'loading' && (
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {modelState.status === 'done' && !isWinner && (
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
                      {phase === 'complete' && rank ? (
                        <span className="text-xs font-bold">#{rank}</span>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  )}
                  {modelState.status === 'done' && isWinner && (
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-yellow-400 dark:bg-yellow-500 text-white">
                      <Trophy className="h-4 w-4" />
                    </div>
                  )}
                  {modelState.status === 'error' && (
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{display.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{display.provider}</div>
                  </div>
                </div>

                {isWinner && (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">
                    Best Response
                  </span>
                )}
                {modelState.status === 'pending' && (
                  <span className="text-xs text-zinc-400">Waiting...</span>
                )}
                {modelState.status === 'loading' && (
                  <span className="text-xs text-blue-500">Processing...</span>
                )}
              </div>

              {/* Response content */}
              {modelState.status === 'done' && modelState.response && (
                <>
                  <div className={cx(
                    "text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 markdown-content",
                    !isExpanded && "max-h-40 overflow-hidden relative"
                  )}>
                    {renderMarkdown(modelState.response)}
                    {!isExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
                    )}
                  </div>
                  {!isWinner && phase === 'complete' && (
                    <button
                      onClick={() => toggleExpand(modelKey)}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="h-3 w-3" /> Show less</>
                      ) : (
                        <><ChevronDown className="h-3 w-3" /> Show full response</>
                      )}
                    </button>
                  )}
                </>
              )}

              {modelState.status === 'error' && modelState.response && (
                <div className="text-sm text-red-500 dark:text-red-400 mt-1">
                  {modelState.response}
                </div>
              )}

              {(modelState.status === 'pending' || modelState.status === 'loading') && (
                <div className="h-16 flex items-center justify-center">
                  {modelState.status === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating response...
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Evaluating phase indicator */}
      {phase === 'evaluating' && (
        <div className="mx-2 mt-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
          <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
            AI is evaluating responses...
          </span>
        </div>
      )}

      {/* Reasoning section after evaluation */}
      {phase === 'complete' && result?.reasoning && (
        <div className="mx-2 mt-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Why this was chosen:</div>
          <div className="text-sm text-purple-600 dark:text-purple-400">{result.reasoning}</div>
        </div>
      )}
    </div>
  );
}

export default ComparisonResponse;
