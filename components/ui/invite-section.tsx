"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Share2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { generateReferralCode, copyInviteLink, shareInvite, getReferralLink, copyToClipboard } from "@/lib/invite";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InviteSectionProps {
  className?: string;
}

export function InviteSection({ className }: InviteSectionProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralCode = user ? generateReferralCode(user.id) : "";

  const handleCopy = useCallback(async () => {
    if (!referralCode) return;
    const link = getReferralLink(referralCode);
    const ok = await copyToClipboard(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    return ok;
  }, [referralCode]);

  const handleShare = useCallback(async () => {
    if (!referralCode) return;
    await shareInvite(
      referralCode,
      "BodyPilot",
      t.invite?.inviteDesc || "Join me on BodyPilot!"
    );
  }, [referralCode, t]);

  if (!user) return null;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          "border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors",
          className
        )}
      >
        <Users className="h-4 w-4" />
        {t.challenge?.inviteFriends || "Arkadaşlarını Davet Et"}
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              {t.invite?.title || "Arkadaşlarını Davet Et"}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            {t.invite?.inviteDesc || "Arkadaşın kayıt olduğunda ikisi de XP kazanır!"}
          </p>

          {/* Referral Code */}
          <div className="rounded-lg bg-muted/50 border border-border p-3">
            <p className="text-xs text-muted-foreground mb-1.5">
              {t.invite?.yourCode || "Senin Davet Kodun"}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono font-bold tracking-wider text-foreground">
                {referralCode}
              </code>
              <button
                onClick={handleCopy}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-background hover:bg-accent text-muted-foreground border border-border"
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-foreground hover:bg-muted/80 border border-border"
              )}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied
                ? (t.invite?.copied || "Kopyalandı!")
                : (t.invite?.copyLink || "Linki Kopyala")}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              {t.invite?.share || "Paylaş"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
