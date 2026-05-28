"use client";

import NextImage, { type ImageProps } from "next/image";
import imageLoader from "@/lib/image-loader";

const useCustomLoader =
  Boolean(process.env.NEXT_PUBLIC_BASE_PATH) &&
  process.env.NEXT_PUBLIC_BASE_PATH !== "/__NEXT_BASEPATH_PLACEHOLDER__";

/** Image Next.js — loader custom uniquement si basePath est configuré (Docker). */
export function AppImage(props: ImageProps) {
  if (useCustomLoader) {
    return <NextImage {...props} loader={imageLoader} />;
  }
  return <NextImage {...props} />;
}
