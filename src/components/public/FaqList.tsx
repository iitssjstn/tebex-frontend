import { cleanHtml } from "@/lib/sanitize";

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="faq">
      {items.map((i, n) => (
        <details key={n}>
          <summary>{i.question}</summary>
          <div className="prose" dangerouslySetInnerHTML={{ __html: cleanHtml(i.answer) }} />
        </details>
      ))}
    </div>
  );
}
