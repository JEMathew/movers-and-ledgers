"use client";
import { OfficeMission } from "@/components/play/OfficeMission";
import { Surface } from "./Surface";

export function Play() {
  return <Surface compact eyebrow="Play" title="A fresh start for the books." intro="Step into a small bookkeeping office. Play as Eli, follow the evidence and solve your first migration question." sourceScope="A playable opening mission" scopeNote="Game progress stays in this visit. It does not read, approve or change a financial workspace."><OfficeMission /></Surface>;
}
