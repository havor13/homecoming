// Shared by server and client code: nothing server-only in here.
export const STORY_HOURS = 24;
export const STORY_MAX_CHARS = 200;

export const STORY_BACKGROUNDS = {
  green: { label: "Green", color: "#0e6b5b" },
  purple: { label: "Purple", color: "#7a3e9d" },
  clay: { label: "Clay", color: "#b5532a" },
  blue: { label: "Blue", color: "#1f4e8c" },
  wine: { label: "Wine", color: "#8a2f4a" },
  slate: { label: "Slate", color: "#3d3d3d" },
} as const;

export type StoryBg = keyof typeof STORY_BACKGROUNDS;
export const STORY_BG_KEYS = Object.keys(STORY_BACKGROUNDS) as [StoryBg, ...StoryBg[]];

export function bgColor(key: string) {
  return (STORY_BACKGROUNDS as Record<string, { color: string }>)[key]?.color ?? STORY_BACKGROUNDS.green.color;
}
