export const NAV_ITEMS = [
  { to: "/", icon: "temple_buddhist", labelKey: "nav.dashboard", sealText: "道", end: true },
  { to: "/library", icon: "menu_book", labelKey: "nav.library", sealText: "典", end: false },
  { to: "/characters", icon: "draw", labelKey: "nav.characters", sealText: "字", end: false },
  { to: "/review", icon: "auto_stories", labelKey: "nav.review", sealText: "忆", end: false },
  { to: "/settings", icon: "tune", labelKey: "nav.settings", sealText: "室", end: false },
] as const;
