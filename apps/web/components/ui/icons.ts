import { ArrowRightLeft, Bot, BookOpen, CircleCheckBig, CircleX, FlaskConical, Gamepad2, Gauge, GitMerge, GraduationCap, ListChecks, Search, Settings2, Shield, ShieldCheck, SlidersHorizontal, TriangleAlert, UserCheck, UserRoundCheck, Wrench } from "lucide-react";

export const productIcons = {
  discover: Search,
  assess: Gauge,
  plan: ListChecks,
  map: GitMerge,
  migrate: ArrowRightLeft,
  resolve: Wrench,
  validate: ShieldCheck,
  configure: SlidersHorizontal,
  onboard: UserRoundCheck,
  learn: BookOpen,
  simulator: FlaskConical,
  play: Gamepad2,
  trust: Shield,
  agent: Bot,
  humanApproval: UserCheck,
  warning: TriangleAlert,
  success: CircleCheckBig,
  error: CircleX,
  settings: Settings2,
  education: GraduationCap,
} as const;
