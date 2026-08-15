'use client';

import { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export default function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const editor = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder || 'Start typing...',
      height: 400,
      toolbarAdaptive: false,
      buttons: [
        'source', '|',
        'bold', 'strikethrough', 'underline', 'italic', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'image', 'table', 'link', '|',
        'align', 'undo', 'redo', '|',
        'hr', 'eraser', 'fullsize'
      ],
      uploader: {
        insertImageAsBase64URI: true
      },
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false
    }),
    [placeholder]
  );

  return (
    <div className={`rich-text-editor-jodit ${className ?? ''}`}>
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={(newContent) => onChange(newContent)} // preferred to use only this option to update the content for performance reasons
        onChange={() => {}}
      />
    </div>
  );
}
