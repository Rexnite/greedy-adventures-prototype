"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowLeft, ArrowRight, X } from "lucide-react";
const photos = [
  {
    src: "jump-post-exit.webp",
    alt: "Tandem skydivers just after leaving the aircraft",
    caption: "OUT THE DOOR.",
  },
  {
    src: "gearing-up.webp",
    alt: "Instructor fitting the harness before a tandem jump",
    caption: "GOOD PEOPLE. GOOD HANDS.",
  },
  {
    src: "tandem-with-sea-view.webp",
    alt: "Tandem freefall above clouds and the Gulf of Thailand",
    caption: "NOTHING LIKE IT.",
  },
  {
    src: "plane.webp",
    alt: "Jump aircraft waiting at the Thailand dropzone",
    caption: "YOUR RIDE UP.",
  },
];
export function PhotoGallery() {
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (selected !== null && !dialog.current?.open) dialog.current?.showModal();
    if (selected === null && dialog.current?.open) dialog.current.close();
  }, [selected]);
  function move(delta: number) {
    setSelected((i) =>
      i === null ? null : (i + delta + photos.length) % photos.length,
    );
  }
  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo, i) => (
          <button
            className={"gallery-tile tile-" + i}
            key={photo.src}
            onClick={(e) => {
              trigger.current = e.currentTarget;
              setSelected(i);
            }}
            aria-label={"Open photo: " + photo.alt}
          >
            <Image
              loading="eager"
              src={"/media/" + photo.src}
              alt={photo.alt}
              fill
              sizes={
                i === 0
                  ? "(max-width:760px) 100vw, 56vw"
                  : "(max-width:760px) 50vw, 27vw"
              }
            />
            <span className="gallery-caption">
              <span>
                0{i + 1} / {photo.caption}
              </span>
              <ArrowUpRight size={20} />
            </span>
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-label="Dropzone photo gallery"
        onCancel={() => setSelected(null)}
        onClose={() => {
          setSelected(null);
          trigger.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        <div className="photo-toolbar">
          <span>
            {selected !== null
              ? `${selected + 1} / ${photos.length} — ${photos[selected].caption}`
              : ""}
          </span>
          <button
            aria-label="Close photo gallery"
            onClick={() => setSelected(null)}
          >
            <X />
          </button>
        </div>
        {selected !== null && (
          <div className="lightbox-photo">
            <Image
              src={"/media/" + photos[selected].src}
              alt={photos[selected].alt}
              fill
              sizes="90vw"
            />
          </div>
        )}
        <div className="photo-controls">
          <button aria-label="Previous photo" onClick={() => move(-1)}>
            <ArrowLeft /> Previous
          </button>
          <span>PHOTOGRAPHY / GREEDY ADVENTURES</span>
          <button aria-label="Next photo" onClick={() => move(1)}>
            Next <ArrowRight />
          </button>
        </div>
      </dialog>
    </>
  );
}
