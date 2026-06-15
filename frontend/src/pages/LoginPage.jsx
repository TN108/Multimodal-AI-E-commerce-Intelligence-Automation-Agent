import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();

    console.log("Demo login:", {
      email,
      password,
    });

    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 px-4 py-8 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-20 h-[28rem] w-[28rem] animate-pulse rounded-full bg-pink-500/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[32rem] w-[32rem] animate-pulse rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] animate-pulse rounded-full bg-violet-500/30 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="animate-[fadeInUp_0.8s_ease-out]">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mb-6 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/15"
            >
              Back to Home
            </button>

            <p className="text-xs font-black uppercase tracking-[0.35em] text-pink-300">
              Secure Workspace
            </p>

            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
              Login to your AI catalog dashboard
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">
              This is the frontend login UI for now. Real authentication,
              database users, and protected routes will be added after
              PostgreSQL in Week 3.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">01</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">
                  Login
                </p>
              </div>

              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">02</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">
                  Dashboard
                </p>
              </div>

              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">03</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">
                  Catalog
                </p>
              </div>
            </div>
          </div>

          <div className="relative animate-[popIn_0.9s_ease-out]">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-pink-500/30 via-sky-500/20 to-violet-500/30 blur-2xl" />

            <form
              onSubmit={handleLogin}
              className="relative rounded-[3rem] border border-white/20 bg-white/10 p-6 shadow-[0_35px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/20 backdrop-blur-3xl md:p-8"
            >
              <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-300">
                  Welcome Back
                </p>

                <h2 className="mt-3 text-3xl font-black">Sign in</h2>

                <p className="mt-3 text-sm leading-7 text-white/65">
                  Enter any email and password for demo mode.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.25em] text-white/55">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white outline-none ring-1 ring-white/10 backdrop-blur-2xl transition placeholder:text-white/35 focus:border-sky-300/50 focus:ring-4 focus:ring-sky-300/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.25em] text-white/55">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white outline-none ring-1 ring-white/10 backdrop-blur-2xl transition placeholder:text-white/35 focus:border-pink-300/50 focus:ring-4 focus:ring-pink-300/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl border border-white/20 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-[0_25px_80px_rgba(255,255,255,0.25)] transition hover:-translate-y-1 hover:bg-slate-100"
                >
                  Login to Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/15"
                >
                  Continue as Demo User
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                Demo note: this page does not verify credentials yet. Real JWT
                authentication will be connected in Week 3.
              </div>
            </form>
          </div>
        </div>
      </div>

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

export default LoginPage;