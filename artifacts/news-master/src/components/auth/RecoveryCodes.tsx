import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function RecoveryCodes({
  codes,
  onContinue,
}: {
  codes: readonly string[];
  onContinue(): void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `Scrollbrief recovery codes\n\n${codes.join("\n")}\n`;

  async function copyCodes() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  function downloadCodes() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "scrollbrief-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
        Save these codes now. Each code works once, and they will not be shown
        again.
      </div>
      <div className="grid grid-cols-1 gap-2 rounded-md border bg-muted/40 p-4 font-mono text-sm sm:grid-cols-2">
        {codes.map((code) => (
          <span key={code}>{code}</span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void copyCodes()}
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" variant="outline" onClick={downloadCodes}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <Checkbox
          checked={acknowledged}
          onCheckedChange={(checked) => setAcknowledged(checked === true)}
          className="mt-0.5"
        />
        <span>I have stored these recovery codes somewhere safe.</span>
      </label>
      <Button className="w-full" disabled={!acknowledged} onClick={onContinue}>
        Continue to administration
      </Button>
    </div>
  );
}
