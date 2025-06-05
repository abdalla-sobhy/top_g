import { useState, useEffect, useRef, useMemo } from 'react';
import { CKEditor, useCKEditorCloud } from '@ckeditor/ckeditor5-react';

interface RichTextEditorProps {
  value: string;
  onChange: (data: string) => void;
}

const LICENSE_KEY = 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3Nzk0OTQzOTksImp0aSI6IjA4MmQxOTY2LTE2OTYtNDNkMS1iZjY5LWNmZmIwODk1NWEwMCIsImxpY2Vuc2VkSG9zdHMiOlsiMTI3LjAuMC4xIiwibG9jYWxob3N0IiwiMTkyLjE2OC4qLioiLCIxMC4qLiouKiIsIjE3Mi4qLiouKiIsIioudGVzdCIsIioubG9jYWxob3N0IiwiKi5sb2NhbCJdLCJ1c2FnZUVuZHBvaW50IjoiaHR0cHM6Ly9wcm94eS1ldmVudC5ja2VkaXRvci5jb20iLCJkaXN0cmlidXRpb25DaGFubmVsIjpbImNsb3VkIiwiZHJ1cGFsIl0sImxpY2Vuc2VUeXBlIjoiZGV2ZWxvcG1lbnQiLCJmZWF0dXJlcyI6WyJEUlVQIiwiRTJQIiwiRTJXIl0sInZjIjoiODZlYmFhY2IifQ.Sx82mtPmNQ656RgPJl3VOoORwQGskrcPexjZRR6DaMhXU6g6ujoMxKkNAZkG6qPKMffZfFg66Ik_beHPdkHObw';

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const cloud = useCKEditorCloud({ version: '45.2.0' });

  useEffect(() => {
    setIsLayoutReady(true);
    return () => setIsLayoutReady(false);
  }, []);

  const { ClassicEditor, editorConfig } = useMemo(() => {
    if (cloud.status !== 'success' || !isLayoutReady) {
      return {};
    }

    const {
      ClassicEditor,
      AutoLink,
      Bold,
      Essentials,
      Italic,
      Link,
      Paragraph,
      PlainTableOutput,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableLayout,
      TableProperties,
      TableToolbar,
    } = cloud.CKEditor;

    return {
      ClassicEditor,
      editorConfig: {
        licenseKey: LICENSE_KEY,
        language: 'ar',
        uiLanguage: 'ar',
        toolbar: {
          items: [
            'undo',
            'redo',
            '|',
            'bold',
            'italic',
            '|',
            'link',
            '|',
            'insertTable',
            'insertTableLayout',
          ],
          shouldNotGroupWhenFull: false,
        },
        plugins: [
          AutoLink,
          Bold,
          Essentials,
          Italic,
          Link,
          Paragraph,
          PlainTableOutput,
          Table,
          TableCaption,
          TableCellProperties,
          TableColumnResize,
          TableLayout,
          TableProperties,
          TableToolbar,
        ],
        initialData: value,
        link: {
          addTargetToExternalLinks: true,
          defaultProtocol: 'https://',
          decorators: {
            toggleDownloadable: {
              mode: 'manual' as const,
              label: 'Downloadable',
              attributes: {
                download: 'file',
              },
            },
          },
        },
        menuBar: {
          isVisible: true,
        },
        placeholder: 'أكتب او الصق محتواك هنا!',
        table: {
          contentToolbar: [
            'tableColumn',
            'tableRow',
            'mergeTableCells',
            'tableProperties',
            'tableCellProperties',
          ],
        },
      },
    };
  }, [cloud, isLayoutReady, value]);

  if (!ClassicEditor || !editorConfig) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="editor-container" ref={editorContainerRef} dir="rtl">
      <div className="editor-container__editor" ref={editorRef}>
        <CKEditor
          editor={ClassicEditor}
          config={editorConfig}
          data={value}
          onChange={(_, editor) => {
            const data = editor.getData();
            onChange(data);
          }}
        />
      </div>
    </div>
  );
}
