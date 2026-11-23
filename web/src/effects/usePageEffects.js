import { useEffect } from 'react';

export function usePageEffects(page, { loading, news, events, places, adminEvents, adminPlaces }) {
  useEffect(
    () => {
      document.body.classList.add('motion-ready');
      const targets = document.querySelectorAll('.panel,.event-row,.place-card,.admin-panel,.stat-card');
      const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver(
          entries => entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-inview');
              observer.unobserve(entry.target);
            }
          }),
          { threshold: .12, rootMargin: '0px 0px -6% 0px' }
        )
        : null;
      targets.forEach((el, index) => {
        el.classList.add('reveal-on-scroll');
        el.style.setProperty('--reveal-index', Math.min(index, 6));
        observer?.observe(el);
        if (!observer) el.classList.add('is-inview');
      });
      let frame = 0;
      const update = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          document.documentElement.style.setProperty('--scroll-progress', `${Math.min(100, Math.max(0, window.scrollY / max * 100))}%`);
          frame = 0;
        });
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      return () => {
        observer?.disconnect();
        window.removeEventListener('scroll', update);
        if (frame) cancelAnimationFrame(frame);
        targets.forEach(el => {
          el.classList.remove('reveal-on-scroll', 'is-inview');
          el.style.removeProperty('--reveal-index');
        });
      };
    },
    [page, loading, news.length, events.length, places.length, adminEvents.length, adminPlaces.length]
  );
}
