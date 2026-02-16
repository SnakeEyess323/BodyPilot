"use client";

import Image from "next/image";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Zap, Info, Play, Square, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise, Difficulty } from "@/lib/exercises";
import { difficultyLabels, equipmentLabels } from "@/lib/exercises";
import { getMuscleById } from "@/components/ui/muscle-map/muscle-data";
import { staticImageUrls } from "@/lib/useExerciseGif";
import { useWgerMedia } from "@/lib/useWgerMedia";

interface ExerciseCardProps {
  exercise: Exercise;
  language: "tr" | "en" | "de" | "ru";
  onClick?: () => void;
}

const difficultyColors: Record<Difficulty, string> = {
  beginner: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

/**
 * Statik URL'den animasyon URL'lerini türet.
 * free-exercise-db'de her egzersiz için 2 fotoğraf var:
 * /0.jpg (başlangıç pozisyonu) ve /1.jpg (bitiş pozisyonu)
 */
function getAnimationUrls(staticUrl: string): { frame0: string; frame1: string } | null {
  // ImageKit URL'si ise /0.jpg → /1.jpg dönüşümü yap
  if (staticUrl.includes("ik.imagekit.io/yuhonas") && staticUrl.endsWith("/0.jpg")) {
    return {
      frame0: staticUrl,
      frame1: staticUrl.replace("/0.jpg", "/1.jpg"),
    };
  }
  return null;
}

export function ExerciseCard({ exercise, language, onClick }: ExerciseCardProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Animasyon durumları
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frame1Loaded, setFrame1Loaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Video durumları
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // wger medya
  const { hasVideo, videoUrl } = useWgerMedia(exercise.id);

  const muscle = getMuscleById(exercise.muscleId);

  const imageUrl = useMemo(() => {
    return staticImageUrls[exercise.id] || exercise.imageUrl;
  }, [exercise.id, exercise.imageUrl]);

  const animFrames = useMemo(() => getAnimationUrls(imageUrl), [imageUrl]);

  const toggleAnimation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (showVideo) return; // Video modunda iken kare animasyonu yapma
    if (!animFrames) return;

    if (isAnimating) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsAnimating(false);
      setCurrentFrame(0);
    } else {
      setIsAnimating(true);
      setCurrentFrame(1);
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev === 0 ? 1 : 0));
      }, 800);
    }
  }, [isAnimating, animFrames, showVideo]);

  const toggleVideo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasVideo) return;

    if (showVideo) {
      // Video kapat
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setShowVideo(false);
    } else {
      // Kare animasyonu durdur
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsAnimating(false);
      setCurrentFrame(0);
      setShowVideo(true);
    }
  }, [hasVideo, showVideo]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const activeImageUrl = animFrames && isAnimating
    ? (currentFrame === 0 ? animFrames.frame0 : animFrames.frame1)
    : imageUrl;

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30"
      whileHover={{ y: -4 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image/Video Container */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-muted cursor-pointer"
        onClick={toggleAnimation}
      >
        {/* Video mode */}
        {showVideo && videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 h-full w-full object-cover z-[2]"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
          />
        )}

        {/* Image mode */}
        {!showVideo && !imageError && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImageUrl}
              alt={exercise.name[language]}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-transform duration-500",
                isHovered && !isAnimating && "scale-105"
              )}
              onError={() => setImageError(true)}
              loading="lazy"
            />

            {animFrames && !frame1Loaded && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={animFrames.frame1}
                alt=""
                className="hidden"
                onLoad={() => setFrame1Loaded(true)}
              />
            )}
          </>
        )}

        {/* Fallback icon */}
        {!showVideo && imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Dumbbell className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Video butonu (wger video varsa) */}
        {hasVideo && (
          <div className="absolute top-3 right-12 z-10">
            <div
              onClick={toggleVideo}
              className={cn(
                "rounded-full px-2.5 py-1 backdrop-blur-sm transition-all duration-200 cursor-pointer",
                showVideo
                  ? "bg-red-500/80 hover:bg-red-500"
                  : "bg-violet-600/80 hover:bg-violet-600"
              )}
            >
              <span className="flex items-center gap-1 text-xs font-medium text-white">
                {showVideo ? (
                  <>
                    <Square className="h-3 w-3 fill-white" />
                    Kapat
                  </>
                ) : (
                  <>
                    <Video className="h-3 w-3" />
                    Video
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Kare animasyon butonu (video yoksa veya video kapalıysa) */}
        {!showVideo && animFrames && !imageError && !hasVideo && (
          <div className="absolute top-3 right-12 z-10">
            <div
              className={cn(
                "rounded-full px-2.5 py-1 backdrop-blur-sm transition-all duration-200 cursor-pointer",
                isAnimating
                  ? "bg-red-500/80 hover:bg-red-500"
                  : "bg-black/50 hover:bg-black/70"
              )}
            >
              <span className="flex items-center gap-1 text-xs font-medium text-white">
                {isAnimating ? (
                  <>
                    <Square className="h-3 w-3 fill-white" />
                    Dur
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-white" />
                    Oynat
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Kare animasyon butonu (video varsa ama kapalıysa, ikinci buton) */}
        {!showVideo && animFrames && !imageError && hasVideo && (
          <div className="absolute top-3 right-[5.5rem] z-10">
            <div
              className={cn(
                "rounded-full px-2.5 py-1 backdrop-blur-sm transition-all duration-200 cursor-pointer",
                isAnimating
                  ? "bg-red-500/80 hover:bg-red-500"
                  : "bg-black/50 hover:bg-black/70"
              )}
            >
              <span className="flex items-center gap-1 text-xs font-medium text-white">
                {isAnimating ? (
                  <>
                    <Square className="h-3 w-3 fill-white" />
                    Dur
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-white" />
                    Oynat
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Animasyon göstergesi */}
        <AnimatePresence>
          {isAnimating && !showVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="flex gap-1.5">
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  currentFrame === 0 ? "bg-white scale-125" : "bg-white/50"
                )} />
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  currentFrame === 1 ? "bg-white scale-125" : "bg-white/50"
                )} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-[3]" />

        {/* Muscle tag */}
        {muscle && (
          <span className="absolute top-3 left-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm z-[4]">
            {muscle.name[language]}
          </span>
        )}

        {/* Info button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDescription(!showDescription);
          }}
          className="absolute top-3 right-3 z-10 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/40"
        >
          <Info className="h-4 w-4 text-white" />
        </button>

        {/* Exercise name on image */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-[4]">
          <h3 className="text-lg font-semibold text-white drop-shadow-md">
            {exercise.name[language]}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Difficulty Badge */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              difficultyColors[exercise.difficulty]
            )}
          >
            <Zap className="h-3 w-3" />
            {difficultyLabels[exercise.difficulty][language]}
          </span>
        </div>

        {/* Equipment Tags */}
        <div className="flex flex-wrap gap-1.5">
          {exercise.equipment.slice(0, 3).map((eq) => (
            <span
              key={eq}
              className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {equipmentLabels[eq][language]}
            </span>
          ))}
          {exercise.equipment.length > 3 && (
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              +{exercise.equipment.length - 3}
            </span>
          )}
        </div>

        {/* Description (expandable) */}
        <motion.div
          initial={false}
          animate={{
            height: showDescription ? "auto" : 0,
            opacity: showDescription ? 1 : 0,
          }}
          className="overflow-hidden"
        >
          <p className="pt-2 text-sm text-muted-foreground border-t border-border">
            {exercise.description[language]}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Compact version for lists
export function ExerciseCardCompact({ exercise, language, onClick }: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { hasVideo, videoUrl } = useWgerMedia(exercise.id);
  const muscle = getMuscleById(exercise.muscleId);

  const imageUrl = useMemo(() => {
    return staticImageUrls[exercise.id] || exercise.imageUrl;
  }, [exercise.id, exercise.imageUrl]);

  const animFrames = useMemo(() => getAnimationUrls(imageUrl), [imageUrl]);

  const handleThumbnailClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // Video varsa video göster
    if (hasVideo && !showVideo) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsAnimating(false);
      setCurrentFrame(0);
      setShowVideo(true);
      return;
    }

    // Video gösteriliyorsa kapat
    if (showVideo) {
      if (videoRef.current) videoRef.current.pause();
      setShowVideo(false);
      return;
    }

    // Kare animasyonu
    if (!animFrames) return;
    if (isAnimating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsAnimating(false);
      setCurrentFrame(0);
    } else {
      setIsAnimating(true);
      setCurrentFrame(1);
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev === 0 ? 1 : 0));
      }, 800);
    }
  }, [isAnimating, animFrames, hasVideo, showVideo]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const activeImageUrl = animFrames && isAnimating
    ? (currentFrame === 0 ? animFrames.frame0 : animFrames.frame1)
    : imageUrl;

  return (
    <motion.div
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:bg-accent/50 cursor-pointer"
      whileHover={{ x: 4 }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div
        className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted cursor-pointer"
        onClick={handleThumbnailClick}
      >
        {/* Video mode */}
        {showVideo && videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 h-full w-full object-cover z-[2]"
            autoPlay
            loop
            muted
            playsInline
          />
        )}

        {/* Image mode */}
        {!showVideo && !imageError && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImageUrl}
              alt={exercise.name[language]}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />

            {/* Play overlay */}
            {(animFrames || hasVideo) && !isAnimating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                {hasVideo ? (
                  <Video className="h-4 w-4 text-white" />
                ) : (
                  <Play className="h-4 w-4 text-white fill-white" />
                )}
              </div>
            )}

            {/* Animating indicator */}
            {isAnimating && (
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                <div className={cn("w-1 h-1 rounded-full", currentFrame === 0 ? "bg-white" : "bg-white/40")} />
                <div className={cn("w-1 h-1 rounded-full", currentFrame === 1 ? "bg-white" : "bg-white/40")} />
              </div>
            )}
          </>
        )}

        {/* Video playing indicator */}
        {showVideo && (
          <div className="absolute top-0.5 right-0.5 z-[3]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        )}

        {!showVideo && imageError && (
          <div className="flex h-full w-full items-center justify-center">
            <Dumbbell className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">
          {exercise.name[language]}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          {muscle && (
            <span className="text-xs text-primary">{muscle.name[language]}</span>
          )}
          <span className="text-xs text-muted-foreground">•</span>
          <span className={cn("text-xs", difficultyColors[exercise.difficulty].split(" ")[1])}>
            {difficultyLabels[exercise.difficulty][language]}
          </span>
          {hasVideo && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-violet-500 flex items-center gap-0.5">
                <Video className="h-3 w-3" />
                Video
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="text-muted-foreground transition-transform group-hover:translate-x-1">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
}
