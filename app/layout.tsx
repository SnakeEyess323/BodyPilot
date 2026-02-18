import type { Metadata } from "next";
import "./globals.css";
import AppSidebar from "@/components/AppSidebar";
import OnboardingGuard from "@/components/OnboardingGuard";
import ProfilProvider from "@/components/ProfilProvider";
import { HaftalikProgramProvider } from "@/context/HaftalikProgramContext";
import { YemekProgramProvider } from "@/context/YemekProgramContext";
import { FavoriYemekProvider } from "@/context/FavoriYemekContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { GamificationProvider } from "@/context/GamificationContext";
import { BadgePopup } from "@/components/BadgePopup";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { ChallengeProvider } from "@/context/ChallengeContext";

export const metadata: Metadata = {
  title: "BodyPilot - AI Fitness Coach",
  description: "Your AI-powered personal fitness and nutrition assistant",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <GamificationProvider>
                  <ChallengeProvider>
                    <ProfilProvider>
                      <HaftalikProgramProvider>
                        <YemekProgramProvider>
                          <FavoriYemekProvider>
                            <OnboardingGuard>
                              <AppSidebar>
                                {children}
                              </AppSidebar>
                              <BadgePopup />
                            </OnboardingGuard>
                          </FavoriYemekProvider>
                        </YemekProgramProvider>
                      </HaftalikProgramProvider>
                    </ProfilProvider>
                  </ChallengeProvider>
                </GamificationProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
