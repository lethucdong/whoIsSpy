"use client";

import { useState } from "react";
import { Copy, Check, Share2, Link2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function ShareSheet({
  code,
  trigger,
}: {
  code: string;
  trigger: React.ReactNode;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/join-room?code=${code}`
      : `/join-room?code=${code}`;

  const copy = async (text: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
      }
      toast.success("Đã sao chép!");
    } catch {
      toast.error("Không sao chép được");
    }
  };

  const nativeShare = async () => {
    const text = `Vào chơi "AI Là Gián Điệp?" với mình nhé! Mã phòng: ${code}\n${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AI Là Gián Điệp?", text, url: link });
      } catch {}
    } else {
      copy(text, "link");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mời bạn bè</DialogTitle>
          <DialogDescription>
            Gửi mã hoặc link để cả hội vào chung phòng
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card-soft/40 p-4 text-center">
            <p className="text-xs text-muted">Mã phòng</p>
            <p className="my-1 text-4xl font-extrabold tracking-[0.3em] text-gradient">
              {code}
            </p>
            <Button
              variant="glass"
              size="sm"
              className="mt-1"
              onClick={() => copy(code, "code")}
            >
              {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedCode ? "Đã chép mã" : "Chép mã"}
            </Button>
          </div>

          <Button variant="outline" className="w-full justify-between" onClick={() => copy(link, "link")}>
            <span className="flex items-center gap-2 truncate text-sm">
              <Link2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
            </span>
            {copiedLink ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
          </Button>

          <Button className="w-full" onClick={nativeShare}>
            <Share2 className="h-5 w-5" /> Chia sẻ link mời
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
