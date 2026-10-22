FROM asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/web@sha256:617b943f3abc4e1e32400b765d1867d173941308f494947097990defec52e0ad
USER 0:0
RUN rm -rf /app/.next /app/public
COPY app/ /app/
COPY academy-media/ /app/academy-media/
ENV MOVEBOOKS_ACADEMY_MEDIA_DIR=/app/academy-media
USER 65532:65532
