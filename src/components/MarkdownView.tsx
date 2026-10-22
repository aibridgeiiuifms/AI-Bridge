'use client';

import React from 'react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, safe client-side Markdown renderer for event descriptions.
 * Renders bold, italic, headings, lists, links, and quotes into rich HTML
 * without exposing raw markdown syntax like **bold** to the end-user.
 */
export default function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  if (!content) return null;

  // Split into paragraphs / blocks
  const blocks = content.split(/\n{2,}/);

  return (
    <div className={`space-y-3.5 text-slate-700 leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 3: ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={bIdx} className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2 tracking-tight">
              {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        // Heading 2: ##
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={bIdx} className="text-lg sm:text-xl font-extrabold text-slate-900 mt-5 mb-2.5 tracking-tight">
              {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }

        // Heading 1: #
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={bIdx} className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-3 tracking-tight">
              {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        // Blockquote: >
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed
            .split('\n')
            .map(l => l.replace(/^>\s?/, ''))
            .join(' ');
          return (
            <blockquote key={bIdx} className="border-l-4 border-emerald-500 bg-emerald-50/60 pl-4 py-2 my-2 text-slate-800 italic rounded-r-xl">
              {renderInlineMarkdown(quoteLines)}
            </blockquote>
          );
        }

        // Unordered List: lines starting with - or *
        const lines = trimmed.split('\n');
        const isBulletList = lines.every(l => /^\s*[-*]\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="list-disc list-outside pl-5 space-y-1.5 my-2">
              {lines.map((item, lIdx) => (
                <li key={lIdx} className="text-slate-700 pl-1">
                  {renderInlineMarkdown(item.replace(/^\s*[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // Numbered List: lines starting with numbers like 1. 2.
        const isNumberedList = lines.every(l => /^\s*\d+\.\s+/.test(l));
        if (isNumberedList) {
          return (
            <ol key={bIdx} className="list-decimal list-outside pl-5 space-y-1.5 my-2">
              {lines.map((item, lIdx) => (
                <li key={lIdx} className="text-slate-700 pl-1">
                  {renderInlineMarkdown(item.replace(/^\s*\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        }

        // Regular Paragraph (preserving single linebreaks with <br/>)
        return (
          <p key={bIdx} className="text-sm sm:text-base leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInlineMarkdown(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Handles inline markdown:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Link: [label](url)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Regex tokenizing links, bold, and italic in priority order
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 hover:text-emerald-800 underline font-medium underline-offset-2 transition-colors inline-flex items-center gap-0.5"
        >
          {label}
        </a>
      );
    }

    // Bold: **text** or __text__
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const content = part.slice(2, -2);
      return <strong key={index} className="font-extrabold text-slate-900">{renderInlineMarkdown(content)}</strong>;
    }

    // Italic: *text* or _text_
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      const content = part.slice(1, -1);
      return <em key={index} className="italic text-slate-800">{renderInlineMarkdown(content)}</em>;
    }

    return part;
  });
}
