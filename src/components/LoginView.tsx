import React, { useState } from "react";
import { AuthManager } from "../utils/firebase";
import { LogIn, Key, Mail, AlertTriangle, Cpu, User, ArrowRight } from "lucide-react";

interface Props {
  onSuccess: () => void;
}

export function LoginView({ onSuccess }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await AuthManager.signUpWithEmail(email, password, fullName);
      } else {
        await AuthManager.signInWithEmail(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await AuthManager.signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Connexion Google annulée.");
    } finally {
      setLoading(false);
    }
  };

  const isReal = AuthManager.isRealFirebase();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0f19] relative overflow-hidden px-4 py-8 font-sans text-slate-800">
      {/* Neo-ambient glowing circles in background */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-blue-600/10 blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-indigo-600/10 blur-[80px] sm:blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl border border-white/20 flex flex-col overflow-hidden relative z-10 transition-all duration-300">
        
        {/* Banner with high density enterprise branding */}
        <div className="bg-[#111625] border-b border-slate-800 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-xs font-black shadow-md shadow-blue-500/20">
              ST
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-100">STHIC SERVICES</h2>
              <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase font-semibold">ENTERPRISE GMAO SYSTEM</p>
            </div>
          </div>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
            v1.0.0
          </span>
        </div>

        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
          <div>
            {/* Header section */}
            <div className="mb-6">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 mb-1.5">
                {isSignUp ? "Création de compte" : "Authentification requise"}
              </h3>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {isSignUp ? "Créer un nouveau profil" : "Accéder au portail GMAO"}
              </p>
            </div>

            {/* Simulated environment status banner */}
            <div className={`p-4 mb-5 rounded-xl border flex flex-col gap-2 text-xs leading-relaxed transition-colors ${
              isReal 
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-800" 
                : "bg-amber-50/90 border-amber-200 text-amber-800"
            }`}>
              <div className="flex gap-3">
                <Cpu size={18} className={`shrink-0 mt-0.5 ${isReal ? "text-emerald-600" : "text-amber-600"}`} />
                <div>
                  <span className="font-bold">Statut Firebase : </span>
                  {isReal ? (
                    <span>Connecté en temps réel à la base de données cloud Firestore.</span>
                  ) : (
                    <span>
                      {AuthManager.isSandboxForced() 
                        ? "Simulation Sandbox locale forcée. Vos modifications sont conservées localement."
                        : "Sandbox de démonstration. Connexion cloud indisponible (simulation locale active)."
                      }
                    </span>
                  )}
                </div>
              </div>
              {!isReal && AuthManager.isSandboxForced() && (
                <button
                  type="button"
                  onClick={() => AuthManager.setForceSandbox(false)}
                  className="mt-1 text-left text-[11px] text-blue-700 hover:text-blue-800 hover:underline font-extrabold bg-transparent border-0 p-0 cursor-pointer self-start uppercase tracking-wider transition-all"
                >
                  🚀 Réactiver la connexion Firebase réelle
                </button>
              )}
            </div>

            {/* Error alerts */}
            {error && error === "[ERR_UNAUTHORIZED_DOMAIN]" ? (
              <div className="p-4 mb-5 bg-amber-50/95 border border-amber-300 rounded-xl text-slate-800 text-xs flex flex-col gap-3.5 shadow-sm">
                <div className="flex gap-2.5 font-extrabold text-amber-950 uppercase tracking-wider text-[11px] items-center">
                  <AlertTriangle size={16} className="shrink-0 text-amber-700" />
                  <span>Domaine non autorisé dans Firebase</span>
                </div>
                <div className="text-slate-700 leading-relaxed font-medium">
                  Le domaine actuel <code className="bg-amber-100/80 text-amber-950 px-1.5 py-0.5 rounded font-mono select-all font-bold">{window.location.hostname}</code> n'est pas configuré dans la console de votre projet Firebase.
                </div>
                <div className="text-[11px] space-y-1.5 bg-white border border-amber-200/80 p-3 rounded-lg font-mono text-slate-600">
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider mb-1 text-[10px]">🛠️ Procédure d'autorisation :</div>
                  <div>1. Ouvrez la <a href="https://console.firebase.google.com/project/gmao-sthic/authentication/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold hover:text-blue-800">Console Firebase</a>.</div>
                  <div>2. Allez dans <span className="font-bold">Authorized Domains</span> (Domaines autorisés).</div>
                  <div>3. Ajoutez ce domaine :</div>
                  <div className="bg-slate-50 text-slate-800 p-2 rounded border border-slate-200 font-bold select-all text-center mt-1 text-[12px]">
                    {window.location.hostname}
                  </div>
                </div>
                <div className="border-t border-amber-200 pt-3 flex flex-col gap-2">
                  <div className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">OU OPTION DE SECOURS IMMÉDIATE :</div>
                  <button
                    onClick={() => AuthManager.setForceSandbox(true)}
                    type="button"
                    className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer border-0 shadow-md shadow-amber-600/10"
                  >
                    Activer la simulation locale (Sandbox)
                  </button>
                </div>
              </div>
            ) : error ? (
              <div className="p-3 mb-5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex gap-2.5 font-semibold items-start">
                <AlertTriangle size={16} className="shrink-0 text-red-600 mt-0.5" />
                <div>{error}</div>
              </div>
            ) : null}

            {/* Login / Signup form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Nom Complet &amp; Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-slate-400" size={14} />
                    <input
                      type="text"
                      required
                      placeholder="Wilfried Mboungou"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 h-10 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Identifiant Email (Gmail ou STHIC)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={14} />
                  <input
                    type="email"
                    required
                    placeholder="technicien@sthic.cg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 h-10 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex justify-between items-center">
                  <span>Mot de passe</span>
                  {!isSignUp && (
                    <span className="text-[10px] text-slate-400 lowercase italic font-normal">
                      ou "password" en simulation
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 text-slate-400" size={14} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 h-10 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 mt-3 shadow-lg shadow-blue-600/15 hover:shadow-blue-600/25 active:scale-[0.98]"
              >
                <span>{isSignUp ? "Créer mon compte" : "Se connecter au système"}</span>
                <ArrowRight size={14} className="shrink-0" />
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-extrabold">
                <span className="bg-white px-4 text-slate-400">OU GOOGLE SIGN-IN</span>
              </div>
            </div>

            {/* Google Gmail authentication button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full h-11 bg-white text-slate-700 font-extrabold text-xs uppercase tracking-wider border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
            >
              {/* Custom flat SVG for google icon matching high density */}
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.84-4.53z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Se connecter via Gmail</span>
            </button>
          </div>

          {/* Selector at the bottom */}
          <div className="text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pt-2">
            {isSignUp ? "Vous avez déjà un compte ? " : "Nouveau technicien ? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 hover:underline bg-transparent border-0 p-0 cursor-pointer font-extrabold inline transition-all ml-1"
            >
              {isSignUp ? "Connectez-vous" : "Créez votre accès"}
            </button>
          </div>
        </div>

        {/* Console info footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>SECURE_SHELL: ONLINE</span>
          <span>SSL_AES_256</span>
        </div>
      </div>
    </div>
  );
}
