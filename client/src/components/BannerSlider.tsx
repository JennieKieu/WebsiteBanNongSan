import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";

type Banner = {
  _id: string;
  title: string;
  image?: { secure_url: string };
  link?: string;
  isActive?: boolean;
};

type Props = { banners: Banner[] };

const AUTO_INTERVAL = 4000;

export default function BannerSlider({ banners }: Props) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const total = banners.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, AUTO_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, total, next]);

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, AUTO_INTERVAL);
  }

  function handlePrev() { prev(); resetTimer(); }
  function handleNext() { next(); resetTimer(); }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) handleNext();
      else handlePrev();
    }
  }

  if (!total) return null;

  return (
    <section
      className="banner-slider"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="banner-slider-track">
        {banners.map((b, i) => (
          <div
            key={b._id}
            className={`banner-slide ${i === current ? "active" : ""}`}
          >
            {b.link ? (
              <Link to={b.link} className="banner-slide-link">
                <img
                  src={b.image?.secure_url || `https://placehold.co/1280x400/E8F5E9/2E7D32?text=${encodeURIComponent(b.title)}`}
                  alt={b.title}
                  draggable={false}
                />
                <div className="banner-slide-overlay">
                  <h2>{b.title}</h2>
                </div>
              </Link>
            ) : (
              <div className="banner-slide-link">
                <img
                  src={b.image?.secure_url || `https://placehold.co/1280x400/E8F5E9/2E7D32?text=${encodeURIComponent(b.title)}`}
                  alt={b.title}
                  draggable={false}
                />
                <div className="banner-slide-overlay">
                  <h2>{b.title}</h2>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button className="banner-arrow banner-arrow-left" onClick={handlePrev} aria-label="Trước">
            <HiOutlineChevronLeft />
          </button>
          <button className="banner-arrow banner-arrow-right" onClick={handleNext} aria-label="Sau">
            <HiOutlineChevronRight />
          </button>
          <div className="banner-dots">
            {banners.map((_, i) => (
              <button
                key={i}
                className={`banner-dot ${i === current ? "active" : ""}`}
                onClick={() => { goTo(i); resetTimer(); }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
