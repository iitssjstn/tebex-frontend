"use client";

import { useEffect, useRef, useState } from "react";
import { MediaModal } from "./MediaPicker";

/** Small WYSIWYG editor. The server sanitises the HTML again on save and on render. */
export function RichTextEditor({ value, onChange, id }: { value: string; onChange: (html: string) => void; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<string>("");
  const [source, setSource] = useState(false);
  const [picker, setPicker] = useState(false);
  const saved = useRef<Range | null>(null);

  useEffect(() => {
    if (ref.current && value !== last.current) {
      ref.current.innerHTML = value;
      last.current = value;
    }
  }, [value, source]);

  const emit = () => {
    const html = ref.current?.innerHTML ?? "";
    last.current = html;
    onChange(html);
  };
  const cmd = (name: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    emit();
  };
  const remember = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) saved.current = sel.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel && saved.current) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
  };

  const Btn = ({ label, title, run }: { label: string; title: string; run: () => void }) => (
    <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={run}>{label}</button>
  );

  return (
    <div>
      <div className="rt-bar" role="toolbar" aria-label="Text formatting">
        <Btn label="B" title="Bold" run={() => cmd("bold")} />
        <Btn label="I" title="Italic" run={() => cmd("italic")} />
        <Btn label="U" title="Underline" run={() => cmd("underline")} />
        <Btn label="H2" title="Large heading" run={() => cmd("formatBlock", "h2")} />
        <Btn label="H3" title="Small heading" run={() => cmd("formatBlock", "h3")} />
        <Btn label="P" title="Paragraph" run={() => cmd("formatBlock", "p")} />
        <Btn label="&bull;" title="Bulleted list" run={() => cmd("insertUnorderedList")} />
        <Btn label="1." title="Numbered list" run={() => cmd("insertOrderedList")} />
        <Btn label="&ldquo;" title="Quote" run={() => cmd("formatBlock", "blockquote")} />
        <Btn label="Link" title="Add link" run={() => { const u = window.prompt("Link address (https://...)"); if (u && /^(https?:\/\/|\/|mailto:)/i.test(u)) cmd("createLink", u); }} />
        <Btn label="Unlink" title="Remove link" run={() => cmd("unlink")} />
        <button type="button" title="Insert image" aria-label="Insert image" onMouseDown={(e) => { remember(); e.preventDefault(); }} onClick={() => setPicker(true)}>Image</button>
        <Btn label="Clear" title="Clear formatting" run={() => cmd("removeFormat")} />
        <button type="button" onClick={() => setSource((s) => !s)} aria-pressed={source} style={{ marginLeft: "auto" }}>{source ? "Visual" : "HTML"}</button>
      </div>
      {source ? (
        <textarea aria-label="HTML source" style={{ borderRadius: "0 0 .5rem .5rem", fontFamily: "ui-monospace,monospace", minHeight: "10rem" }} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div id={id} ref={ref} className="rt-area" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" onInput={emit} onBlur={emit} onKeyUp={remember} onMouseUp={remember} />
      )}
      {picker ? (
        <MediaModal
          onClose={() => setPicker(false)}
          onPick={(url, alt) => {
            setPicker(false);
            restore();
            document.execCommand("insertHTML", false, `<img src="${url}" alt="${alt.replace(/"/g, "&quot;")}">`);
            emit();
          }}
        />
      ) : null}
    </div>
  );
}
