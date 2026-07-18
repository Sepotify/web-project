import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-xl",
  "2xl": "h-32 w-32 text-2xl",
};

interface AvatarProps {
  src?: string;
  alt: string;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-bg-hover text-text-secondary font-semibold",
        sizeMap[size],
        className,
      )}
      aria-label={alt}
    >
      {initials}
    </div>
  );
}
