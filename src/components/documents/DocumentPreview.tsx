'use client';

// Visionneuse de documents integree : prend en charge le plus de formats possible
// via les capacites natives du navigateur (PDF, images, audio, video, texte).

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui';

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico'];
const VIDEO_EXT = ['mp4', 'webm', 'ogv', 'mov', 'm4v'];
const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'weba'];
const TEXT_EXT = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'xml', 'yml', 'yaml', 'log', 'ini', 'sql'];
const OFFICE_EXT = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf'];

function extensionOf(filename: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  return match ? match[1].toLowerCase() : '';
}

export interface DocumentPreviewProps {
  url: string;
  filename: string;
  height?: string;
}

export function DocumentPreview({ url, filename, height = '70vh' }: DocumentPreviewProps) {
  const extension = extensionOf(filename);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textError, setTextError] = useState(false);

  const isText = TEXT_EXT.includes(extension);

  useEffect(() => {
    if (!isText) return;
    let active = true;
    setTextContent(null);
    setTextError(false);

    fetch(url, { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) throw new Error('preview failed');
        return response.text();
      })
      .then((content) => {
        if (active) setTextContent(content.slice(0, 100_000));
      })
      .catch(() => {
        if (active) setTextError(true);
      });

    return () => {
      active = false;
    };
  }, [url, isText]);

  let body: React.ReactNode;

  if (extension === 'pdf') {
    body = (
      <iframe
        src={url}
        title={filename}
        className="h-full w-full border-0 bg-white"
        style={{ height }}
      />
    );
  } else if (IMAGE_EXT.includes(extension)) {
    body = (
      <div className="flex items-center justify-center bg-navy-50/40 p-6" style={{ minHeight: height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={filename} className="max-h-[65vh] max-w-full rounded-lg object-contain" />
      </div>
    );
  } else if (VIDEO_EXT.includes(extension)) {
    body = (
      <div className="flex items-center justify-center bg-black/90 p-4" style={{ minHeight: height }}>
        <video src={url} controls className="max-h-[65vh] w-full max-w-3xl rounded-lg" />
      </div>
    );
  } else if (AUDIO_EXT.includes(extension)) {
    body = (
      <div className="flex flex-col items-center justify-center gap-4 p-10" style={{ minHeight: height }}>
        <audio src={url} controls className="w-full max-w-md" />
        <p className="text-sm text-navy-500">{filename}</p>
      </div>
    );
  } else if (isText) {
    body = textError ? (
      <PreviewFallback filename={filename} url={url} message="Impossible de charger le contenu du fichier." />
    ) : textContent === null ? (
      <div className="flex items-center justify-center" style={{ minHeight: height }}>
        <Spinner className="h-6 w-6 text-navy-400" label="Chargement de l’aperçu" />
      </div>
    ) : (
      <pre
        className="overflow-auto bg-navy-50/40 p-6 text-xs leading-relaxed text-navy-800"
        style={{ height, margin: 0 }}
      >
        {textContent}
      </pre>
    );
  } else if (OFFICE_EXT.includes(extension)) {
    body = (
      <PreviewFallback
        filename={filename}
        url={url}
        message="L’aperçu des fichiers bureautiques (Word, Excel, PowerPoint) n’est pas disponible directement. Téléchargez le fichier pour le consulter."
      />
    );
  } else {
    body = (
      <PreviewFallback
        filename={filename}
        url={url}
        message="Ce format n’est pas prévisualisable dans le navigateur. Téléchargez le fichier pour le consulter."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-navy-100 bg-navy-50/50 px-4 py-2.5">
        <span className="truncate text-sm font-medium text-navy-700">{filename}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-navy-600 hover:text-navy-900"
        >
          Ouvrir dans un nouvel onglet ↗
        </a>
      </div>
      {body}
    </div>
  );
}

function PreviewFallback({
  filename,
  url,
  message,
}: {
  filename: string;
  url: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
          <path d="M6 3h8l4 4v14H6V3Z" strokeLinejoin="round" />
          <path d="M14 3v4h4" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="max-w-md text-sm text-navy-500">{message}</p>
      <a
        href={url}
        download={filename}
        className="inline-flex h-10 items-center rounded-lg bg-navy-700 px-4 text-sm font-medium text-cream transition-colors hover:bg-navy-800"
      >
        Télécharger le fichier
      </a>
    </div>
  );
}
