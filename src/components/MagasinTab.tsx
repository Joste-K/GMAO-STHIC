import React, { useState } from "react";
import { AppDatabase, ArticleMagasin, CartItem } from "../types";
import { todayYMD, pd } from "../utils/calculations";

interface Props {
  db: AppDatabase;
  onAddArticle: () => void;
  onUpdateArticle: (idx: number, updated: Partial<ArticleMagasin>) => void;
  onDeleteArticle: (idx: number) => void;
  onCheckoutCart: (cart: CartItem[], client: string, ge: string, workRef: string) => void;
}

export const MagasinTab: React.FC<Props> = ({
  db,
  onAddArticle,
  onUpdateArticle,
  onDeleteArticle,
  onCheckoutCart
}) => {
  const [search, setSearch] = useState("");
  const [filtLowStock, setFiltLowStock] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartClient, setCartClient] = useState("");
  const [cartGe, setCartGe] = useState("");
  const [cartWorkRef, setCartWorkRef] = useState("Dépannage standard");

  // Filter list
  const filtered = db.magasin
    .map((art, idx) => ({ art, idx }))
    .filter(({ art }) => {
      const q = art.stockInit + (art.entrees || 0) - (art.sorties || 0);
      if (filtLowStock && q > (art.seuil || 5)) return false;

      const hay = `${art.ref || ""} ${art.design || ""} ${art.note || ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });

  // KPI computations
  let nTotal = db.magasin.length;
  let valAchat = 0;
  let valVente = 0;
  let lowStockCount = 0;

  db.magasin.forEach(art => {
    const q = art.stockInit + (art.entrees || 0) - (art.sorties || 0);
    valAchat += q * (art.prixAchat || 0);
    valVente += q * (art.prixVente || 0);
    if (q <= (art.seuil || 5)) lowStockCount++;
  });

  const handleAddToCart = (art: ArticleMagasin) => {
    const q = art.stockInit + (art.entrees || 0) - (art.sorties || 0);
    const existing = cart.find(c => c.ref === art.ref);
    if (existing) {
      if (existing.qteSelected >= q) {
        alert("Stock insuffisant pour augmenter la quantité.");
        return;
      }
      setCart(cart.map(c => c.ref === art.ref ? { ...c, qteSelected: c.qteSelected + 1 } : c));
    } else {
      if (q <= 0) {
        alert("Cet article est en rupture de stock.");
        return;
      }
      setCart([...cart, { ref: art.ref, des: art.design, qteSelected: 1, pu_vente: art.prixVente || 0, maxStock: q }]);
    }
  };

  const handleUpdateCartQte = (ref: string, qte: number) => {
    const item = cart.find(c => c.ref === ref);
    if (!item) return;
    if (qte <= 0) {
      setCart(cart.filter(c => c.ref !== ref));
    } else {
      const targetQte = Math.min(qte, item.maxStock);
      setCart(cart.map(c => c.ref === ref ? { ...c, qteSelected: targetQte } : c));
    }
  };

  const handleRemoveFromCart = (ref: string) => {
    setCart(cart.filter(c => c.ref !== ref));
  };

  const handleValidateCheckout = () => {
    if (!cart.length) {
      alert("Votre panier est vide.");
      return;
    }
    if (!cartClient) {
      alert("Veuillez sélectionner ou saisir le client destinataire.");
      return;
    }

    onCheckoutCart(cart, cartClient, cartGe, cartWorkRef);
    setCart([]);
    setCartClient("");
    setCartGe("");
    alert("Prélèvement validé avec succès ! Le stock a été mis à jour et l'intervention a été loggée.");
  };

  const handleGEFill = (geId: string) => {
    setCartGe(geId);
    const g = db.parc.find(x => x.id === geId);
    if (g) {
      setCartClient(g.client || "");
    }
  };

  return (
    <div id="magasin" className="space-y-6">
      <h2 className="text-xl font-extrabold text-blue-900 border-b pb-2">
        🧰 Magasin de pièces détachées &amp; Consommables
      </h2>

      {/* Magasin KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-slate-700">
          <div className="text-2xl font-extrabold text-slate-800">{nTotal}</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Références catalogue</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-red-600">
          <div className="text-2xl font-extrabold text-red-600">{lowStockCount}</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Seuils d'alertes atteints</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-blue-600">
          <div className="text-xl font-extrabold text-blue-950">{valAchat.toLocaleString("fr-FR")}</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Valeur Stock Achat (FCFA)</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border-l-5 border-l-green-600">
          <div className="text-xl font-extrabold text-green-950">{valVente.toLocaleString("fr-FR")}</div>
          <div className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Valeur Vente Estimée (FCFA)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main inventory table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="🔎 Rechercher un article (ref, désignation, emplacement)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
            />
            <button
              onClick={() => setFiltLowStock(!filtLowStock)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                filtLowStock ? "bg-red-50 text-red-700 border-red-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              ⚠️ Alertes stock ({lowStockCount})
            </button>
            <button
              onClick={onAddArticle}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              ➕ Ajouter article
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-100">
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700 text-white font-semibold">
                    <th className="px-3 py-2">Référence</th>
                    <th className="px-3 py-2">Désignation</th>
                    <th className="px-3 py-2">Catégorie</th>
                    <th className="px-3 py-2 text-center">Quantité</th>
                    <th className="px-3 py-2 text-right">Achat (FCFA)</th>
                    <th className="px-3 py-2 text-right">Vente (FCFA)</th>
                    <th className="px-3 py-2 text-center">Seuil</th>
                    <th className="px-3 py-2">Observation</th>
                    <th className="px-3 py-2 text-center">Prélever</th>
                    <th className="px-3 py-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.length > 0 ? (
                    filtered.map(({ art, idx }) => {
                      const q = art.stockInit + (art.entrees || 0) - (art.sorties || 0);
                      const isLow = q <= (art.seuil || 5);

                      const updateField = (field: keyof ArticleMagasin, val: any) => {
                        onUpdateArticle(idx, { [field]: val });
                      };

                      return (
                        <tr key={idx} className={`hover:bg-slate-50/50 ${isLow ? "bg-red-50/20" : ""}`}>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={art.ref}
                              onChange={(e) => updateField("ref", e.target.value)}
                              className="w-16 px-1 border rounded text-xs bg-white text-center font-bold"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={art.design || ""}
                              onChange={(e) => updateField("design", e.target.value)}
                              className="w-32 px-1 border rounded text-xs bg-white"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={art.cat || ""}
                              onChange={(e) => updateField("cat", e.target.value)}
                              className="w-20 px-1 border rounded text-xs bg-white"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <input
                              type="number"
                              value={art.stockInit || 0}
                              onChange={(e) => updateField("stockInit", parseInt(e.target.value) || 0)}
                              className="w-12 text-center border rounded"
                            />
                            {isLow && (
                              <span className="block text-[8px] text-red-600 font-extrabold">
                                🚨 ALERTE
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              value={art.prixAchat || 0}
                              onChange={(e) => updateField("prixAchat", parseFloat(e.target.value) || 0)}
                              className="w-18 text-right px-1 border rounded"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              value={art.prixVente || 0}
                              onChange={(e) => updateField("prixVente", parseFloat(e.target.value) || 0)}
                              className="w-18 text-right px-1 border rounded"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <input
                              type="number"
                              value={art.seuil || 5}
                              onChange={(e) => updateField("seuil", parseInt(e.target.value) || 5)}
                              className="w-10 text-center border rounded"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={art.note || ""}
                              onChange={(e) => updateField("note", e.target.value)}
                              className="w-24 px-1 border rounded"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => handleAddToCart(art)}
                              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              title="Ajouter au panier de prélèvement"
                            >
                              🛒 +
                            </button>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => onDeleteArticle(idx)}
                              className="text-red-500 hover:text-red-700 font-bold text-sm cursor-pointer"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-slate-400 font-medium">
                        Aucun article ne correspond aux filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Checkout Cart Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="text-sm font-extrabold text-blue-900 flex justify-between items-center border-b pb-2">
            <span>🛒 Panier de prélèvement ({cart.length})</span>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-600 font-bold hover:underline"
              >
                Vider
              </button>
            )}
          </h3>

          {cart.length > 0 ? (
            <div className="space-y-4">
              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto bg-white border rounded-xl p-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-xs">
                    <div className="font-semibold text-slate-700">
                      <div>{item.des}</div>
                      <div className="text-[10px] text-slate-400">Ref: {item.ref}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={item.maxStock}
                        value={item.qteSelected}
                        onChange={(e) => handleUpdateCartQte(item.ref, parseInt(e.target.value) || 1)}
                        className="w-10 text-center border rounded-md text-xs py-0.5 bg-slate-50"
                      />
                      <button
                        onClick={() => handleRemoveFromCart(item.ref)}
                        className="text-red-500 font-bold hover:text-red-700 text-sm"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <div className="space-y-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Groupe concerné</label>
                  <select
                    value={cartGe}
                    onChange={(e) => handleGEFill(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                  >
                    <option value="">— Aucun GE précis —</option>
                    {db.parc.map(g => (
                      <option key={g.id} value={g.id}>{g.id} — {g.client} / {g.site}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Client bénéficiaire *</label>
                  <input
                    type="text"
                    value={cartClient}
                    onChange={(e) => setCartClient(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                    placeholder="Saisir le nom du client…"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Motif / Travaux d'allocation</label>
                  <input
                    type="text"
                    value={cartWorkRef}
                    onChange={(e) => setCartWorkRef(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                    placeholder="Ex: Remplacement filtre ou vidange…"
                  />
                </div>

                <button
                  onClick={handleValidateCheckout}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  ⚡ Valider le prélèvement
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">
              Votre panier est vide. Cliquez sur <b>🛒 +</b> à gauche pour ajouter des articles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
