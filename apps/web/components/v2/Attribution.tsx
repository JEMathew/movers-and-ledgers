/**
 * Owner-locked homepage branding, implemented for local review only.
 * Public asset/placement permission and qualifying Gemini-use evidence remain open.
 * This does not change Planned AI status or certify live inference.
 */
export const APPROVED_ATTRIBUTION = "Built on Google Cloud · Built with Google Gemini";

export function Attribution({ className = "" }: { className?: string }) {
  return <p className={`v2-attribution ${className}`.trim()}>
    <span className="provider-unit">
      <span>Built on Google Cloud</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- unchanged official local assets; no image transformation */}
      <img src="/brand/google-cloud-official.png" alt="Google Cloud logo" width="18" height="18" />
    </span>{" "}
    <span className="provider-unit">
      <span>· Built with Google Gemini</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- unchanged official local assets; no image transformation */}
      <img src="/brand/google-gemini-official.png" alt="Google Gemini logo" width="18" height="18" />
    </span>
  </p>;
}
