export const DEFAULT_ADMIN_USERNAMES = [
  "sweet__rain",
  "alpha_rein.",
  "skysmite",
  "chanta0603",
  "ekgus29",
] as const;

export type GameClassSlug = "overwatch" | "pubg" | "valorant";

export type GameClassCard = {
  slug: GameClassSlug;
  name: string;
  game: string;
  gameKr: string;
  emoji: string;
  color: string;
  borderColor: string;
  hoverBorder: string;
  bgGlow: string;
  laserClass: string;
  bannerImage: string;
  mascotImage: string;
  description: string;
  linkColor: string;
};

export const GAME_CLASSES: GameClassCard[] = [
  {
    slug: "overwatch",
    name: "수달반",
    game: "Overwatch",
    gameKr: "오버워치",
    emoji: "🦦",
    color: "text-blue-400",
    borderColor: "border-blue-500/50",
    hoverBorder: "hover:border-blue-400",
    bgGlow: "hover:shadow-blue-500/20",
    laserClass: "laser-border laser-border-blue",
    bannerImage: "/images/banners/overwatch.png",
    mascotImage: "/images/mascots/otter.png",
    description: "팀워크와 전략의 정수, 오버워치를 함께 즐겨요!",
    linkColor: "text-blue-400 hover:text-blue-300",
  },
  {
    slug: "pubg",
    name: "사자반",
    game: "PUBG",
    gameKr: "배틀그라운드",
    emoji: "🦁",
    color: "text-orange-400",
    borderColor: "border-orange-500/50",
    hoverBorder: "hover:border-orange-400",
    bgGlow: "hover:shadow-orange-500/20",
    laserClass: "laser-border laser-border-orange",
    bannerImage: "/images/banners/pubg.png",
    mascotImage: "/images/mascots/lion.png",
    description: "치킨을 향한 여정, 배틀그라운드 마스터!",
    linkColor: "text-orange-400 hover:text-orange-300",
  },
  {
    slug: "valorant",
    name: "여우반",
    game: "Valorant",
    gameKr: "발로란트",
    emoji: "🦊",
    color: "text-purple-400",
    borderColor: "border-purple-500/50",
    hoverBorder: "hover:border-purple-400",
    bgGlow: "hover:shadow-purple-500/20",
    laserClass: "laser-border laser-border-purple",
    bannerImage: "/images/banners/valorant.png",
    mascotImage: "/images/mascots/fox.png",
    description: "정밀한 에임과 전략, 발로란트 에이전트!",
    linkColor: "text-purple-400 hover:text-purple-300",
  },
];

export function getClassBySlug(slug: string) {
  return GAME_CLASSES.find((c) => c.slug === slug);
}
