import { CKEditor } from '@ckeditor/ckeditor5-react';
import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-premium-features/ckeditor5-premium-features.css';
import { 
  ClassicEditor, 
  Essentials, 
  Paragraph, 
  Bold, 
  Italic,
  Heading,
  List,
  BlockQuote,
  Link,
  HorizontalLine,
  SpecialCharacters,
  Table,
  MediaEmbed,
  ImageUpload,
  Base64UploadAdapter,
  Image,
  PictureEditing,
  ImageInsert,
  ImageResize,
} from 'ckeditor5';
import { FormatPainter } from 'ckeditor5-premium-features';

interface RichTextEditorProps {
  value: string;
  onChange: (data: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      onChange={(_event, editor) => {
        const data = editor.getData();
        onChange(data);
      }}
      config={{
        licenseKey: 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDc2OTkxOTksImp0aSI6IjExYzljZGUwLTlmZmQtNGM5Yy1hMmYyLWM1YTUzZDI0N2VkYSIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImEzNWE3Njk5In0.eqwpWH6BNtFT1VLYw6lXXcBGXBfhopfXP3T21gT_VEmG602mQkJ_tIa8Ken5Y6E-UfE6v3l2OOxH3Fizh_zjZA',
        plugins: [
          Essentials,
          Paragraph,
          Bold,
          Italic,
          Heading,
          List,
          BlockQuote,
          Link,
          HorizontalLine,
          SpecialCharacters,
          Table,
          MediaEmbed,
          ImageUpload,
          Base64UploadAdapter,
          FormatPainter,
          Image,
          ImageUpload,
          PictureEditing,
          ImageInsert,
          ImageResize,
          Base64UploadAdapter
        ],
        language: 'ar',
        toolbar: [
          'undo', 'redo', '|',
          'heading', '|',
          'bold', 'italic', 'formatPainter', '|',
          'numberedList', 'bulletedList', '|',
          'blockQuote', 'link', 'insertTable', '|',
          'specialCharacters', 'horizontalLine',
          'imageInsert'
        ],
      }}
    />
  );
}