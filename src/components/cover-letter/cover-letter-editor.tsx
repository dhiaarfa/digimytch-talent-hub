'use client'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useMemo } from 'react'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Strikethrough as StrikeIcon,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  type CoverLetterDocumentSettings,
  DEFAULT_COVER_LETTER_SETTINGS,
} from '@/lib/cover-letter-settings'

interface CoverLetterEditorProps {
  initialData: Record<string, unknown>;
  onChange?: (data: Record<string, unknown>) => void;
  containerWidth: number;
  isPrintVersion?: boolean;
  settings?: CoverLetterDocumentSettings;
  readOnly?: boolean;
}

function CoverLetterEditor({ 
  initialData, 
  onChange, 
  containerWidth,
  isPrintVersion = false,
  settings = DEFAULT_COVER_LETTER_SETTINGS,
  readOnly = false,
}: CoverLetterEditorProps) {

  const pageStyle = useMemo(
    () => ({
      fontSize: `${settings.document_font_size}pt`,
      lineHeight: settings.document_line_height,
      padding: `${settings.document_margin_vertical}px ${settings.document_margin_horizontal}px`,
    }),
    [settings]
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content: initialData?.content as string || '<p></p>',
    editorProps: {
      attributes: {
        class: 'cover-letter-prose focus:outline-none h-full max-w-none text-[var(--digi-dark)]',
        style: `font-size: ${settings.document_font_size}pt; line-height: ${settings.document_line_height};`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.({
        content: editor.getHTML(),
        lastUpdated: new Date().toISOString(),
      });
    }
  })

  useEffect(() => {
    if (editor && initialData?.content) {
      const currentContent = editor.getHTML()
      const newContent = initialData.content as string
      if (newContent !== currentContent) {
        editor.commands.setContent(newContent)
      }
    }
  }, [initialData?.content, editor])

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  const scale = Math.min(1, Math.max(0.55, containerWidth / 816));

  return (
    <div className="relative w-full max-w-[816px] mx-auto shadow-xl overflow-hidden mb-8 bg-white border border-[var(--digi-border)] rounded-sm">
      {editor && !readOnly && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="flex overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl"
        >
          <div className="flex items-center">
            <Button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('bold') && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <BoldIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('italic') && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <ItalicIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('underline') && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('strike') && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <StrikeIcon className="h-4 w-4" />
            </Button>
          </div>
          <Separator orientation="vertical" className="mx-1 h-8" />
          <div className="flex items-center">
            <Button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive({ textAlign: 'left' }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive({ textAlign: 'center' }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive({ textAlign: 'right' }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
          <Separator orientation="vertical" className="mx-1 h-8" />
          <div className="flex items-center">
            <Button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('heading', { level: 1 }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('heading', { level: 2 }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
          </div>
        </BubbleMenu>
      )}
      <div
        className={cn(
          "relative",
          isPrintVersion ? "pb-0" : "pb-[129.41%] print:!pb-0"
        )}
        style={isPrintVersion ? undefined : { minHeight: 1056 * scale }}
      >
        <div 
          className={cn(
            "origin-top-left bg-white",
            isPrintVersion
              ? "relative w-full"
              : "absolute top-0 left-0"
          )}
          style={
            isPrintVersion
              ? pageStyle
              : {
                  transform: `scale(${scale})`,
                  width: 816,
                  minHeight: 1056,
                  ...pageStyle,
                }
          }
        >
          <style>{`
            .cover-letter-prose p {
              margin-bottom: ${settings.paragraph_spacing}px;
            }
            .cover-letter-prose p:last-child {
              margin-bottom: 0;
            }
            .cover-letter-prose h1 {
              font-size: ${settings.document_font_size + 4}pt;
              font-weight: 700;
              margin-bottom: ${settings.paragraph_spacing}px;
            }
            .cover-letter-prose h2 {
              font-size: ${settings.document_font_size + 2}pt;
              font-weight: 600;
              margin-bottom: ${settings.paragraph_spacing}px;
            }
          `}</style>
          <EditorContent editor={editor} className="cover-letter-prose min-h-[900px]" />
        </div>
      </div>
    </div>
  )
}

export default CoverLetterEditor
