'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect } from 'react';
import { useAutoSave, type AutoSaveStatus } from '@/hooks/useAutoSave';

/**
 * TiptapEditor Props
 */
interface TiptapEditorProps {
  /**
   * Initial content (markdown)
   */
  initialContent?: string;

  /**
   * Callback when content changes and is auto-saved
   */
  onSave: (content: string) => Promise<void>;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the editor is editable
   */
  editable?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TiptapEditor Component
 *
 * Rich text editor with auto-save functionality.
 * Uses Tiptap for editing and automatically saves content after 2 seconds of inactivity.
 */
export function TiptapEditor({
  initialContent = '',
  onSave,
  placeholder = 'Commencez à écrire...',
  editable = true,
  className = '',
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  // Get current content as HTML
  const content = editor?.getHTML() || '';

  // Auto-save hook
  const autoSaveStatus = useAutoSave(content, onSave);

  // Update editor content if initialContent changes externally
  useEffect(() => {
    if (editor && initialContent && !editor.isFocused) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Toggle bold
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  // Toggle italic
  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  // Toggle heading
  const toggleHeading = useCallback(
    (level: 1 | 2 | 3 | 4) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  // Toggle bullet list
  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  // Toggle ordered list
  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  // Toggle blockquote
  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  // Add link
  const setLink = useCallback(() => {
    const url = window.prompt('URL:');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 items-center">
        {/* Text formatting */}
        <button
          onClick={toggleBold}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300 font-semibold' : ''
          }`}
          title="Gras (Ctrl+B)"
        >
          B
        </button>

        <button
          onClick={toggleItalic}
          className={`px-3 py-1 rounded hover:bg-gray-200 italic ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="Italique (Ctrl+I)"
        >
          I
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <button
          onClick={() => toggleHeading(1)}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 font-bold' : ''
          }`}
          title="Titre 1"
        >
          H1
        </button>

        <button
          onClick={() => toggleHeading(2)}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 font-bold' : ''
          }`}
          title="Titre 2"
        >
          H2
        </button>

        <button
          onClick={() => toggleHeading(3)}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 font-bold' : ''
          }`}
          title="Titre 3"
        >
          H3
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          onClick={toggleBulletList}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="Liste à puces"
        >
          •
        </button>

        <button
          onClick={toggleOrderedList}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="Liste numérotée"
        >
          1.
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Other */}
        <button
          onClick={toggleBlockquote}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
          title="Citation"
        >
          &quot;
        </button>

        <button
          onClick={setLink}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('link') ? 'bg-gray-300' : ''
          }`}
          title="Lien"
        >
          🔗
        </button>

        {/* Auto-save status */}
        <div className="ml-auto flex items-center gap-2">
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Auto-save status indicator
 */
function AutoSaveIndicator({ status }: { status: AutoSaveStatus }) {
  if (status === 'idle') {
    return null;
  }

  const statusConfig = {
    saving: {
      text: 'Sauvegarde...',
      className: 'text-gray-600',
      icon: '💾',
    },
    saved: {
      text: 'Sauvegardé',
      className: 'text-green-600',
      icon: '✓',
    },
    error: {
      text: 'Erreur de sauvegarde',
      className: 'text-red-600',
      icon: '✗',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`text-sm flex items-center gap-1 ${config.className}`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}
