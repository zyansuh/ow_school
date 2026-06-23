export const DEFAULT_ADMIN_USERNAMES = [
  "sweet__rain",
  "alpha_rein.",
  "hanbyeol2497",
  "pastel_purete",
  "teamgod804",
  "antares_s",
  "minozizi",
  "sperospera1",
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
  /** @deprecated laser-border — accentRing 사용 */
  laserClass: string;
  bannerImage: string;
  mascotImage: string;
  description: string;
  linkColor: string;
  /** 배너 위 게임별 컬러 오버레이 */
  overlayTint: string;
  /** 카드 hover 시 링 강조 */
  accentRing: string;
  /** 배너 태그 스타일 */
  tagClass: string;
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
    laserClass: "",
    bannerImage: "/images/banners/overwatch.webp",
    mascotImage: "/images/mascots/otter.webp",
    description: "팀워크와 전략의 정수. 영웅들과 함께 경쟁전·팀플레이를 배우는 오버워치 클래스입니다.",
    linkColor: "text-blue-400 group-hover:text-blue-300",
    overlayTint: "bg-gradient-to-br from-blue-600/25 via-transparent to-orange-500/10",
    accentRing: "group-hover:shadow-[0_12px_40px_-8px_rgba(88,101,242,0.35)]",
    tagClass: "bg-blue-500/20 text-blue-200 border-blue-400/30",
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
    laserClass: "",
    bannerImage: "/images/banners/pubg.webp",
    mascotImage: "/images/mascots/lion.webp",
    description: "에란겔 전장에서 스쿼드와 함께 생존·전술을 익히는 배틀그라운드 클래스입니다.",
    linkColor: "text-orange-400 group-hover:text-orange-300",
    overlayTint: "bg-gradient-to-br from-amber-700/30 via-transparent to-stone-900/20",
    accentRing: "group-hover:shadow-[0_12px_40px_-8px_rgba(245,158,11,0.35)]",
    tagClass: "bg-orange-500/20 text-orange-200 border-orange-400/30",
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
    laserClass: "",
    bannerImage: "/images/banners/valorant.webp",
    mascotImage: "/images/mascots/fox.webp",
    description: "정밀한 에임과 팀 전술. Riot 스타일의 전술 FPS 발로란트를 함께 배웁니다.",
    linkColor: "text-purple-400 group-hover:text-purple-300",
    overlayTint: "bg-gradient-to-br from-red-600/20 via-transparent to-[#ff4655]/15",
    accentRing: "group-hover:shadow-[0_12px_40px_-8px_rgba(255,70,85,0.3)]",
    tagClass: "bg-[#ff4655]/20 text-red-200 border-red-400/30",
  },
];

export function getClassBySlug(slug: string) {
  return GAME_CLASSES.find((c) => c.slug === slug);
}
