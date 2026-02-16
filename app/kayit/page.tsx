"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function KayitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Yükleniyor...</div>}>
      <KayitContent />
    </Suspense>
  );
}

function KayitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan"); // ?plan=pro
  const refParam = searchParams.get("ref"); // ?ref=INVITE_CODE

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleEmailRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(refParam ? { referred_by: refParam } : {}),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleRegister() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${refParam ? `?ref=${refParam}` : ""}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image
              src="/logo.png"
              alt="BodyPilot"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span
              className="text-3xl font-bold text-primary"
              style={{
                fontFamily: '"Cinematografica", sans-serif',
                letterSpacing: "0.1em",
              }}
            >
              BODYPILOT
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              E-postanızı Kontrol Edin
            </h2>
            <p className="text-muted-foreground">
              <strong>{email}</strong> adresine bir doğrulama bağlantısı gönderdik.
              Hesabınızı aktifleştirmek için bağlantıya tıklayın.
            </p>
          </div>
          <Link
            href="/giris"
            className="text-sm font-medium text-primary hover:underline"
          >
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image
              src="/logo.png"
              alt="BodyPilot"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span
              className="text-3xl font-bold text-primary"
              style={{
                fontFamily: '"Cinematografica", sans-serif',
                letterSpacing: "0.1em",
              }}
            >
              BODYPILOT
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Hesap Oluştur</h1>
          <p className="text-muted-foreground mt-2">
            {planParam === "pro"
              ? "Pro planla fitness yolculuğunuza başlayın"
              : "Ücretsiz hesap oluşturun ve hemen başlayın"}
          </p>
        </div>

        {/* Referral Badge */}
        {refParam && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              🤝 Davet Koduyla Kayıt
            </span>
          </div>
        )}

        {/* Plan Badge */}
        {planParam === "pro" && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
              Pro Plan Seçildi
            </span>
          </div>
        )}

        {/* Google Login */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base font-medium gap-3"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google ile Kayıt Ol
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              veya e-posta ile
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Ad Soyad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="En az 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={loading}
          >
            {loading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          Zaten hesabınız var mı?{" "}
          <Link
            href="/giris"
            className="font-medium text-primary hover:underline"
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
