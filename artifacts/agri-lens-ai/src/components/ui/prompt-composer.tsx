import {
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type PromptComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  placeholder: string;
  label: string;
  sendLabel: string;
  sendingLabel: string;
  evidenceLabel: string;
  characterCountLabel: string;
  className?: string;
};

export function PromptComposer({
  value,
  onChange,
  onSend,
  isSending,
  placeholder,
  label,
  sendLabel,
  sendingLabel,
  evidenceLabel,
  characterCountLabel,
  className,
}: PromptComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !isSending;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [value]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSend) onSend();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <form
      onSubmit={submit}
      aria-busy={isSending}
      className={cn(
        "w-full rounded-2xl border border-border bg-background shadow-[0_12px_28px_-24px_rgba(0,42,57,.5)] transition-[border-color,box-shadow] duration-150 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(0,92,171,.08)]",
        className,
      )}
      data-testid="assistant-chat-form"
    >
      <label htmlFor="assistant-input" className="sr-only">
        {label}
      </label>
      <div className="px-4 pt-3.5">
        <textarea
          ref={textareaRef}
          id="assistant-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          rows={2}
          placeholder={placeholder}
          aria-label={label}
          className="max-h-[132px] min-h-[58px] w-full resize-none bg-transparent py-1 text-[13px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground/80"
          data-testid="assistant-input"
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[9px] font-semibold text-secondary-foreground">
            <ShieldCheck size={12} className="shrink-0 text-[#20603d]" />
            <span className="truncate">{evidenceLabel}</span>
          </span>
          <span
            aria-label={characterCountLabel}
            className={cn(
              "shrink-0 font-mono text-[10px] tabular-nums",
              value.length > 1800
                ? "text-amber-700 dark:text-amber-400"
                : "text-muted-foreground/75",
            )}
          >
            {value.length}/2000
          </span>
        </div>
        <button
          type="submit"
          disabled={!canSend}
          aria-label={isSending ? sendingLabel : sendLabel}
          data-testid="assistant-send"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-[transform,background-color,opacity] duration-150 hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isSending ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={17} />
          )}
        </button>
      </div>
    </form>
  );
}
