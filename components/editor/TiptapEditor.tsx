'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import CharacterCount from '@tiptap/extension-character-count';
import { useState, useCallback, useEffect, useRef } from 'react';

interface TiptapEditorProps {
  content?: string;
  onUpdate?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  className?: string;
}

/**
 * Enhanced Tiptap Editor Component
 * Rich text editor with auto-save, formatting tools, and collaborative features
 */
export function TiptapEditor({
  content = '',
  onUpdate,
  placeholder = 'Commencez à écrire...',
  editable = true,
  autoSave = true,
  autoSaveDelay = 2000,
  className = '',
}: TiptapEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const editorRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      CharacterCount,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onUpdate?.(newContent);

      if (autoSave) {
        handleAutoSave(newContent);
      }
    },
  });

  editorRef.current = editor;

  const handleAutoSave = useCallback((content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Auto-save logic would go here
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, autoSaveDelay);
  }, [autoSaveDelay]);

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL de l\'image');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run();
  }, [editor]);

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 h-48 rounded-lg"></div>;
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50 rounded-t-lg">
        {/* Text formatting */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 text-sm font-medium rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''
              }`}
            type="button"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 text-sm font-medium rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''
              }`}
            type="button"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 text-sm font-medium rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200' : ''
              }`}
            type="button"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 text-sm font-medium rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-200' : ''
              }`}
            type="button"
          >
            <s>S</s>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Headings */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 text-sm font-medium rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
              }`}
            type="button"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 text-sm font-medium rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
              }`}
            type="button"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 text-sm font-medium rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
              }`}
            type="button"
          >
            H3
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Lists */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 text-sm rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''
              }`}
            type="button"
            title="Liste à puces"
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 text-sm rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''
              }`}
            type="button"
            title="Liste numérotée"
          >
            1.
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Alignment */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 text-sm rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
              }`}
            type="button"
            title="Aligner à gauche"
          >
            ⫷
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 text-sm rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
              }`}
            type="button"
            title="Centrer"
          >
            ≡
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 text-sm rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
              }`}
            type="button"
            title="Aligner à droite"
          >
            ⫸
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Special elements */}
        <div className="flex items-center space-x-1">
          <button
            onClick={setLink}
            className={`p-2 text-sm rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''
              }`}
            type="button"
            title="Insérer un lien"
          >
            🔗
          </button>
          <button
            onClick={addImage}
            className="p-2 text-sm rounded hover:bg-gray-200"
            type="button"
            title="Insérer une image"
          >
            🖼️
          </button>
          <button
            onClick={insertTable}
            className="p-2 text-sm rounded hover:bg-gray-200"
            type="button"
            title="Insérer un tableau"
          >
            📊
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 text-sm rounded hover:bg-gray-200 ${editor.isActive('highlight') ? 'bg-gray-200' : ''
              }`}
            type="button"
            title="Surligner"
          >
            ✨
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 text-sm rounded hover:bg-gray-200 disabled:opacity-50"
            type="button"
            title="Annuler"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 text-sm rounded hover:bg-gray-200 disabled:opacity-50"
            type="button"
            title="Refaire"
          >
            ↷
          </button>
        </div>

        {/* Auto-save indicator */}
        {autoSave && (
          <div className="ml-auto flex items-center space-x-2">
            {isSaving && (
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Sauvegarde...</span>
              </div>
            )}
            {lastSaved && !isSaving && (
              <div className="text-xs text-gray-500">
                Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent
          editor={editor}
          className="min-h-[200px] focus-within:outline-none"
        />
      </div>

      {/* Character count */}
      <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-b-lg">
        {editor.storage.characterCount?.characters() || 0} caractères
      </div>
    </div>
  );
}