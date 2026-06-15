import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  const [showFeatures, setShowFeatures] = useState(false);
  const featuresRef = useRef(null);

  const handleViewFeatures = () => {
    setShowFeatures(true);

    setTimeout(() => {
      featuresRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 px-4 py-8 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-20 h-[28rem] w-[28rem] animate-pulse rounded-full bg-pink-500/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[32rem] w-[32rem] animate-pulse rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] animate-pulse rounded-full bg-violet-500/30 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-10 top-20 h-32 w-32 animate-bounce rounded-full border border-white/30" />
        <div className="absolute right-24 top-32 h-20 w-20 animate-bounce rounded-full border border-pink-300/40 [animation-delay:700ms]" />
        <div className="absolute bottom-28 left-1/4 h-24 w-24 animate-bounce rounded-full border border-sky-300/40 [animation-delay:1000ms]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-[fadeInUp_0.9s_ease-out]">
            <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-black uppercase tracking-[0.35em] text-white/75 shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl">
              AI Commerce Automation
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
              Multimodal Product Intelligence
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
              Analyze product images, generate searchable catalog data, and help
              users discover products through text and image search.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => navigate("/signup")}
                className="rounded-2xl border border-white/20 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-[0_25px_80px_rgba(255,255,255,0.25)] transition hover:-translate-y-1 hover:bg-slate-100"
              >
                Create Account
              </button>

              <button
                onClick={() => navigate("/login")}
                className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/15"
              >
                Login
              </button>

              <button
                type="button"
                onClick={handleViewFeatures}
                className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/15"
              >
                View Features
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">01</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">
                  Register
                </p>
              </div>

              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">02</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">
                  Login
                </p>
              </div>

              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">03</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">
                  Dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="relative animate-[popIn_0.9s_ease-out]">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-pink-500/30 via-sky-500/20 to-violet-500/30 blur-2xl" />

            <div className="relative rounded-[3rem] border border-white/20 bg-white/10 p-6 shadow-[0_35px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/20 backdrop-blur-3xl">
              <div className="rounded-[2.5rem] border border-white/15 bg-slate-950/40 p-5 ring-1 ring-white/10">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-300">
                      Live Preview
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      AI Catalog Agent
                    </h2>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/20" />
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-white/45">
                      Product Analysis
                    </p>

                    <p className="mt-2 text-lg font-black">
                      Brown Leather Bag
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/65">
                      Saddle-style handbag with adjustable strap and premium
                      visual features.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                      <p className="text-xs text-white/45">Category</p>
                      <p className="mt-1 font-black">Accessories</p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                      <p className="text-xs text-white/45">Search</p>
                      <p className="mt-1 font-black">Semantic</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">
                    Product ready for intelligent catalog search.
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 -top-4 rounded-3xl border border-white/20 bg-white/15 px-5 py-4 text-sm font-black shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl">
              AI Ready
            </div>
          </div>
        </div>
      </div>

      {showFeatures && (
        <section
          ref={featuresRef}
          className="relative mx-auto mb-12 max-w-7xl animate-[fadeInUp_0.7s_ease-out]"
        >
          <div className="rounded-[3rem] border border-white/20 bg-white/10 p-6 shadow-[0_35px_120px_rgba(0,0,0,0.35)] ring-1 ring-white/20 backdrop-blur-3xl md:p-8">
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-300">
                Platform Features
              </p>

              <h2 className="mt-3 text-4xl font-black">
                What this platform can do
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                The system combines image understanding, semantic search, and
                catalog automation into one e-commerce intelligence workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">Smart Image Analysis</p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Upload a product image and extract product type, category,
                  colors, material guess, style, visible features, and search
                  tags.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">Searchable Catalog</p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Convert image analysis into searchable text and save products
                  into the catalog for future discovery.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">Multimodal Search</p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Search by text or image and retrieve relevant catalog matches
                  using vector similarity.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => navigate("/signup")}
                className="rounded-2xl border border-white/20 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-[0_25px_80px_rgba(255,255,255,0.25)] transition hover:-translate-y-1 hover:bg-slate-100"
              >
                Create Account
              </button>

              <button
                type="button"
                onClick={() => setShowFeatures(false)}
                className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/15"
              >
                Hide Features
              </button>
            </div>
          </div>
        </section>
      )}

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes popIn {
            from {
              opacity: 0;
              transform: scale(0.92) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

export default LandingPage;