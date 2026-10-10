export function ProductVision() {
  return <section id="product-vision" className="shell product-vision" aria-labelledby="vision-heading">
    <p className="eyebrow text-primary">Conceptual product vision · 25 sec</p>
    <h2 id="vision-heading" className="type-section mt-3">See the MoveBooks AI vision</h2>
    <p className="mt-3 max-w-3xl text-secondary">A 25-second conceptual view of the intended MoveBooks AI experience, separate from the current synthetic Beta.</p>
    <video className="mt-5 aspect-video w-full rounded-2xl border border-token bg-black" width="1920" height="1080"
      controls playsInline preload="none" poster="/media/movebooks-ai-product-vision-poster.webp"
      aria-label="MoveBooks AI Product Vision" aria-describedby="vision-boundary">
      <source src="/media/movebooks-ai-product-vision.mp4" type="video/mp4"/>
      <a href="/media/movebooks-ai-product-vision.mp4">Watch the MoveBooks AI Product Vision</a>
    </video>
    <p id="vision-boundary" className="mt-4 text-sm leading-6 text-muted">Product Vision shows the intended customer experience and product direction—not a current Beta walkthrough or proof that every depicted screen is implemented. Explore the working Beta to see the currently validated experience.</p>
  </section>;
}
