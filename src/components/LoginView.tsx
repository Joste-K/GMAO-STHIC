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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f0f0] p-4 font-sans text-slate-800">
      <div className="w-full max-w-[420px] bg-white border border-gray-300 shadow-sm flex flex-col overflow-hidden rounded-xs">
        {/* Banner with high density enterprise branding */}
        <div className="bg-[#111111] border-b border-[#333] p-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-blue-600 rounded-xs flex items-center justify-center text-[10px] font-black">
              ST
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">STHIC GMAO S.A.R.L</h2>
              <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">ENTERPRISE CORE OS</p>
            </div>
          </div>
          <span className="text-[9px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-xs font-mono font-bold uppercase tracking-widest">
            v1.0.0
          </span>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Header section */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                {isSignUp ? "Création de compte" : "Connexion requis"}
              </h3>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                {isSignUp ? "Créer un nouveau profil technique" : "Portail de maintenance & GMAO"}
              </p>
            </div>

            {/* Simulated environment status banner */}
            <div className={`p-3 mb-4 flex flex-col gap-2 text-[11px] leading-relaxed border ${
              isReal 
                ? "bg-green-50 border-green-200 text-green-800" 
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              <div className="flex gap-3">
                <Cpu size={16} className={`shrink-0 ${isReal ? "text-green-600" : "text-amber-600"}`} />
                <div>
                  <span className="font-bold">Statut Firebase : </span>
                  {isReal ? (
                    <span>Connecté en temps réel à l'infrastructure cloud. Authentification active.</span>
                  ) : (
                    <span>
                      {AuthManager.isSandboxForced() 
                        ? "Simulation locale forcée (Sandbox). Authentification locale persistée active."
                        : "Sandbox de démonstration. Authentification locale persistée active (E-mail / Gmail simulé)."
                      }
                    </span>
                  )}
                </div>
              </div>
              {!isReal && AuthManager.isSandboxForced() && (
                <button
                  type="button"
                  onClick={() => AuthManager.setForceSandbox(false)}
                  className="mt-1 text-left text-[10px] text-blue-700 hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer self-start uppercase tracking-wider"
                >
                  🚀 Réactiver la connexion Firebase réelle
                </button>
              )}
            </div>

            {/* Error alerts */}
            {error && error === "[ERR_UNAUTHORIZED_DOMAIN]" ? (
              <div className="p-4 mb-4 bg-amber-50 border border-amber-300 rounded-xs text-slate-800 text-[11px] flex flex-col gap-3">
                <div className="flex gap-2 font-bold text-amber-900 uppercase tracking-wide">
                  <AlertTriangle size={15} className="shrink-0 text-amber-700 mt-0.5" />
                  <span>Domaine non autorisé dans Firebase</span>
                </div>
                <div className="text-slate-700 leading-relaxed font-semibold">
                  Le domaine actuel <code className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-mono select-all font-bold">{window.location.hostname}</code> n'est pas encore configuré dans la liste des domaines autorisés de votre projet Firebase.
                </div>
                <div className="text-[10px] space-y-1.5 bg-white border border-amber-200/60 p-2.5 rounded-xs font-mono text-slate-600">
                  <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">🛠️ Comment corriger :</div>
                  <div>1. Ouvrez la <a href="https://console.firebase.google.com/project/gmao-sthic/authentication/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold hover:text-blue-800">Console Firebase settings</a>.</div>
                  <div>2. Allez dans <span className="font-bold">Authorized Domains</span> (Domaines autorisés).</div>
                  <div>3. Cliquez sur "Ajouter un domaine" et saisissez le domaine actuel :</div>
                  <div className="bg-gray-100 text-gray-800 p-1.5 rounded-xs font-bold border border-gray-200 select-all text-center mt-1 text-[11px] select-all">
                    {window.location.hostname}
                  </div>
                </div>
                <div className="border-t border-amber-200 pt-2 flex flex-col gap-1.5">
                  <div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">OU OPTION DE SECOURS IMMÉDIATE :</div>
                  <button
                    onClick={() => AuthManager.setForceSandbox(true)}
                    type="button"
                    className="w-full h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xs text-[10px] uppercase tracking-wider transition-colors cursor-pointer border-0 shadow-2xs"
                  >
                    Activer la simulation locale (Sandbox)
                  </button>
                </div>
              </div>
            ) : error ? (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-[11px] flex gap-2 font-semibold">
                <AlertTriangle size={14} className="shrink-0 text-red-600 mt-0.5" />
                <div>{error}</div>
              </div>
            ) : null}

            {/* Login / Signup form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Nom Complet & Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1.5 text-gray-400" size={12} />
                    <input
                      type="text"
                      required
                      placeholder="Wilfried Mboungou"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-8 font-semibold text-slate-800 placeholder:text-gray-300"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Identifiant Email (Gmail ou STHIC)
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1.5 text-gray-400" size={12} />
                  <input
                    type="email"
                    required
                    placeholder="technicien@sthic.cg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 font-semibold text-slate-800 placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex justify-between">
                  <span>Mot de passe</span>
                  {!isSignUp && (
                    <span className="text-[9px] text-blue-600 hover:underline cursor-pointer lowercase">
                      ou "password" en simulation
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-1.5 text-gray-400" size={12} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 font-semibold text-slate-800 placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-blue-600 text-white font-bold text-[11px] uppercase tracking-wider hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer border-0 rounded-xs mt-2 shadow-2xs"
              >
                <span>{isSignUp ? "Créer mon compte" : "Se connecter au système"}</span>
                <ArrowRight size={12} />
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-bold">
                <span className="bg-white px-3 text-gray-400">OU AUTHENTIFICATION GOOGLE</span>
              </div>
            </div>

            {/* Google Gmail authentication button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full h-9 bg-white text-gray-700 font-bold text-[11px] uppercase tracking-wider border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all flex items-center justify-center gap-2.5 cursor-pointer rounded-xs"
            >
              {/* Custom flat SVG for google icon matching high density */}
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
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
              <span>Se connecter via Google / Gmail</span>
            </button>
          </div>

          {/* Selector at the bottom */}
          <div className="mt-6 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {isSignUp ? "Vous avez déjà un compte ? " : "Nouveau technicien ? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:underline bg-transparent border-0 p-0 cursor-pointer font-bold inline"
            >
              {isSignUp ? "Connectez-vous" : "Créez votre accès"}
            </button>
          </div>
        </div>

        {/* Console info footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-3.5 text-[9px] text-gray-400 font-mono flex items-center justify-between">
          <span>PORTAL_SECURITY: ENABLED</span>
          <span>SSL_AES_256</span>
        </div>
      </div>
    </div>
  );
}
