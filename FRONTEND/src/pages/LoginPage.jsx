import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";
import SmartImage from "../components/common/SmartImage";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const resultAction = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(resultAction)) {
      const role = resultAction.payload?.role;
      navigate(role === "admin" ? "/admin/dashboard" : "/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-slate-950 md:p-8">
      <div className="mx-auto grid min-h-[88vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <div className="relative hidden md:block">
          <SmartImage
            src="https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1600&q=80"
            alt="Minimal landscape background"
            wrapperClassName="h-full w-full"
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/65 via-transparent to-amber-600/25" />
          <div className="absolute bottom-10 left-10 max-w-sm text-white">
            <h1 className="font-serif text-4xl leading-tight">
              &ldquo;Small choices build a beautiful life.&rdquo;
            </h1>
            <p className="mt-4 text-sm text-slate-100">
              Sign in and continue where you left off.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-base font-semibold text-slate-900 shadow-2xl shadow-slate-950/30 transition hover:-translate-y-0.5 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Explore Shop
            </Link>
            <p className="mt-3 text-sm font-medium text-white/90">
              Browse products first. Login only when you&apos;re ready to order.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 md:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-md p-fluid">
            <h2 className="font-serif text-4xl font-semibold text-gray-900 dark:text-slate-100">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Sign in to continue your shopping journey.
            </p>

            <div className="mt-8 space-y-4">
              <InputText
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-none outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                placeholder="Email"
                required
              />

              <div className="w-full">
                <Password
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  feedback={false}
                  toggleMask
                  className="w-full"
                  inputClassName="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-none outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                  placeholder="Password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                label={loading ? "Signing In..." : "Sign In"}
                disabled={loading}
                className="w-full !rounded-lg !bg-amber-600 !px-6 !py-3 !font-medium !text-white !shadow-lg !shadow-amber-600/20 transition-all hover:!bg-amber-700"
              />
            </div>

            <p className="mt-6 text-sm text-gray-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Register
              </Link>
            </p>

            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              Forgot password?{" "}
              <Link
                to="/forgot-password"
                className="font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Reset here
              </Link>
            </p>

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs text-gray-500 dark:bg-slate-800 dark:text-slate-400">
              New here? Create an account to get started.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
