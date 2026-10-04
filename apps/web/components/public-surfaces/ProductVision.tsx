export function ProductVision() {
  return <section id="product-vision" className="shell py-12" aria-labelledby="vision-heading">
    <p className="eyebrow text-primary">Product vision · 25 sec</p>
    <h2 id="vision-heading" className="type-page mt-3">See the MoveBooks AI vision</h2>
    <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">A safer, more guided path from migration uncertainty to a verified first real task in your new books.</p>
    <video className="mt-8 aspect-video w-full rounded-2xl border border-token bg-black" width="1920" height="1080"
      controls playsInline preload="none" poster="/media/movebooks-ai-product-vision-poster.webp"
      aria-label="MoveBooks AI Product Vision" aria-describedby="vision-boundary">
      <source src="/media/movebooks-ai-product-vision.mp4" type="video/mp4"/>
      <a href="/media/movebooks-ai-product-vision.mp4">Watch the MoveBooks AI Product Vision</a>
    </video>
    <p id="vision-boundary" className="mt-4 text-sm leading-6 text-muted">Product Vision shows the intended customer experience and product direction—not a current Beta walkthrough or proof that every depicted screen is implemented. Explore the working Beta to see the currently validated experience.</p>
  </section>;
}
