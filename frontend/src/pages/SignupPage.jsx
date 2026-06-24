import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SignupPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidPassword = (passwordValue) => {
    const hasMinimumLength = passwordValue.length >= 8;
    const hasCapitalLetter = /[A-Z]/.test(passwordValue);
    const hasSmallLetter = /[a-z]/.test(passwordValue);
    const hasNumber = /[0-9]/.test(passwordValue);
    const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]`~;]/.test(
      passwordValue
    );

    return (
      hasMinimumLength &&
      hasCapitalLetter &&
      hasSmallLetter &&
      hasNumber &&
      hasSpecialCharacter
    );
  };

  const getErrorMessage = (errorData) => {
    if (!errorData) {
      return "Signup failed. Please try again.";
    }

    if (typeof errorData.detail === "string") {
      return errorData.detail;
    }

    if (Array.isArray(errorData.detail)) {
      return errorData.detail
        .map((item) => item.msg || "Invalid input.")
        .join(" ");
    }

    return "Signup failed. Please check your information.";
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!fullName.trim()) {
      setFormError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setFormError("Please enter your password.");
      return;
    }

    if (!isValidPassword(password)) {
      setFormError(
        "Password must be at least 8 characters and include one capital letter, one small letter, one number, and one special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Password and confirm password do not match.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFormError(getErrorMessage(data));
        return;
      }

      localStorage.removeItem("demo_user_logged_in");
      localStorage.removeItem("demo_user_name");
      localStorage.removeItem("demo_user_email");

      navigate("/login");
    } catch (error) {
      setFormError(
        "Cannot connect to backend. Make sure FastAPI is running on http://127.0.0.1:8000."
      );
    } finally {
      setIsLoading(false);
    }
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
              Create Workspace
            </p>

            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
              Create your AI catalog account
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">
              Register your workspace before entering the dashboard. Your
              account is now stored in PostgreSQL with backend validation and
              password hashing.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">01</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">
                  Register
                </p>
              </div>

              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
                <p className="text-2xl font-black">02</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/55">
                  Secure
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

            <form
              onSubmit={handleSignup}
              className="relative rounded-[3rem] border border-white/20 bg-white/10 p-6 shadow-[0_35px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/20 backdrop-blur-3xl md:p-8"
            >
              <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-300">
                  New Account
                </p>

                <h2 className="mt-3 text-3xl font-black">Sign up</h2>

                <p className="mt-3 text-sm leading-7 text-white/65">
                  Create an account to access the product intelligence
                  dashboard.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.25em] text-white/55">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Talha Nasir"
                    className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white outline-none ring-1 ring-white/10 backdrop-blur-2xl transition placeholder:text-white/35 focus:border-sky-300/50 focus:ring-4 focus:ring-sky-300/20"
                  />
                </div>

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
                    placeholder="Example: Admin123@"
                    className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white outline-none ring-1 ring-white/10 backdrop-blur-2xl transition placeholder:text-white/35 focus:border-pink-300/50 focus:ring-4 focus:ring-pink-300/20"
                  />

                  <p className="mt-2 text-xs leading-5 text-white/45">
                    Password must be at least 8 characters and include one
                    capital letter, one small letter, one number, and one
                    special character.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.25em] text-white/55">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm password"
                    className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white outline-none ring-1 ring-white/10 backdrop-blur-2xl transition placeholder:text-white/35 focus:border-violet-300/50 focus:ring-4 focus:ring-violet-300/20"
                  />
                </div>

                {formError && (
                  <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-white/20 bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-[0_25px_80px_rgba(255,255,255,0.25)] transition hover:-translate-y-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/15"
                >
                  Already have an account? Login
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
                Signup is now connected to the real FastAPI backend. After
                account creation, continue to login.
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

export default SignupPage;