"use client";

import React, {  useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  className,
  placeholder = "Write your content here...",
}) => {
  const editorRef = useRef<any>(null);

  return (
    <div className={cn("border rounded-md", className)}>
      <Editor
        apiKey='no-api-key' // You can use a free TinyMCE API key here if you want
        onInit={(evt, editor) => (editorRef.current = editor)}
        initialValue={value}
        onEditorChange={(newValue) => onChange(newValue)}
        init={{
          height: 400,
          menubar: false,
          plugins: [
            "advlist autolink lists link image charmap print preview anchor",
            "searchreplace visualblocks code fullscreen",
            "insertdatetime media table paste code help wordcount",
          ],
          toolbar:
            "undo redo | formatselect | " +
            "bold italic backcolor | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "removeformat | help",
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          placeholder: placeholder,
          branding: false,
          promotion: false,
        }}
      />
    </div>
  );
};

export default RichTextEditor;
