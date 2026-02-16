"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfil } from "@/context/ProfilContext";
import { useLanguage } from "@/context/LanguageContext";
import { profilTamamlandi } from "@/lib/onboarding";
import type { Profil } from "@/lib/types";
import ChipSelector from "@/components/ui/chip-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ONBOARDING_STEPS,
  TOPLAM_ONBOARDING_ADIM,
  type OnboardingStep,
} from "@/lib/onboardingSteps";

const ZORUNLU_ALANLAR: (keyof Profil)[] = [
  "yas",
  "cinsiyet",
  "boy",
  "kilo",
  "hedef",
  "seviye",
  "gunSayisi",
  "ortam",
];

function isRequiredStep(step: OnboardingStep): boolean {
  return ZORUNLU_ALANLAR.includes(step.field);
}

function getStepCanProceed(step: OnboardingStep, profil: Profil): boolean {
  const value = profil[step.field];
  if (step.field === "yas")
    return typeof value === "number" && value >= 10 && value <= 100;
  if (step.field === "boy")
    return typeof value === "number" && value >= 100 && value <= 250;
  if (step.field === "kilo")
    return typeof value === "number" && value >= 30 && value <= 300;
  if (step.field === "gunSayisi")
    return typeof value === "string" && value.length > 0;
  if (step.field === "hedef")
    return Array.isArray(value) && value.length > 0;
  if (step.field === "cinsiyet" || step.field === "seviye" || step.field === "ortam")
    return Boolean(value);
  return true;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { profil, setProfil, isLoaded } = useProfil();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);

  // If onboarding already completed, redirect to dashboard immediately
  useEffect(() => {
    if (isLoaded && profilTamamlandi(profil)) {
      router.replace("/dashboard");
    }
  }, [isLoaded, profil, router]);

  // Don't render the form if already completed
  if (isLoaded && profilTamamlandi(profil)) {
    return null;
  }

  const currentStep = ONBOARDING_STEPS[step - 1];
  const update = (key: keyof Profil, value: unknown) => {
    setProfil({ ...profil, [key]: value });
  };

  const setValue = (field: keyof Profil, value: unknown) => {
    if (field === "antrenmanSuresi" && typeof value === "string")
      update(field, value === "" ? undefined : parseInt(value, 10));
    else update(field, value);
  };

  const handleNext = () => {
    if (step < TOPLAM_ONBOARDING_ADIM) setStep(step + 1);
    else {
      setProfil({ ...profil, onboardingCompleted: true });
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const mustProceed = isRequiredStep(currentStep);
  const canProceed = mustProceed
    ? getStepCanProceed(currentStep, profil)
    : true;

  const rawValue = currentStep ? profil[currentStep.field] : undefined;
  const followUpValue = currentStep?.followUpField
    ? profil[currentStep.followUpField]
    : undefined;

  const showFollowUp =
    currentStep?.hasFollowUp &&
    currentStep?.followUpField &&
    rawValue === "evet";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-10">
      <div className="mx-auto max-w-xl px-4">
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>
              {t.onboarding.step} {step} {t.onboarding.of} {TOPLAM_ONBOARDING_ADIM}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(step / TOPLAM_ONBOARDING_ADIM) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {currentStep.sectionTitle && (
            <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-primary">
              {currentStep.sectionTitle}
            </h2>
          )}
          <p className="mb-6 text-xl font-semibold text-foreground">
            {currentStep.questionLabel}
          </p>

          {currentStep.inputType === "number" && (
            <div>
              <Input
                type="number"
                min={currentStep.min}
                max={currentStep.max}
                step={currentStep.field === "kilo" || currentStep.field === "hedefKilo" ? 0.1 : undefined}
                placeholder={currentStep.placeholder}
                value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue(currentStep.field, v === "" ? undefined : Number(v));
                }}
                className="mt-1"
              />
            </div>
          )}

          {currentStep.inputType === "text" && (
            <div>
              <Input
                type="text"
                placeholder={currentStep.placeholder}
                value={typeof rawValue === "string" ? rawValue : ""}
                onChange={(e) =>
                  setValue(
                    currentStep.field,
                    e.target.value.trim() || undefined
                  )
                }
                className="mt-1"
              />
            </div>
          )}

          {currentStep.inputType === "textarea" && (
            <div>
              <Textarea
                placeholder={currentStep.placeholder}
                value={typeof rawValue === "string" ? rawValue : ""}
                onChange={(e) =>
                  setValue(
                    currentStep.field,
                    e.target.value.trim() || undefined
                  )
                }
                className="mt-1"
                rows={3}
              />
            </div>
          )}

          {currentStep.inputType === "chips" && currentStep.options && (
            <>
              <ChipSelector
                options={currentStep.options}
                value={
                  typeof rawValue === "string" || typeof rawValue === "number"
                    ? String(rawValue)
                    : ""
                }
                onChange={(v) =>
                  setValue(
                    currentStep.field,
                    currentStep.field === "antrenmanSuresi" && typeof v === "string"
                      ? parseInt(v, 10)
                      : v
                  )
                }
                singleSelect
              />
              {showFollowUp && currentStep.followUpField && (
                <div className="mt-4">
                  <Input
                    type="text"
                    placeholder={currentStep.followUpPlaceholder}
                    value={typeof followUpValue === "string" ? followUpValue : ""}
                    onChange={(e) =>
                      setValue(
                        currentStep.followUpField!,
                        e.target.value.trim() || undefined
                      )
                    }
                  />
                </div>
              )}
            </>
          )}

          {currentStep.inputType === "chips-multi" && currentStep.options && (
            <ChipSelector
              options={currentStep.options}
              value={Array.isArray(rawValue) ? rawValue : []}
              onChange={(v) => setValue(currentStep.field, v)}
              singleSelect={false}
            />
          )}

          {currentStep.inputType === "yesno" && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setValue(currentStep.field, true)}
                className={`flex-1 rounded-xl border-2 px-4 py-4 text-center font-medium transition ${
                  rawValue === true
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                {t.onboarding.yes}
              </button>
              <button
                type="button"
                onClick={() => setValue(currentStep.field, false)}
                className={`flex-1 rounded-xl border-2 px-4 py-4 text-center font-medium transition ${
                  rawValue === false
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                {t.onboarding.no}
              </button>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.onboarding.back}
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={step !== TOPLAM_ONBOARDING_ADIM && !canProceed}
              className="gap-1"
            >
              {step === TOPLAM_ONBOARDING_ADIM ? t.onboarding.finish : t.onboarding.next}
              {step < TOPLAM_ONBOARDING_ADIM && (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
