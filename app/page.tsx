"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAdventureTransition } from "@/components/adventure-transition";
import { PhotoGallery } from "@/components/photo-gallery";
import {
  ArrowUpRight,
  ArrowDown,
  Play,
  MapPin,
  Plus,
  Minus,
  Wind,
  ShieldCheck,
  Camera,
  Menu,
  X,
  Compass,
  Pause,
  MessageCircle,
} from "lucide-react";
import { Concierge } from "@/components/concierge";

const official =
  "https://www.greedyadventures.com/experiences/sea-view-skydiving";
const film =
  "https://www.greedyadventures.com/greedy/films/sea-view-studio-hero.mp4";
const packages = [
  {
    name: "ECO",
    price: "9,500",
    tag: "JUST YOU & THE SKY",
    description: "The jump, nothing else.",
    media: "Standard tandem skydive",
    image: "eco.jpg",
  },
  {
    name: "DELUXE",
    price: "12,500",
    tag: "KEEP THE FEELING",
    description: "Your moment. Every angle.",
    media: "Video and photos included",
    image: "jump-after-exit.webp",
  },
  {
    name: "VIP",
    price: "14,000",
    tag: "THE FULL PICTURE",
    description: "Make it a movie.",
    media: "Personal cameraman & edited film",
    image: "jump-post-exit.webp",
  },
];
const steps = [
  ["Arrival & check-in", "Meet us at the dropzone. Bring your photo ID."],
  ["Briefing & gear", "Meet your instructor. Get your harness fitted."],
  ["The climb", "Board the aircraft and climb to jump altitude."],
  ["The leap", "Exit with your instructor over the Gulf of Thailand."],
  [
    "Float back to earth",
    "Take in the coast under canopy, then land at the dropzone.",
  ],
];
const faqs = [
  [
    "Do I need skydiving experience?",
    "No experience is needed. The official experience page says a USPA-certified tandem instructor flies the jump.",
  ],
  [
    "Which package is right for me?",
    "Choose ECO for the jump itself, DELUXE for video and photos, or VIP for a personal cameraman and edited film. All packages use the same aircraft, altitude and instructors.",
  ],
  [
    "How long should I allow?",
    "The website lists approximately 3 hours at the dropzone, around 60 seconds of freefall and 5–7 minutes under canopy.",
  ],
  [
    "Where do we meet?",
    "The source names Pattaya Sea View but also lists 95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand. Confirm the exact meeting location with Greedy Adventures before travelling.",
  ],
  [
    "Can I get a pickup from Bangkok?",
    "The official page lists Bangkok pickup as a fixed-price add-on. It does not provide the price; contact the operator to confirm.",
  ],
];
export default function Home() {
  const { navigate, playAction, cancelAction, transition } =
    useAdventureTransition();
  const [menu, setMenu] = useState(false),
    [chat, setChat] = useState(false),
    [video, setVideo] = useState(false),
    [playing, setPlaying] = useState(false),
    [faq, setFaq] = useState<number | null>(0);
  const player = useRef<HTMLVideoElement>(null),
    watch = useRef<HTMLButtonElement>(null),
    filmTrigger = useRef<HTMLButtonElement | null>(null),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (video) {
      dialog.current?.showModal();
      void player.current?.play().catch(() => {
        setPlaying(false);
      });
    } else dialog.current?.close();
  }, [video]);
  function watchFilm(e: React.MouseEvent<HTMLButtonElement>) {
    filmTrigger.current = e.currentTarget;
    setChat(false);
    setMenu(false);
    playAction({ theme: "sky", onArrive: () => setVideo(true) });
  }
  function leap(e: React.MouseEvent<HTMLAnchorElement>) {
    setMenu(false);
    navigate(e);
  }
  return (
    <div>
      <a className="skip" href="#experience">
        Skip to experience
      </a>
      <header className="nav">
        <Link href="/" className="brand" aria-label="Greedy Adventures home">
          <span className="brand-mark">
            g<span>↗</span>
          </span>
          <span>
            greedy<span className="brand-sub">ADVENTURES</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className={menu ? "nav-links open" : "nav-links"}
        >
          <a href="#experience" onClick={() => setMenu(false)}>
            The experience
          </a>
          <a href="#packages" onClick={leap}>
            Packages
          </a>
          <a href="#journey" onClick={() => setMenu(false)}>
            The journey
          </a>
          <a href="#faqs" onClick={() => setMenu(false)}>
            FAQs
          </a>
        </nav>
        <div className="nav-actions">
          <button
            className="nav-assist"
            aria-label="Open adventure concierge"
            aria-expanded={chat}
            aria-controls="concierge"
            onClick={() => {
              setMenu(false);
              setChat(true);
            }}
          >
            <MessageCircle size={20} />
            <span>Ask us</span>
          </button>
          <a
            className="nav-cta"
            href="#packages"
            onClick={leap}
            aria-label="Take the leap"
          >
            <span className="nav-cta-label">Take the leap</span>{" "}
            <ArrowUpRight size={17} />
          </a>
          <button
            className="menu-toggle"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-photo">
            <Image
              src="/media/tandem-with-sea-view.webp"
              alt="Tandem skydivers in freefall above clouds and the Gulf of Thailand"
              fill
              priority
              sizes="100vw"
              quality={90}
            />
          </div>
          <div className="hero-shade" />
          <div className="hero-topline">
            <span>
              <MapPin size={13} /> THAILAND · SEA VIEW SKYDIVING
            </span>
            <span className="edition">GREEDY / FIELD NOTES 001</span>
          </div>
          <div className="hero-content">
            <div className="eyebrow">
              <i /> LESS SCROLLING. MORE LIVING.
            </div>
            <h1 id="hero-title">
              GET OUT.
              <br />
              <em>GO ALL IN.</em>
            </h1>
            <p>
              13,000 feet. Open ocean.
              <br />
              You, actually going for it.
            </p>
            <div className="hero-actions">
              <a className="button orange" href="#packages" onClick={leap}>
                Experience skydiving <ArrowUpRight size={19} />
              </a>
              <button className="watch" ref={watch} onClick={watchFilm}>
                <span>
                  <Play size={14} fill="currentColor" />
                </span>{" "}
                Watch the jump
              </button>
            </div>
          </div>
          <div className="altitude">
            <span>ALTITUDE</span>
            <div className="altitude-rule" />
            <strong>13,000</strong>
            <span>FEET / EXIT ALTITUDE</span>
          </div>
          <div className="hero-bottom">
            <a href="#experience">
              <ArrowDown size={16} /> SCROLL TO FEEL IT
            </a>
            <span>TANDEM SKYDIVING / GULF OF THAILAND</span>
            <span>
              01 <span className="thin-line" /> 05
            </span>
          </div>
        </section>
        <div className="field-strip" aria-hidden="true">
          <span>GET OUT THERE.</span>
          <span>TAKE IT ALL IN.</span>
          <span>COME BACK DIFFERENT. ↗</span>
        </div>
        <section className="facts" aria-label="Experience at a glance">
          <div>
            <span>THE LEAP</span>
            <strong>
              13,000 <small>ft</small>
            </strong>
          </div>
          <div>
            <span>THE RUSH</span>
            <strong>
              60 <small>sec freefall</small>
            </strong>
          </div>
          <div>
            <span>THE VIEW</span>
            <strong>
              Endless <small>ocean</small>
            </strong>
          </div>
          <div className="fact-note">
            <ShieldCheck size={27} />
            <p>
              Your leap. Expert hands.
              <br />
              <b>USPA-certified instructors</b>
            </p>
          </div>
        </section>
        <section id="experience" className="experience section">
          <div className="experience-copy reveal">
            <span className="eyebrow dark">01 / THE EXPERIENCE</span>
            <h2>
              OUT OF YOUR HEAD.
              <br />
              <em>INTO THE OPEN.</em>
            </h2>
            <p>
              You don’t need to be fearless. You just need to show up. We’ll
              introduce you to your instructor, get you geared up, and take you
              to the open door.
            </p>
            <p>
              Jump tandem with a certified instructor over the Gulf of Thailand.
              Freefall for around a minute, then slow everything down with a 5–7
              minute canopy flight along the coast.
            </p>
            <a href="#packages" onClick={leap} className="text-link">
              Get into it <ArrowUpRight size={20} />
            </a>
            <div className="experience-notes">
              <span>
                <Wind size={17} /> No experience needed
              </span>
              <span>
                <Compass size={17} /> Ocean-view jump
              </span>
            </div>
          </div>
          <div className="experience-image reveal">
            <Image
              src="/media/jump-after-exit.webp"
              alt="Tandem skydivers leaving the jump aircraft"
              fill
              sizes="(max-width: 760px) 100vw, 50vw"
            />
            <span className="image-label">THE DOOR IS OPEN. YOUR MOVE.</span>
            <span className="photo-stamp">
              SEND
              <br />
              IT.
            </span>
          </div>
        </section>
        <section
          id="packages"
          tabIndex={-1}
          aria-labelledby="package-title"
          className="packages section"
        >
          <div className="section-heading reveal">
            <div>
              <span className="eyebrow dark">02 / CHOOSE YOUR LEAP</span>
              <h2 id="package-title">
                PICK YOUR
                <br />
                <em>KIND OF SEND.</em>
              </h2>
            </div>
            <p>
              Same aircraft. Same altitude. Same instructors.
              <br />
              The difference? Who’s holding the camera.
            </p>
          </div>
          <div className="package-grid">
            {packages.map((pkg, i) => (
              <article
                className={"package reveal " + (i === 1 ? "featured" : "")}
                key={pkg.name}
              >
                <a
                  className="package-image"
                  href={official + "#packages"}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={"View " + pkg.name + " on the official website"}
                >
                  <Image
                    loading="eager"
                    src={"/media/" + pkg.image}
                    alt={`${pkg.name} skydiving experience`}
                    fill
                    sizes="(max-width:760px) 100vw, 33vw"
                  />
                  <span className="package-number">0{i + 1}</span>
                  {i === 1 && (
                    <span className="package-badge">THE MOMENT, CAPTURED</span>
                  )}
                </a>
                <div className="package-body">
                  <span className="eyebrow dark">{pkg.tag}</span>
                  <div className="package-name">
                    <h3>
                      <a
                        href={official + "#packages"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {pkg.name}
                      </a>
                    </h3>
                    <span aria-hidden="true">↗</span>
                  </div>
                  <p>{pkg.description}</p>
                  <ul>
                    <li>
                      <ShieldCheck size={15} /> Tandem jump & instructor
                    </li>
                    <li>
                      <Wind size={15} /> Briefing, gear & aircraft ascent
                    </li>
                    <li>
                      <Camera size={15} /> {pkg.media}
                    </li>
                    <li>
                      <Plus size={15} /> Certificate of completion
                    </li>
                  </ul>
                  <div className="package-price">
                    <strong>
                      <small>฿</small>
                      {pkg.price}
                    </strong>
                    <span>per person</span>
                  </div>
                  <a
                    className={"button " + (i === 1 ? "orange" : "outline")}
                    href={official + "#packages"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore {pkg.name.toLowerCase()} <ArrowUpRight size={18} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className="package-footnote">
            Prices captured from the official experience page. Confirm current
            details with the operator. No booking or payment is taken here.
          </p>
        </section>
        <section id="journey" className="journey section">
          <div className="journey-intro reveal">
            <span className="eyebrow">03 / A DAY AT THE DROPZONE</span>
            <h2>
              FROM GEAR UP
              <br />
              <em>TO TOUCHDOWN.</em>
            </h2>
            <p>
              Plan for about three hours with us.
              <br />
              Here’s how it goes down.
            </p>
            <div className="journey-photo">
              <Image
                src="/media/plane.webp"
                alt="Jump aircraft at the Thailand dropzone"
                fill
                sizes="(max-width:760px) 100vw, 40vw"
              />
            </div>
          </div>
          <ol className="timeline">
            {steps.map(([title, description], i) => (
              <li className="reveal" key={title}>
                <span className="step-number">0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                {i === 3 && <ArrowUpRight className="step-arrow" />}
              </li>
            ))}
          </ol>
        </section>
        <section className="gallery section">
          <div className="section-heading reveal">
            <div>
              <span className="eyebrow dark">04 / THE REAL THING</span>
              <h2>
                THIS COULD
                <br />
                <em>BE YOU.</em>
              </h2>
            </div>
            <button className="text-link" onClick={watchFilm}>
              See the jump in motion <Play size={17} />
            </button>
          </div>
          <PhotoGallery />
        </section>
        <section id="faqs" className="faq section">
          <div className="reveal">
            <span className="eyebrow dark">05 / BEFORE YOU GO</span>
            <h2>
              BEFORE
              <br />
              <em>YOU SEND IT.</em>
            </h2>
            <button className="text-link" onClick={() => setChat(true)}>
              Ask the concierge <ArrowUpRight size={19} />
            </button>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a], i) => (
              <div className="faq-item" key={q}>
                <h3>
                  <button
                    aria-expanded={faq === i}
                    aria-controls={"faq-" + i}
                    onClick={() => setFaq(faq === i ? null : i)}
                  >
                    {q}
                    {faq === i ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                </h3>
                <div id={"faq-" + i} hidden={faq !== i}>
                  <p>{a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <span className="eyebrow">THE GROUP CHAT CAN WAIT.</span>
          <h2>
            GOT THAT
            <br />
            <em>ITCH?</em>
          </h2>
          <a href="#packages" onClick={leap} className="button orange">
            Take the leap <ArrowUpRight size={19} />
          </a>
          <span className="cta-coordinates">SEA VIEW SKYDIVING / THAILAND</span>
        </section>
      </main>
      <footer>
        <Link href="/" className="brand">
          <span className="brand-mark">
            g<span>↗</span>
          </span>
          <span>
            greedy<span className="brand-sub">ADVENTURES</span>
          </span>
        </Link>
        <p>Get outside. Come back different.</p>
        <div>
          <a href={official} target="_blank" rel="noreferrer">
            Official experience ↗
          </a>
          <Link href="/knowledge">Knowledge inspector ↗</Link>
          <button onClick={() => setChat(true)}>AI concierge ↗</button>
        </div>
        <div className="footer-bottom">
          <span>
            © 2026 · Assignment prototype. Not an official Greedy Adventures
            website.
          </span>
          <span>Photography & film: Greedy Adventures</span>
        </div>
      </footer>
      <Concierge open={chat} onOpenChange={setChat} />
      {transition}
      <dialog
        ref={dialog}
        className="film-dialog"
        aria-label="Official Sea View skydiving film"
        onCancel={() => setVideo(false)}
        onClose={() => {
          cancelAction();
          setVideo(false);
          setPlaying(false);
          (filmTrigger.current || watch.current)?.focus();
        }}
      >
        <div className="film-top">
          <span>SEA VIEW / THE JUMP</span>
          <button
            aria-label="Close film"
            onClick={() => {
              player.current?.pause();
              setVideo(false);
            }}
          >
            <X />
          </button>
        </div>
        {video && (
          <video
            ref={player}
            src={film}
            poster="/media/hero.jpg"
            controls
            muted
            autoPlay
            playsInline
            preload="auto"
            aria-label="Official Sea View Skydiving film"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}
        <div className="film-footer">
          <span>Official film · Greedy Adventures</span>
          <button
            onClick={() =>
              playing ? player.current?.pause() : void player.current?.play()
            }
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
            {playing ? "Pause" : "Play"} film
          </button>
          <a href={film} target="_blank" rel="noreferrer">
            Open original ↗
          </a>
        </div>
      </dialog>
    </div>
  );
}
