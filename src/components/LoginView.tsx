import React, { useState } from "react";
import { AuthManager } from "../utils/firebase";
import { LogIn, Key, Mail, AlertTriangle, User, ArrowRight, Sparkles } from "lucide-react";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 relative overflow-hidden px-4 py-12 font-sans antialiased text-slate-800">
      
      {/* Abstract Elegant Background Grid & Gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden relative z-10 transition-all duration-300 flex flex-col">
        
        {/* Top Header/Branding Banner */}
        <div className="bg-slate-950 p-7 text-white relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />
          
          <div className="flex items-center gap-4">
            {/* Custom high-fidelity polished Logo for GMAO-STHIC Joste */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-blue-500/30 rounded-2xl blur-xs" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl flex items-center justify-center shadow-lg font-black text-sm text-white">
                <span className="text-amber-500 mr-[-1px]">J</span>
                <span className="text-blue-400">S</span>
                <span className="text-[10px] font-bold ml-[1px] text-slate-100">G</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-base font-black tracking-tight uppercase text-white leading-tight">
                GMAO-STHIC Joste
              </h2>
              <p className="text-[10px] text-blue-400 font-mono tracking-wider uppercase font-bold mt-0.5">
                Système d'Interventions Enterprise
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 mb-4">
              <LogIn size={11} />
              {isSignUp ? "Création de compte" : "Authentification GMAO"}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {isSignUp ? "Créer un nouveau profil" : "Accéder au portail"}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              Saisissez vos identifiants autorisés STHIC pour gérer et planifier les interventions en temps réel.
            </p>
          </div>

          {/* Firebase Authorized Domain Warning Alert */}
          {error && error === "[ERR_UNAUTHORIZED_DOMAIN]" ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-slate-800 text-xs flex flex-col gap-3 shadow-sm animate-in fade-in duration-150">
              <div className="flex gap-2 font-extrabold text-amber-950 uppercase tracking-wider text-[11px] items-center">
                <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                <span>Domaine Firebase non autorisé</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                Le domaine actuel <code className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-mono font-bold">{window.location.hostname}</code> n'est pas configuré dans la console Firebase.
              </p>
              <div className="text-[11px] space-y-1.5 bg-white border border-amber-200/80 p-3 rounded-xl font-mono text-slate-600">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider mb-1 text-[10px]">🛠️ Procédure d'autorisation :</div>
                <div>1. Allez sur la console Firebase.</div>
                <div>2. Ajoutez le domaine actuel ci-dessous aux domaines autorisés :</div>
                <div className="bg-slate-50 text-slate-800 p-2 rounded border border-slate-200 font-bold select-all text-center mt-1 text-[12px]">
                  {window.location.hostname}
                </div>
              </div>
              <button
                onClick={() => AuthManager.setForceSandbox(true)}
                type="button"
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Activer la simulation locale (Sandbox)
              </button>
            </div>
          ) : error ? (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-[11px] flex gap-3 font-medium items-start shadow-sm">
                <AlertTriangle size={18} className="shrink-0 text-red-500 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold mb-0.5">Erreur de connexion</p>
                  <p className="opacity-80">Identifiants incorrects ou service indisponible.</p>
                </div>
              </div>
              
              <button
                onClick={() => AuthManager.setForceSandbox(true)}
                type="button"
                className="w-full h-11 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-200"
              >
                <Sparkles size={14} className="text-amber-500" />
                DÉBLOQUER : UTILISER LE MODE DÉMO
              </button>
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block pl-0.5">
                  Nom Complet
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-slate-400" size={14} />
                  <input
                    type="text"
                    required
                    placeholder="Jean-Pierre Koffi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 h-10 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block pl-0.5">
                Adresse Email Professionnelle
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={14} />
                <input
                  type="email"
                  required
                  placeholder="nom@sthic.cg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block flex justify-between items-center pl-0.5">
                <span>Mot de passe</span>
                {!isSignUp && (
                  <span className="text-[9px] text-slate-400 font-medium normal-case italic">
                    ou libre en mode simulation
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
                  className="w-full pl-10 pr-4 h-10 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-800/50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 mt-6 shadow-md hover:shadow-lg active:scale-95"
            >
              <span>{isSignUp ? "Créer mon profil" : "Se connecter"}</span>
              <ArrowRight size={14} className="shrink-0" />
            </button>
          </form>

          {/* Google Sign In Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-150"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-bold">
              <span className="bg-white px-3 text-slate-400 font-extrabold">OU CONTINUER AVEC</span>
            </div>
          </div>

          {/* Google login */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="w-full h-10 bg-white text-slate-700 font-extrabold text-xs uppercase tracking-wider border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-3xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
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

          {/* Toggle Button */}
          <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">
            {isSignUp ? "Déjà un compte ? " : "Nouveau utilisateur ? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-0 p-0 cursor-pointer font-extrabold inline transition-all ml-1"
            >
              {isSignUp ? "Se connecter" : "Créer un accès"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
