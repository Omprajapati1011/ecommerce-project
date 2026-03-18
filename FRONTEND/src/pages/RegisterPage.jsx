import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import api from "../../api/api";
import SmartImage from "../components/common/SmartImage";

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");

  const requestOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/users/register/request-otp", {
        name,
        email,
        password,
      });

      setOtpToken(data?.data?.otpToken || "");
      setStep("otp");
      setSuccess("OTP sent to your email.");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      await api.post("/users/register/verify-otp", {
        otp,
        otpToken,
      });

      setSuccess("Account created successfully.");
      navigate("/login");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-slate-950 md:p-8">
      <div className="mx-auto grid min-h-[88vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <div className="relative hidden md:block">
          <SmartImage
            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80"
            alt="Minimal scenic background"
            wrapperClassName="h-full w-full"
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/65 via-transparent to-amber-600/25" />
          <div className="absolute bottom-10 left-10 max-w-sm text-white">
            <h1 className="font-serif text-4xl leading-tight">
              &ldquo;Start simple. Shop smarter.&rdquo;
            </h1>
            <p className="mt-4 text-sm text-slate-100">
              Create your account and begin your journey.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-base font-semibold text-slate-900 shadow-2xl shadow-slate-950/30 transition hover:-translate-y-0.5 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Explore Shop
            </Link>
            <p className="mt-3 text-sm font-medium text-white/90">
              Browse products first. Create an account only when you&apos;re
              ready.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 md:p-12">
          <form
            onSubmit={step === "details" ? requestOtp : verifyOtp}
            className="w-full max-w-md p-fluid"
          >
            <h2 className="font-serif text-4xl font-semibold text-gray-900 dark:text-slate-100">
              Register
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {step === "details"
                ? "Step 1: Enter details to receive OTP."
                : "Step 2: Enter OTP sent to your email."}
            </p>

            <div className="mt-8 space-y-4">
              {step === "details" ? (
                <>
                  <InputText
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-none outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                    placeholder="Enter Your Name"
                    required
                  />
                  <InputText
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-none outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                    placeholder="Email"
                    required
                  />
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
                  <Password
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    feedback={false}
                    toggleMask
                    className="w-full"
                    inputClassName="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-none outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                    placeholder="Confirm Password"
                    required
                  />
                </>
              ) : (
                <InputText
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/[^\d]/g, "").slice(0, 6))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-gray-900 shadow-none outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                  placeholder="Enter 6-digit OTP"
                  required
                />
              )}

              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {success}
                </p>
              )}

              <Button
                type="submit"
                label={
                  loading
                    ? "Please wait..."
                    : step === "details"
                      ? "Send OTP"
                      : "Verify OTP & Create Account"
                }
                disabled={loading}
                className="w-full !rounded-lg !bg-amber-600 !px-6 !py-3 !font-medium !text-white !shadow-lg !shadow-amber-600/20 transition-all hover:!bg-amber-700"
              />

              {step === "otp" && (
                <Button
                  type="button"
                  label="Resend OTP"
                  disabled={loading}
                  onClick={requestOtp}
                  className="w-full !rounded-lg !border !border-amber-600 !bg-transparent !px-6 !py-3 !font-medium !text-amber-700 hover:!bg-amber-50 dark:!text-amber-300 dark:hover:!bg-slate-800"
                />
              )}
            </div>

            <p className="mt-6 text-sm text-gray-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
