"use client";
import { useEffect, useState } from "react";
import { cloudIdentity } from "@/lib/identity";
import { IdentityEntry } from "./IdentityEntry";
import { useIdentity } from "./IdentityProvider";
import { MyMigration } from "./MyMigration";
import { ListProblem, MigrationPicker, useMigrationList } from "./journey/MigrationPicker";
import { LAST_MIGRATION_PREFIX, SELECTED_SESSION_KEY } from "./public-surfaces/session";

/**
 * Chooses what My Migration opens, in this order: an explicit link, the migration selected in this tab,
 * the one this account last opened in this browser (a convenience only), then the account's own
 * migrations from the owner-scoped listing. Every route is authorised again by the API. A migration is
 * never picked at random: several migrations always get a picker, and a failed listing is never shown as
 * "no migrations".
 */
function Remembered({ reference, scope }: { reference?: string; scope: string }) {
  const [start, setStart] = useState<{ remembered: string | null; pick: boolean } | undefined>(reference ? { remembered: null, pick: false } : undefined);
  useEffect(() => {
    if (reference) return;
    try {
      const pick = new URLSearchParams(window.location.search).get("pick") === "1";
      const selected = sessionStorage.getItem(SELECTED_SESSION_KEY);
      setStart({ pick, remembered: pick || selected ? null : localStorage.getItem(`${LAST_MIGRATION_PREFIX}${scope}`) });
    } catch { setStart({ remembered: null, pick: false }); }
  }, [reference, scope]);
  const pickRequired = !reference && start !== undefined && start.remembered === null;
  const selectedInTab = (() => { try { return typeof window !== "undefined" && !!sessionStorage.getItem(SELECTED_SESSION_KEY); } catch { return false; } })();
  const needList = pickRequired && (start?.pick === true || !selectedInTab);
  const listing = useMigrationList(needList);
  if (start === undefined) return <main id="main-content" className="shell member-home" aria-busy="true"><p role="status">Opening your migration…</p></main>;
  if (needList) {
    if (listing.loading) return <main id="main-content" className="shell member-home" aria-busy="true"><p role="status">Checking your migrations…</p></main>;
    if (listing.failure && !listing.list) return <ListProblem failure={listing.failure} retry={listing.retry}/>;
    const list = listing.list;
    if (list && (start?.pick || list.items.length > 1 || list.incomplete || list.skipped > 0) && list.items.length > 0) return <MigrationPicker list={list} loadMore={listing.loadMore} more={listing.more} failure={listing.failure}/>;
    if (list && list.items.length === 1) return <MyMigration key={`${scope}:${list.items[0].id}`} reference={list.items[0].id} storageScope={scope}/>;
    // Welcome only when the account has no accessible migration (an empty, complete listing).
  }
  return <MyMigration key={`${scope}:${reference ?? start.remembered ?? "selected"}`} reference={reference ?? start.remembered ?? undefined} storageScope={scope}/>;
}

function CloudWorkspace({ reference }: { reference?: string }) {
  const { identity } = useIdentity();
  // Key the read consumer by verified account and reference; stale reads unmount.
  const destination = reference !== undefined ? `/workspace?session=${encodeURIComponent(reference)}` : "/workspace";
  return identity ? <Remembered key={identity.subject} reference={reference} scope={identity.subject}/> : <main id="main-content" className="shell member-home">
    <h1 className="type-section">Sign in to continue your migration</h1>
    <p className="mt-3">Use your Google account to securely access your MoveBooks migration. New here? You start with a sample business. Returning? Your migration resumes where you left off.</p>
    <IdentityEntry destination={destination} />
  </main>;
}
// /workspace is My Migration. The local demo is already behind the demo sign-in middleware.
export function WorkspaceEntry({ reference }: { reference?: string } = {}) { return cloudIdentity() ? <CloudWorkspace reference={reference}/> : <Remembered reference={reference} scope="demo"/>; }
