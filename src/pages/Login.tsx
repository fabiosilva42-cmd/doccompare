import { useState, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register" | "forgot" | "reset";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("doccompare_token", data.token);
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("doccompare_token", data.token);
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSuccess(t("auth.forgotSuccess"));
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(t("auth.resetSuccess"));
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearMessages();
    setEmailTouched(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (mode === "login") {
      if (!email.trim()) {
        setError(t("auth.emailRequired"));
        return;
      }
      if (!password) {
        setError(t("auth.passwordRequired"));
        return;
      }
      loginMutation.mutate({ email, password });
    } else if (mode === "register") {
      if (!name.trim()) {
        setError(t("auth.nameRequired"));
        return;
      }
      if (!email.trim()) {
        setError(t("auth.emailRequired"));
        return;
      }
      if (!password) {
        setError(t("auth.passwordRequired"));
        return;
      }
      if (password.length < 6) {
        setError(t("auth.passwordMin"));
        return;
      }
      registerMutation.mutate({ name, email, password });
    } else if (mode === "forgot") {
      if (!email.trim()) {
        setError(t("auth.emailRequired"));
        return;
      }
      if (!isValidEmail(email)) {
        setError(t("auth.emailInvalid"));
        return;
      }
      forgotMutation.mutate({ email });
    } else if (mode === "reset") {
      if (!password) {
        setError(t("auth.passwordRequired"));
        return;
      }
      if (password.length < 8) {
        setError(t("auth.resetMinChars"));
        return;
      }
      if (!/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) {
        setError(t("auth.resetRequirements"));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("auth.passwordMismatch"));
        return;
      }
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setError(t("auth.invalidRecoveryToken"));
        return;
      }
      resetMutation.mutate({ token, password });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending || forgotMutation.isPending || resetMutation.isPending;
  const currentYear = new Date().getFullYear();
  const emailInvalid = emailTouched && email.length > 0 && !isValidEmail(email);

  const getTitle = () => {
    switch (mode) {
      case "login": return t("auth.welcomeBack");
      case "register": return t("auth.createAccount");
      case "forgot": return t("auth.forgotTitle");
      case "reset": return t("auth.resetTitle");
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login": return t("auth.signInSubtitle");
      case "register": return t("auth.registerSubtitle");
      case "forgot": return t("auth.forgotSubtitle");
      case "reset": return t("auth.resetSubtitle");
    }
  };

  const getButtonText = () => {
    if (isPending) {
      if (mode === "login") return t("auth.signingIn");
      if (mode === "register") return t("auth.creatingAccount");
      if (mode === "forgot") return t("auth.sending");
      return t("auth.resetting");
    }
    switch (mode) {
      case "login": return t("auth.signIn");
      case "register": return t("auth.createAccount");
      case "forgot": return t("auth.sendRecoveryLink");
      case "reset": return t("auth.resetPassword");
    }
  };

  const features = [
    { icon: Shield, title: t("auth.featurePrompts"), desc: t("auth.featurePromptsDesc") },
    { icon: Zap, title: t("auth.featureSpeed"), desc: t("auth.featureSpeedDesc") },
    { icon: Lock, title: t("auth.featureSecure"), desc: t("auth.featureSecureDesc") },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-[#0F172A] text-white flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #3B82F6 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, #06B6D4 0%, transparent 50%)`,
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">DocCompare</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6 max-w-md">
            {t("auth.heroTitle")}
          </h1>

          <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
            {t("auth.heroSubtitle")}
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-slate-500 text-xs">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher variant="login" />
        </div>
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-900">DocCompare</span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{getTitle()}</h2>
            <p className="text-slate-500 text-sm">{getSubtitle()}</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700">
              <Check className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("auth.name")}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.fullNamePlaceholder")}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("auth.email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder={t("auth.emailPlaceholder")}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      emailInvalid ? "border-red-300 bg-red-50/30" : "border-slate-300"
                    )}
                  />
                </div>
                {emailInvalid && (
                  <p className="mt-1 text-xs text-red-600">{t("auth.emailInvalid")}</p>
                )}
              </div>
            )}

            {(mode === "login" || mode === "register" || mode === "reset") && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {mode === "reset" ? t("auth.newPassword") : t("auth.password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "reset" ? t("auth.resetPasswordPlaceholder") : t("auth.passwordPlaceholder")}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "reset" && password.length > 0 && password.length < 8 && (
                  <p className="mt-1 text-xs text-amber-600">{t("auth.resetMinChars")}</p>
                )}
              </div>
            )}

            {mode === "reset" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("auth.confirmNewPassword")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth.repeatPasswordPlaceholder")}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Esqueci senha + Manter conectado */}
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">{t("auth.rememberMe")}</span>
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {getButtonText()}
                </>
              ) : (
                <>
                  {getButtonText()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Switch mode links */}
          <div className="mt-6 text-center space-y-2">
            {mode === "login" && (
              <p className="text-sm text-slate-500">
                {t("auth.noAccount")}{" "}
                <button onClick={() => switchMode("register")} className="text-blue-600 hover:text-blue-700 font-medium">
                  {t("auth.register")}
                </button>
              </p>
            )}
            {mode === "register" && (
              <p className="text-sm text-slate-500">
                {t("auth.hasAccount")}{" "}
                <button onClick={() => switchMode("login")} className="text-blue-600 hover:text-blue-700 font-medium">
                  {t("auth.signIn")}
                </button>
              </p>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button
                onClick={() => switchMode("login")}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("auth.backToLogin")}
              </button>
            )}
          </div>

          {/* Termos e copyright */}
          {(mode === "login" || mode === "register") && (
            <>
              <p className="mt-4 text-center text-xs text-slate-400">
                {t("auth.termsPrefix")}{" "}
                <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {t("auth.terms")}
                </a>{" "}
                {t("auth.and")}{" "}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {t("auth.privacy")}
                </a>
                .
              </p>
              <p className="mt-4 text-center text-xs text-slate-400">
                {t("auth.copyright", { year: currentYear })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
