'use client';

/**
 * Rich text editor built on react-quill-new (Quill 2), with table support.
 *
 * Loads Quill, which touches `document`, so import it with `next/dynamic` and
 * `ssr: false`.
 *
 * Two Quill quirks shape this file:
 *
 * 1. The toolbar is declared as a config array so Quill builds and owns that
 *    DOM. An externally-supplied container survives React's dev double-mount,
 *    and `buildPickers` then stacks a second picker on it — the visible one
 *    belongs to the destroyed editor, so the heading dropdown silently stops
 *    applying. Letting Quill rebuild the toolbar each time avoids that.
 * 2. The snow theme imports its icon registry directly (themes/snow.js), so
 *    icons added via `Quill.import('ui/icons')` never reach it when the app and
 *    react-quill-new resolve different builds of `quill`. The table buttons are
 *    therefore rendered empty by Quill and given their glyphs in CSS — see the
 *    `.ql-table-*` mask rules in app/globals.css.
 *
 * Quill's table module has no header-row concept; the first row is styled as
 * one (see the table rules in app/globals.css).
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

type TableModule = {
  insertTable: (rows: number, columns: number) => void;
  insertRowBelow: () => void;
  insertColumnRight: () => void;
  deleteRow: () => void;
  deleteColumn: () => void;
  deleteTable: () => void;
  getTable: () => [unknown, unknown, unknown, number];
};

/** Quill's row/column ops throw if the cursor sits outside a table. */
function withTable(quill: any, run: (table: TableModule) => void) {
  const table = quill?.getModule('table') as TableModule | undefined;
  if (!table) return;
  const [container] = table.getTable();
  if (!container) return;
  run(table);
}

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export default function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const quillRef = useRef<any>(null);

  /**
   * On an editor that has never been focused, Quill's saved range never makes
   * it to the native selection, so `getSelection()` returns null: built-in
   * handlers crash on `range.index` and `insertTable` bails silently. mousedown
   * fires before Quill's click handler, so seeding a caret here makes every
   * toolbar button work on the first click.
   */
  const ensureSelection = useCallback(() => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill || quill.getSelection()) return;
    quill.setSelection(Math.max(quill.getLength() - 1, 0), 0);
  }, []);

  useEffect(() => {
    const quill = quillRef.current?.getEditor?.();
    const container = quill?.getModule('toolbar')?.container as HTMLElement | undefined;
    if (!container) return;

    container.addEventListener('mousedown', ensureSelection);

    /**
     * Quill emits the heading <option>s empty and paints their labels with CSS
     * on the `.ql-picker-item` it builds from them. If that picker is ever
     * missing, the native <select> falls back to a list of blank rows. Naming
     * the options keeps the control readable either way; Quill copies the text
     * to `data-label`, which its own CSS only honours for the value-less
     * "Normal" entry, so the picker itself is unchanged.
     */
    container.querySelectorAll<HTMLOptionElement>('select.ql-header option').forEach((option) => {
      if (option.textContent) return;
      const value = option.getAttribute('value');
      option.textContent = value ? `Heading ${value}` : 'Normal';
    });

    return () => container.removeEventListener('mousedown', ensureSelection);
  }, [ensureSelection]);

  const modules = useMemo(
    () => ({
      table: true,
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          [
            'table-insert',
            'table-row-add',
            'table-row-remove',
            'table-column-add',
            'table-column-remove',
            'table-delete',
          ],
          ['clean'],
        ],
        handlers: {
          /**
           * Quill's built-in `indent` and `list` handlers call
           * `getFormat(this.quill.getSelection())` with no null check, so they
           * throw "Cannot read properties of null (reading 'index')" when the
           * click lands while the editor holds no selection. (`clean` has the
           * guard; these two don't.) Re-implemented with a fallback range —
           * `quill.format()` focuses on its own, so applying stays safe.
           */
          indent(this: any, value: string) {
            const range = this.quill.getSelection() ?? { index: 0, length: 0 };
            const formats = this.quill.getFormat(range);
            const current = parseInt(formats.indent || 0, 10);
            if (value !== '+1' && value !== '-1') return;
            let modifier = value === '+1' ? 1 : -1;
            if (formats.direction === 'rtl') modifier *= -1;
            this.quill.format('indent', current + modifier, 'user');
          },
          list(this: any, value: string) {
            const range = this.quill.getSelection() ?? { index: 0, length: 0 };
            const formats = this.quill.getFormat(range);
            if (value === 'check') {
              const checked = formats.list === 'checked' || formats.list === 'unchecked';
              this.quill.format('list', checked ? false : 'unchecked', 'user');
            } else {
              this.quill.format('list', value, 'user');
            }
          },
          'table-insert'(this: any) {
            // 3 columns, 4 rows — the first row acts as the header.
            (this.quill.getModule('table') as TableModule | undefined)?.insertTable(4, 3);
          },
          'table-row-add'(this: any) {
            withTable(this.quill, (t) => t.insertRowBelow());
          },
          'table-row-remove'(this: any) {
            withTable(this.quill, (t) => t.deleteRow());
          },
          'table-column-add'(this: any) {
            withTable(this.quill, (t) => t.insertColumnRight());
          },
          'table-column-remove'(this: any) {
            withTable(this.quill, (t) => t.deleteColumn());
          },
          'table-delete'(this: any) {
            withTable(this.quill, (t) => t.deleteTable());
          },
        },
      },
    }),
    []
  );

  return (
    <div className={`rich-text-editor ${className ?? ''}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
