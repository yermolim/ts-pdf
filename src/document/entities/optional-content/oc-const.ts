export const creatorInfoTypes = {
  ART: "/Artwork",
  TECH: "/Technical",
} as const;
export type CreatorInfoType = typeof creatorInfoTypes[keyof typeof creatorInfoTypes];

export const pageElementTypes = {
  HEADER_FOOTER: "/HF",
  FOREGROUND: "/FG",
  BACKGROUND: "/BG",
  LOGO: "/L",
} as const;
export type PageElementType = typeof pageElementTypes[keyof typeof pageElementTypes];

export const ocConfigStates = {
  ON: "/ON",
  OFF: "/OFF",
  NONE: "/Unchanged",
} as const;
export type OcConfigState = typeof ocConfigStates[keyof typeof ocConfigStates];

export const ocListModes = {
  ALL: "/AllPages",
  VISIBLE: "/VisiblePages",
} as const;
export type OcListMode = typeof ocListModes[keyof typeof ocListModes];

export const ocIntents = {
  DESIGN: "/Design",
  VIEW: "/View",
  ALL: "/All",
} as const;
export type OcIntent = typeof ocIntents[keyof typeof ocIntents];

export const visibilityPolicies = {
  ALL_ON: "/AllOn",
  ALL_OFF: "/AllOff",
  ANY_ON: "/AnyOn",
  ANY_OFF: "/AnyOff",
} as const;
export type VisibilityPolicy = typeof visibilityPolicies[keyof typeof visibilityPolicies];

export const usageEvents = {
  VIEW: "/View",
  PRINT: "/Print",
  EXPORT: "/Export",
} as const;
export type UsageEvent = typeof usageEvents[keyof typeof usageEvents];
