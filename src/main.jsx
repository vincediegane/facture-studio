import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CreditCard,
  Crown,
  Download,
  FileDown,
  FileSpreadsheet,
  History,
  LayoutTemplate,
  Lock,
  Mail,
  Palette,
  Package,
  Plus,
  Printer,
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Send,
  Settings,
  Trash2,
  Wand2,
} from "lucide-react";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import "./styles.css";

const FREE_LIMIT = 5;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080";

const templates = [
  { id: "minimal", name: "Minimal Pro", tier: "free", color: "#0f8b8d", accent: "#d9f0ee", style: "minimal", description: "Sobre, précis, idéal pour les services professionnels." },
  { id: "executive", name: "Executive Slate", tier: "free", color: "#22324a", accent: "#e6edf4", style: "bold", description: "Contraste fort pour cabinet, conseil et B2B." },
  { id: "commerce", name: "Commerce Pop", tier: "free", color: "#db6b57", accent: "#fdebe6", style: "commerce", description: "Clair et vivant pour vente, stock et distribution." },
  { id: "atelier", name: "Atelier Gold", tier: "free", color: "#c9962f", accent: "#fbf2de", style: "editorial", description: "Élégant pour créatifs, indépendants et studios." },
  { id: "signature", name: "Signature Luxe", tier: "premium", color: "#111827", accent: "#f2dca2", style: "signature", description: "Finition premium avec hiérarchie très haut de gamme." },
  { id: "aurora", name: "Aurora Clean", tier: "premium", color: "#197278", accent: "#e1f5f2", style: "aurora", description: "Moderne, lumineux, parfait pour SaaS et tech." },
  { id: "terracotta", name: "Terracotta Studio", tier: "premium", color: "#b85c38", accent: "#fde8dd", style: "terracotta", description: "Chaleureux, distinctif, pour marques lifestyle." },
  { id: "mono", name: "Mono Ledger", tier: "premium", color: "#2f3a33", accent: "#e7ece8", style: "ledger", description: "Inspiré finance, très lisible pour grands comptes." },
  { id: "ocean", name: "Ocean Blue", tier: "premium", color: "#096b8f", accent: "#e2f4fb", style: "ocean", description: "Net et rassurant pour activités internationales." },
  { id: "rose", name: "Rose Maison", tier: "premium", color: "#a64764", accent: "#fae6ed", style: "rose", description: "Raffiné pour événementiel, beauté et design." },
  { id: "graphite", name: "Graphite Board", tier: "premium", color: "#343434", accent: "#ededed", style: "graphite", description: "Dense, sérieux, pensé pour usage administratif." },
  { id: "verde", name: "Verde Finance", tier: "premium", color: "#237052", accent: "#e2f2e8", style: "verde", description: "Très propre pour comptabilité et gestion." },
];

const initialInvoice = {
  companyName: "Sunu Digital Services",
  companyEmail: "contact@sunu-digital.sn",
  companyPhone: "+221 77 123 45 67",
  companyTaxId: "NINEA 009876543",
  companyAddress: "Plateau, Dakar\nSénégal",
  clientName: "Baobab Group",
  clientEmail: "finance@baobab-group.sn",
  clientAddress: "Almadies, Dakar\nSénégal",
  invoiceNumber: "FAC-2026-001",
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  currency: "FCFA",
  taxRate: 18,
  discount: 0,
  notes: "Merci pour votre confiance.",
  paymentTerms: "Paiement par virement bancaire sous 15 jours.",
};

const initialLines = [
  { description: "Conception du modèle de facture", quantity: 1, price: 150000 },
  { description: "Développement du builder personnalisé", quantity: 1, price: 280000 },
  { description: "Configuration export Excel", quantity: 1, price: 90000 },
];

const defaultClients = [
  { id: "client-baobab", name: "Baobab Group", email: "finance@baobab-group.sn", address: "Almadies, Dakar\nSénégal" },
  { id: "client-kay", name: "Kay Services", email: "admin@kay-services.sn", address: "Mermoz, Dakar\nSénégal" },
];

const defaultCatalog = [
  { id: "service-design", name: "Design facture premium", price: 120000, description: "Création d'un modèle de facture personnalisé" },
  { id: "service-dev", name: "Développement builder", price: 280000, description: "Intégration du formulaire et de l'aperçu dynamique" },
  { id: "service-export", name: "Export Excel", price: 90000, description: "Configuration export XLSX avec mise en forme" },
];

const defaultBranding = {
  logoText: "FS",
  primaryColor: "#0f8b8d",
  accentColor: "#d9f0ee",
  footerSignature: "Facture générée avec Facture Studio",
};

function loadStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function apiRequest(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || `Erreur API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function normalizeCustomer(customer) {
  return { id: String(customer.id), name: customer.name, email: customer.email || "", address: customer.address || "" };
}

function normalizeCatalogItem(item) {
  return { id: String(item.id), name: item.name, description: item.description || "", price: Number(item.price) || 0 };
}

function normalizeInvoice(item) {
  return {
    id: String(item.id),
    number: item.number,
    clientName: item.clientName,
    amount: Number(item.total) || 0,
    currency: item.currency || "FCFA",
    templateName: item.templateName || "Modèle",
    channel: "Serveur",
    status: item.status === "OVERDUE" ? "À relancer" : item.status === "PAID" ? "Payée" : "Envoyée",
    createdAt: item.createdAt || new Date().toISOString(),
    dueDate: item.dueDate,
  };
}

function loadUsage() {
  const usage = Number(localStorage.getItem("facture-studio-usage") || "0");
  const premium = localStorage.getItem("facture-studio-plan") === "premium";
  return { usage, premium };
}

function App() {
  const [view, setView] = useState("landing");
  const [invoice, setInvoice] = useState(initialInvoice);
  const [lines, setLines] = useState(initialLines);
  const [activeTemplateId, setActiveTemplateId] = useState("minimal");
  const [usage, setUsage] = useState(loadUsage().usage);
  const [premium, setPremium] = useState(loadUsage().premium);
  const [status, setStatus] = useState("Prêt à générer votre facture.");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState("premium-template");
  const [clients, setClients] = useState(() => loadStored("facture-studio-clients", defaultClients));
  const [catalog, setCatalog] = useState(() => loadStored("facture-studio-catalog", defaultCatalog));
  const [history, setHistory] = useState(() => loadStored("facture-studio-history", []));
  const [branding, setBranding] = useState(() => loadStored("facture-studio-branding", defaultBranding));
  const [token, setToken] = useState(() => localStorage.getItem("facture-studio-token") || "");
  const [user, setUser] = useState(() => loadStored("facture-studio-user", null));
  const [authMode, setAuthMode] = useState("login");
  const [apiStatus, setApiStatus] = useState("");

  const activeTemplate = templates.find((template) => template.id === activeTemplateId) || templates[0];
  const totals = useMemo(() => calculateTotals(invoice, lines), [invoice, lines]);
  const remaining = premium ? Infinity : Math.max((user?.freeExportLimit || FREE_LIMIT) - (user?.monthlyExportCount ?? usage), 0);

  useEffect(() => {
    if (!token) return;
    refreshWorkspace(token);
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setStatus("Paiement confirmé. Synchronisation de votre abonnement...");
      if (token) refreshWorkspace(token);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("checkout") === "cancel") {
      setStatus("Paiement annulé. Votre forfait gratuit reste actif.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [token]);

  async function refreshWorkspace(activeToken = token) {
    try {
      setApiStatus("Synchronisation de vos données...");
      const [profile, customers, catalogItems, invoices] = await Promise.all([
        apiRequest("/api/auth/me", { token: activeToken }),
        apiRequest("/api/customers", { token: activeToken }),
        apiRequest("/api/catalog", { token: activeToken }),
        apiRequest("/api/invoices", { token: activeToken }),
      ]);
      setUser(profile);
      setPremium(profile.plan === "PREMIUM");
      setUsage(profile.monthlyExportCount || 0);
      setClients(customers.map(normalizeCustomer));
      setCatalog(catalogItems.map(normalizeCatalogItem));
      setHistory(invoices.map(normalizeInvoice));
      saveStored("facture-studio-user", profile);
      setApiStatus("Données synchronisées.");
    } catch (error) {
      setApiStatus("Service indisponible ou session expirée.");
      if (error.status === 401 || error.status === 403) {
        logout();
      }
    }
  }

  async function authenticate(payload, mode = authMode) {
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const response = await apiRequest(endpoint, { method: "POST", body: payload });
      localStorage.setItem("facture-studio-token", response.token);
      saveStored("facture-studio-user", response);
      setToken(response.token);
      setUser(response);
      setPremium(response.plan === "PREMIUM");
      setUsage(response.monthlyExportCount || 0);
      setView("dashboard");
      setStatus("Connecté à votre espace.");
    } catch (error) {
      setApiStatus("Connexion impossible. Vérifiez que le service est démarré.");
    }
  }

  function logout() {
    localStorage.removeItem("facture-studio-token");
    localStorage.removeItem("facture-studio-user");
    setToken("");
    setUser(null);
    setView("landing");
  }

  function updateInvoice(field, value) {
    setInvoice((current) => ({ ...current, [field]: value }));
    setStatus("Modifications appliquées à l'aperçu.");
  }

  function selectTemplate(template) {
    if (template.tier === "premium" && !premium) {
      openPaywall("premium-template");
      setStatus("Ce modèle est réservé au forfait Premium.");
      return;
    }
    setActiveTemplateId(template.id);
    setStatus(`Modèle "${template.name}" sélectionné.`);
  }

  async function activatePremium(plan = "premium", paymentMethod = "card") {
    if (!token) {
      setAuthMode("register");
      setView("auth");
      return;
    }
    if (plan === "enterprise") {
      setStatus("Demande entreprise enregistrée. Un devis pourra être préparé depuis l'admin.");
      setPaywallOpen(false);
      return;
    }
    try {
      const response = await apiRequest("/api/billing/checkout-session", {
        token,
        method: "POST",
        body: { plan, paymentMethod },
      });
      window.location.href = response.checkoutUrl;
    } catch (error) {
      setStatus(error.status === 503 ? "Stripe n'est pas encore configuré côté serveur." : "Impossible de créer le paiement Stripe.");
    }
  }

  function openPaywall(reason = "premium-template") {
    setPaywallReason(reason);
    setPaywallOpen(true);
  }

  function consumeAttempt() {
    if (premium) return true;
    if (usage >= FREE_LIMIT) {
      openPaywall("quota");
      setStatus("Limite gratuite atteinte. Passez Premium pour continuer.");
      return false;
    }
    const nextUsage = usage + 1;
    localStorage.setItem("facture-studio-usage", String(nextUsage));
    setUsage(nextUsage);
    return true;
  }

  async function downloadExcel() {
    if (!(await recordInvoice("Excel"))) return;
    await buildWorkbook({ invoice, lines, template: activeTemplate, totals });
    setStatus("Facture Excel générée.");
  }

  async function recordInvoice(channel) {
    if (!token) {
      setAuthMode("login");
      setView("auth");
      return false;
    }
    try {
      const response = await apiRequest("/api/invoices/exports", {
        token,
        method: "POST",
        body: {
          number: invoice.invoiceNumber || "FAC-0000",
          clientName: invoice.clientName || "Client",
          clientEmail: invoice.clientEmail || "",
          total: totals.total,
          currency: invoice.currency,
          templateName: activeTemplate.name,
          dueDate: invoice.dueDate || null,
        },
      });
      setHistory((current) => [normalizeInvoice({ ...response, channel }), ...current.filter((item) => item.id !== String(response.id))]);
      await refreshWorkspace(token);
      return true;
    } catch (error) {
      if (error.status === 402) {
        openPaywall("quota");
        setStatus("Quota gratuit atteint côté serveur. Passez Premium pour continuer.");
      } else {
        setStatus("Impossible d'enregistrer l'export.");
      }
      return false;
    }
  }

  function recordInvoiceLocal(channel) {
    const item = {
      id: crypto.randomUUID(),
      number: invoice.invoiceNumber || "FAC-0000",
      clientName: invoice.clientName || "Client",
      amount: totals.total,
      currency: invoice.currency,
      templateName: activeTemplate.name,
      channel,
      status: invoice.dueDate && new Date(invoice.dueDate) < new Date() ? "À relancer" : "Envoyée",
      createdAt: new Date().toISOString(),
      dueDate: invoice.dueDate,
    };
    setHistory((current) => {
      const next = [item, ...current].slice(0, 60);
      saveStored("facture-studio-history", next);
      return next;
    });
  }

  async function downloadPdf() {
    if (!(await recordInvoice("PDF"))) return;
    buildPdf({ invoice, lines, template: activeTemplate, totals, branding });
    setStatus("Facture PDF générée.");
  }

  async function sendEmail() {
    await recordInvoice("Email");
    const subject = encodeURIComponent(`Facture ${invoice.invoiceNumber}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint la facture ${invoice.invoiceNumber} d'un montant de ${formatMoney(totals.total, invoice.currency)}.\n\n${invoice.paymentTerms}\n\nCordialement,\n${invoice.companyName}`);
    window.location.href = `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`;
    setStatus("Email de facture préparé.");
  }

  async function saveClient(client) {
    if (!token) return;
    const saved = await apiRequest("/api/customers", {
      token,
      method: "POST",
      body: { name: client.name, email: client.email, address: client.address },
    });
    setClients((current) => [normalizeCustomer(saved), ...current]);
  }

  async function saveCatalogItem(item) {
    if (!token) return;
    const saved = await apiRequest("/api/catalog", {
      token,
      method: "POST",
      body: { name: item.name, description: item.description, price: Number(item.price) || 0 },
    });
    setCatalog((current) => [normalizeCatalogItem(saved), ...current]);
  }

  async function deleteClient(id) {
    await apiRequest(`/api/customers/${id}`, { token, method: "DELETE" });
    setClients((current) => current.filter((client) => client.id !== id));
  }

  async function deleteCatalogItem(id) {
    await apiRequest(`/api/catalog/${id}`, { token, method: "DELETE" });
    setCatalog((current) => current.filter((item) => item.id !== id));
  }

  function updateBranding(nextBranding) {
    setBranding(nextBranding);
    saveStored("facture-studio-branding", nextBranding);
    setStatus("Branding sauvegardé.");
  }

  function resetBuilder() {
    setInvoice({ ...initialInvoice, invoiceDate: new Date().toISOString().slice(0, 10) });
    setLines(initialLines.map((line) => ({ ...line })));
    setStatus("Formulaire réinitialisé avec un exemple complet.");
  }

  if (view === "landing") {
    return (
      <>
        <Landing setView={setView} openPaywall={openPaywall} />
        {paywallOpen && <Paywall reason={paywallReason} onClose={() => setPaywallOpen(false)} activatePremium={activatePremium} />}
      </>
    );
  }

  if (!token || view === "auth") {
    return (
      <>
        <AuthPage mode={authMode} setMode={setAuthMode} onSubmit={authenticate} apiStatus={apiStatus} setView={setView} />
        {paywallOpen && <Paywall reason={paywallReason} onClose={() => setPaywallOpen(false)} activatePremium={activatePremium} />}
      </>
    );
  }

  return (
    <div className="site-shell">
      <Sidebar view={view} setView={setView} status={apiStatus || status} premium={premium} remaining={remaining} user={user} logout={logout} openPaywall={openPaywall} />
      <main className="workspace">
        {view === "builder" && (
          <Builder
            invoice={invoice}
            lines={lines}
            setLines={setLines}
            updateInvoice={updateInvoice}
            resetBuilder={resetBuilder}
            activeTemplate={activeTemplate}
            templates={templates}
            selectTemplate={selectTemplate}
            totals={totals}
            downloadExcel={downloadExcel}
            remaining={remaining}
            premium={premium}
            clients={clients}
            catalog={catalog}
            branding={branding}
            setInvoice={setInvoice}
            downloadPdf={downloadPdf}
            sendEmail={sendEmail}
          />
        )}
        {view === "models" && <Models templates={templates} activeTemplate={activeTemplate} selectTemplate={selectTemplate} premium={premium} setView={setView} />}
        {view === "export" && <ExportPanel invoice={invoice} lines={lines} totals={totals} template={activeTemplate} downloadExcel={downloadExcel} downloadPdf={downloadPdf} sendEmail={sendEmail} remaining={remaining} premium={premium} />}
        {view === "dashboard" && <Dashboard history={history} clients={clients} catalog={catalog} premium={premium} />}
        {view === "history" && <HistoryPage history={history} setHistory={setHistory} />}
        {view === "clients" && <ClientsPage clients={clients} saveClient={saveClient} deleteClient={deleteClient} setInvoice={setInvoice} setView={setView} />}
        {view === "catalog" && <CatalogPage catalog={catalog} saveCatalogItem={saveCatalogItem} deleteCatalogItem={deleteCatalogItem} setLines={setLines} setView={setView} />}
        {view === "branding" && <BrandingPage branding={branding} updateBranding={updateBranding} invoice={invoice} lines={lines} template={activeTemplate} totals={totals} />}
        {view === "orders" && <PurchaseOrdersPage history={history} clients={clients} token={token} setInvoice={setInvoice} setLines={setLines} setView={setView} />}
        {view === "admin" && <AdminPage token={token} user={user} />}
        {view === "monitoring" && <MonitoringPage history={history} />}
        {view === "subscription" && <SubscriptionPage token={token} premium={premium} user={user} openPaywall={openPaywall} />}
      </main>
      {paywallOpen && <Paywall reason={paywallReason} onClose={() => setPaywallOpen(false)} activatePremium={activatePremium} />}
    </div>
  );
}

function Sidebar({ view, setView, status, premium, remaining, user, logout, openPaywall }) {
  const isAdmin = user?.role === "ADMIN";
  const nav = [
    ["dashboard", "Dashboard", BarChart3],
    ["builder", "Builder", LayoutTemplate],
    ["models", "Modèles", Palette],
    ["clients", "Clients", BriefcaseBusiness],
    ["catalog", "Catalogue", Package],
    ["history", "Historique", History],
    ["orders", "Bons de commande", CreditCard],
    ["branding", "Branding", Settings],
    ...(isAdmin ? [["admin", "Admin", ShieldCheck]] : []),
    ["subscription", "Abonnement", Crown],
    ["monitoring", "Monitoring", BarChart3],
    ["export", "Export Excel", FileDown],
  ];
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <button className="brand-mark" onClick={() => setView("landing")} title="Retour à la vitrine" type="button">FS</button>
        <div>
          <p className="eyebrow">Plateforme</p>
          <h1>Facture Studio</h1>
        </div>
      </div>
      <nav className="nav-tabs" aria-label="Sections">
        {nav.map(([id, label, Icon]) => (
          <button className={`nav-button ${view === id ? "active" : ""}`} key={id} onClick={() => setView(id)} type="button">
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="quota-card">
        <span>{premium ? "Forfait Premium" : "Forfait Gratuit"}</span>
        <strong>{premium ? "Illimité" : `${remaining} exports restants`}</strong>
        {user && <small>{user.email}</small>}
        {!premium && <button className="ghost-button wide" onClick={() => openPaywall("premium-template")} type="button"><Crown /><span>Voir les offres</span></button>}
      </div>
      <div className="sidebar-note">
        <p className="note-title">Statut</p>
        <p>{status}</p>
        <button className="ghost-button wide" onClick={logout} type="button">Déconnexion</button>
      </div>
    </aside>
  );
}

function AuthPage({ mode, setMode, onSubmit, apiStatus, setView }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const isRegister = mode === "register";
  function submit(event) {
    event.preventDefault();
    onSubmit(isRegister ? form : { email: form.email, password: form.password }, mode);
  }
  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="brand-block">
          <div className="brand-mark">FS</div>
          <div>
            <p className="eyebrow">Compte utilisateur</p>
            <h1>{isRegister ? "Créer un compte" : "Connexion"}</h1>
          </div>
        </div>
        <p className="support-text">Connectez-vous pour retrouver vos clients, prestations, factures et avantages Premium.</p>
        <form onSubmit={submit}>
          {isRegister && <Field label="Nom complet" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />}
          <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Field label="Mot de passe" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
          <button className="primary-button wide" type="submit">{isRegister ? "Créer le compte" : "Se connecter"}</button>
        </form>
        {apiStatus && <p className="auth-status">{apiStatus}</p>}
        <div className="auth-actions">
          <button className="ghost-button" onClick={() => setMode(isRegister ? "login" : "register")} type="button">
            {isRegister ? "J'ai déjà un compte" : "Créer un compte"}
          </button>
          <button className="ghost-button" onClick={() => setView("landing")} type="button">Retour vitrine</button>
        </div>
      </div>
    </section>
  );
}

function Landing({ setView, openPaywall }) {
  const featuredTemplates = [templates[4], templates[5], templates[8]];
  const testimonials = [
    { name: "Awa Ndiaye", role: "Fondatrice, Studio Baobab", text: "Nos factures ont enfin l'air aussi sérieuses que nos livrables. L'export Excel est propre, rapide et facile à envoyer." },
    { name: "Mamadou Fall", role: "Consultant finance", text: "J'ai gagné du temps sur chaque facture et les modèles premium donnent une vraie impression de marque." },
    { name: "Ndeye Sarr", role: "Responsable opérations", text: "La prévisualisation évite les erreurs avant l'envoi. C'est exactement ce qu'il fallait à mon équipe." },
  ];

  return (
    <section className="landing-page">
      <header className="landing-nav">
        <div className="brand-block">
          <div className="brand-mark">FS</div>
          <div>
            <p className="eyebrow">Facture Studio</p>
            <h1>Plateforme de factures Excel</h1>
          </div>
        </div>
        <div className="landing-nav-actions">
          <button className="ghost-button" onClick={() => setView("models")} type="button"><Palette /><span>Modèles</span></button>
          <button className="primary-button" onClick={() => setView("builder")} type="button"><span>Ouvrir l'app</span><ArrowRight /></button>
        </div>
      </header>

      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Facturation moderne</p>
          <h2>Une plateforme premium pour créer des factures Excel propres en quelques minutes</h2>
          <p>Choisissez un modèle, remplissez le formulaire, prévisualisez le résultat et exportez un fichier Excel structuré. La version gratuite inclut 5 exports; le forfait Premium débloque les plus beaux modèles et les exports illimités.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setView("builder")} type="button">
              <span>Créer une facture</span>
              <ArrowRight />
            </button>
            <button className="ghost-button" onClick={() => setView("models")} type="button">
              <Palette />
              <span>Voir les modèles</span>
            </button>
          </div>
          <div className="hero-stats">
            <span><strong>12</strong> modèles</span>
            <span><strong>5</strong> exports gratuits</span>
            <span><strong>8</strong> modèles premium</span>
          </div>
        </div>
        <div className="hero-preview-stack">
          <div className="floating-chip chip-one"><Sparkles /> Premium</div>
          <div className="floating-chip chip-two"><FileSpreadsheet /> .xlsx</div>
          <InvoicePreview invoice={initialInvoice} lines={initialLines} template={templates[4]} totals={calculateTotals(initialInvoice, initialLines)} compact />
          <div className="mini-preview-row">
            {featuredTemplates.map((template) => <TemplateThumbnail key={template.id} template={template} />)}
          </div>
        </div>
      </div>

      <div className="feature-strip">
        {["Builder par formulaire", "Prévisualisation animée", "Export Excel stylé", "Suivi des exports"].map((item) => (
          <div className="feature-pill" key={item}>
            <BadgeCheck />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <section className="landing-section showcase-section">
        <div className="section-heading">
          <p className="eyebrow">Exemples</p>
          <h3>Des factures qui donnent confiance avant même l'ouverture du fichier</h3>
        </div>
        <div className="showcase-grid">
          {featuredTemplates.map((template, index) => (
            <article className="showcase-card" key={template.id}>
              <div className="showcase-preview" style={{ animationDelay: `${index * 120}ms` }}>
                <InvoicePreview invoice={{ ...initialInvoice, invoiceNumber: `FAC-2026-00${index + 2}` }} lines={initialLines.slice(0, 2)} template={template} totals={calculateTotals(initialInvoice, initialLines.slice(0, 2))} compact />
              </div>
              <strong>{template.name}</strong>
              <span>{template.description}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section workflow-section">
        <div className="section-heading">
          <p className="eyebrow">Workflow</p>
          <h3>Du formulaire au fichier Excel, sans friction</h3>
        </div>
        <div className="workflow-grid">
          {[
            [Wand2, "Composer", "Renseignez entreprise, client, taxes, remise et lignes."],
            [Palette, "Designer", "Choisissez un modèle standard ou premium avec aperçu."],
            [Download, "Exporter", "Téléchargez un classeur Excel structuré et stylé."],
            [BadgeCheck, "Envoyer", "Présentez une facture claire, professionnelle et prête pour votre client."],
          ].map(([Icon, title, text]) => (
            <div className="workflow-card" key={title}>
              <Icon />
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section benefits-section">
        <div className="section-heading">
          <p className="eyebrow">Pourquoi Facture Studio</p>
          <h3>Tout ce qu'il faut pour facturer avec une image plus professionnelle</h3>
        </div>
        <div className="benefits-grid">
          {[
            ["Des modèles élégants", "Choisissez un style adapté à votre activité et gardez une facture cohérente avec votre image."],
            ["Moins de saisie répétée", "Réutilisez vos clients, prestations et informations d'entreprise à chaque nouvelle facture."],
            ["Des exports prêts à envoyer", "Téléchargez vos factures en Excel ou PDF, puis préparez l'email client en un clic."],
            ["Une gestion plus claire", "Gardez un historique de vos factures et suivez les documents déjà générés."],
          ].map(([title, text]) => (
            <div className="benefit-card" key={title}>
              <Sparkles />
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section testimonials-section">
        <div className="section-heading">
          <p className="eyebrow">Témoignages</p>
          <h3>Conçu pour des indépendants, studios et petites équipes qui veulent paraître solides</h3>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="testimonial-card" key={testimonial.name}>
              <Quote />
              <p>{testimonial.text}</p>
              <div>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing">
        <div className="pricing-card">
          <p className="eyebrow">Gratuit</p>
          <h3>0 FCFA</h3>
          <p>Pour tester la génération et envoyer quelques factures.</p>
          <ul>
            <li>5 exports Excel</li>
            <li>4 modèles standards</li>
            <li>Aperçu en direct</li>
          </ul>
          <button className="ghost-button wide" onClick={() => setView("builder")} type="button">Commencer</button>
        </div>
        <div className="pricing-card premium">
          <p className="eyebrow">Premium</p>
          <h3>4 900 FCFA / mois</h3>
          <p>Pour les entrepreneurs qui veulent de beaux documents sans limite.</p>
          <ul>
            <li>Exports illimités</li>
            <li>8 modèles premium</li>
            <li>Finitions Excel avancées</li>
          </ul>
          <button className="primary-button wide" onClick={() => openPaywall("premium-template")} type="button">
            <Crown />
            <span>Devenir Premium</span>
          </button>
        </div>
      </section>

      <section className="landing-final">
        <div>
          <p className="eyebrow">Prêt</p>
          <h3>Créez votre première facture maintenant</h3>
        </div>
        <button className="primary-button" onClick={() => setView("builder")} type="button"><span>Lancer le builder</span><ArrowRight /></button>
      </section>
    </section>
  );
}

function Builder({ invoice, lines, setLines, updateInvoice, resetBuilder, activeTemplate, templates, selectTemplate, totals, downloadExcel, downloadPdf, sendEmail, remaining, premium, clients, catalog, branding, setInvoice }) {
  function updateLine(index, field, value) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, [field]: value } : line)));
  }

  function applyClient(clientId) {
    const client = clients.find((item) => item.id === clientId);
    if (!client) return;
    setInvoice((current) => ({
      ...current,
      clientName: client.name,
      clientEmail: client.email,
      clientAddress: client.address,
    }));
  }

  function addCatalogItem(itemId) {
    const item = catalog.find((entry) => entry.id === itemId);
    if (!item) return;
    setLines((current) => [...current, { description: item.description || item.name, quantity: 1, price: item.price }]);
  }

  return (
    <>
      <Topbar title="Builder de facture" subtitle={premium ? "Premium actif: exports illimités." : `${remaining} exports gratuits restants.`} downloadExcel={downloadExcel} downloadPdf={downloadPdf} sendEmail={sendEmail} />
      <section className="builder-grid">
        <form className="panel invoice-form">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Formulaire</p>
              <h3>Informations de facture</h3>
            </div>
            <button className="icon-button" onClick={resetBuilder} title="Réinitialiser" type="button"><RotateCcw /></button>
          </div>

          <FormSection title="Entreprise">
            <div className="field-grid two">
              <Field label="Nom de l'entreprise" value={invoice.companyName} onChange={(value) => updateInvoice("companyName", value)} />
              <Field label="Email" type="email" value={invoice.companyEmail} onChange={(value) => updateInvoice("companyEmail", value)} />
              <Field label="Téléphone" value={invoice.companyPhone} onChange={(value) => updateInvoice("companyPhone", value)} />
              <Field label="NINEA / RCCM" value={invoice.companyTaxId} onChange={(value) => updateInvoice("companyTaxId", value)} />
            </div>
            <Field label="Adresse" textarea value={invoice.companyAddress} onChange={(value) => updateInvoice("companyAddress", value)} />
          </FormSection>

          <FormSection title="Client">
            <label>Client enregistré<select defaultValue="" onChange={(event) => applyClient(event.target.value)}><option value="">Choisir un client</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>
            <div className="field-grid two">
              <Field label="Nom du client" value={invoice.clientName} onChange={(value) => updateInvoice("clientName", value)} />
              <Field label="Email" type="email" value={invoice.clientEmail} onChange={(value) => updateInvoice("clientEmail", value)} />
            </div>
            <Field label="Adresse" textarea value={invoice.clientAddress} onChange={(value) => updateInvoice("clientAddress", value)} />
          </FormSection>

          <FormSection title="Détails">
            <div className="field-grid three">
              <Field label="Numéro" value={invoice.invoiceNumber} onChange={(value) => updateInvoice("invoiceNumber", value)} />
              <Field label="Date" type="date" value={invoice.invoiceDate} onChange={(value) => updateInvoice("invoiceDate", value)} />
              <Field label="Échéance" type="date" value={invoice.dueDate} onChange={(value) => updateInvoice("dueDate", value)} />
              <label>Devise<select value={invoice.currency} onChange={(event) => updateInvoice("currency", event.target.value)}><option>FCFA</option><option>EUR</option><option>USD</option><option>GBP</option></select></label>
              <Field label="TVA (%)" type="number" value={invoice.taxRate} onChange={(value) => updateInvoice("taxRate", value)} />
              <Field label="Remise" type="number" value={invoice.discount} onChange={(value) => updateInvoice("discount", value)} />
            </div>
          </FormSection>

          <FormSection title="Lignes">
            <div className="section-row">
              <label className="inline-select">Service du catalogue<select defaultValue="" onChange={(event) => addCatalogItem(event.target.value)}><option value="">Ajouter un service</option>{catalog.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <button className="small-button" type="button" onClick={() => setLines((current) => [...current, { description: "", quantity: 1, price: 0 }])}><Plus /><span>Ajouter</span></button>
            </div>
            <div className="line-items">
              {lines.map((line, index) => (
                <div className="line-item" key={index}>
                  <Field className="description" label="Description" value={line.description} onChange={(value) => updateLine(index, "description", value)} />
                  <Field label="Qté" type="number" value={line.quantity} onChange={(value) => updateLine(index, "quantity", value)} />
                  <Field label="Prix" type="number" value={line.price} onChange={(value) => updateLine(index, "price", value)} />
                  <button className="icon-button" type="button" onClick={() => setLines((current) => current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index))}><Trash2 /></button>
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection title="Notes et paiement">
            <Field label="Notes" textarea value={invoice.notes} onChange={(value) => updateInvoice("notes", value)} />
            <Field label="Instructions de paiement" textarea value={invoice.paymentTerms} onChange={(value) => updateInvoice("paymentTerms", value)} />
          </FormSection>
        </form>

        <section className="preview-column">
          <TemplateRail templates={templates} activeTemplate={activeTemplate} selectTemplate={selectTemplate} />
          <InvoicePreview invoice={invoice} lines={lines} template={activeTemplate} totals={totals} branding={branding} />
        </section>
      </section>
    </>
  );
}

function Models({ templates, activeTemplate, selectTemplate, premium, setView }) {
  return (
    <>
      <div className="models-header">
        <div>
          <p className="eyebrow">Bibliothèque</p>
          <h2>Modèles avec prévisualisation</h2>
        </div>
        <button className="primary-button" onClick={() => setView("builder")} type="button"><LayoutTemplate /><span>Ouvrir le builder</span></button>
      </div>
      <div className="model-grid">
        {templates.map((template) => (
          <button className={`model-card ${activeTemplate.id === template.id ? "active" : ""}`} key={template.id} onClick={() => selectTemplate(template)} type="button">
            <div className="model-invoice-preview">
              <InvoicePreview invoice={initialInvoice} lines={initialLines.slice(0, 2)} template={template} totals={calculateTotals(initialInvoice, initialLines.slice(0, 2))} compact />
            </div>
            <div className="model-card-footer">
              <div>
                <strong>{template.name}</strong>
                <span>{template.description}</span>
              </div>
              {template.tier === "premium" && !premium ? <Lock /> : <BadgeCheck />}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function ExportPanel({ invoice, lines, totals, template, downloadExcel, downloadPdf, sendEmail, remaining, premium }) {
  return (
    <>
      <Topbar title="Export et envoi" subtitle={premium ? "Exports illimités avec Premium." : `${remaining} exports gratuits disponibles.`} downloadExcel={downloadExcel} downloadPdf={downloadPdf} sendEmail={sendEmail} />
      <div className="export-layout">
        <div className="panel export-panel">
          <p className="eyebrow">Téléchargement</p>
          <h3>Générez, envoyez ou imprimez votre facture</h3>
          <p className="support-text">Le fichier Excel garde une structure modifiable. Le PDF est pratique pour l'envoi client, et l'email prépare automatiquement le message de transmission.</p>
          <div className="export-actions">
            <button className="primary-button wide" onClick={downloadExcel} type="button"><FileSpreadsheet /><span>Générer le fichier .xlsx</span></button>
            <button className="ghost-button wide" onClick={downloadPdf} type="button"><FileDown /><span>Télécharger le PDF</span></button>
            <button className="ghost-button wide" onClick={sendEmail} type="button"><Mail /><span>Préparer l'email</span></button>
            <button className="ghost-button wide" onClick={() => window.print()} type="button"><Printer /><span>Imprimer l'aperçu</span></button>
          </div>
        </div>
        <div className="export-stats">
          <Metric label="Total TTC" value={formatMoney(totals.total, invoice.currency)} />
          <Metric label="Lignes" value={String(lines.length)} />
          <Metric label="Modèle" value={template.name} />
        </div>
      </div>
      <InvoicePreview invoice={invoice} lines={lines} template={template} totals={totals} />
    </>
  );
}

function Dashboard({ history, clients, catalog, premium }) {
  const revenue = history.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const overdue = history.filter((item) => item.status === "À relancer").length;
  const lastInvoices = history.slice(0, 5);
  return (
    <>
      <Topbar title="Dashboard" subtitle={premium ? "Vue premium active." : "Vue locale de démonstration."} />
      <div className="dashboard-grid">
        <Metric label="Chiffre d'affaires exporté" value={formatMoney(revenue, "FCFA")} />
        <Metric label="Factures créées" value={String(history.length)} />
        <Metric label="Clients" value={String(clients.length)} />
        <Metric label="Services catalogue" value={String(catalog.length)} />
      </div>
      <div className="insight-grid">
        <section className="panel data-panel">
          <p className="eyebrow">Relances</p>
          <h3>{overdue} facture(s) à surveiller</h3>
          <p className="support-text">L'agent relance pourra utiliser cette donnée pour préparer des emails automatiques selon l'échéance.</p>
          <button className="ghost-button" type="button"><Bell /><span>Planifier les relances</span></button>
        </section>
        <section className="panel data-panel">
          <p className="eyebrow">Dernières factures</p>
          <div className="mini-list">
            {lastInvoices.length === 0 ? <span>Aucune facture exportée pour l'instant.</span> : lastInvoices.map((item) => (
              <div className="mini-list-row" key={item.id}>
                <strong>{item.number}</strong>
                <span>{item.clientName} · {formatMoney(item.amount, item.currency)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function HistoryPage({ history, setHistory }) {
  function clearHistory() {
    saveStored("facture-studio-history", []);
    setHistory([]);
  }
  return (
    <>
      <Topbar title="Historique des factures" subtitle="Exports, emails et statuts de relance." />
      <section className="panel data-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Historique</p><h3>{history.length} facture(s)</h3></div>
          <button className="ghost-button" onClick={clearHistory} type="button"><Trash2 /><span>Vider</span></button>
        </div>
        <DataTable headers={["Numéro", "Client", "Montant", "Canal", "Statut", "Date"]} rows={history.map((item) => [item.number, item.clientName, formatMoney(item.amount, item.currency), item.channel, item.status, formatDate(item.createdAt)])} />
      </section>
    </>
  );
}

function ClientsPage({ clients, saveClient, deleteClient, setInvoice, setView }) {
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  function submit(event) {
    event.preventDefault();
    if (!form.name) return;
    saveClient({ id: crypto.randomUUID(), ...form });
    setForm({ name: "", email: "", address: "" });
  }
  function useClient(client) {
    setInvoice((current) => ({ ...current, clientName: client.name, clientEmail: client.email, clientAddress: client.address }));
    setView("builder");
  }
  function removeClient(id) {
    deleteClient(id);
  }
  return (
    <>
      <Topbar title="Clients" subtitle="Répertoire client réutilisable dans le builder." />
      <div className="management-grid">
        <form className="panel data-panel" onSubmit={submit}>
          <p className="eyebrow">Nouveau client</p>
          <Field label="Nom" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Field label="Adresse" textarea value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          <button className="primary-button wide" type="submit"><Plus /><span>Ajouter</span></button>
        </form>
        <section className="panel data-panel">
          <p className="eyebrow">Répertoire</p>
          <div className="card-list">
            {clients.map((client) => (
              <article className="entity-card" key={client.id}>
                <div><strong>{client.name}</strong><span>{client.email}</span><p>{client.address}</p></div>
                <div className="entity-actions">
                  <button className="ghost-button" onClick={() => useClient(client)} type="button"><ArrowRight /><span>Utiliser</span></button>
                  <button className="icon-button" onClick={() => removeClient(client.id)} type="button"><Trash2 /></button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function CatalogPage({ catalog, saveCatalogItem, deleteCatalogItem, setLines, setView }) {
  const [form, setForm] = useState({ name: "", description: "", price: 0 });
  function submit(event) {
    event.preventDefault();
    if (!form.name) return;
    saveCatalogItem({ id: crypto.randomUUID(), ...form, price: Number(form.price) || 0 });
    setForm({ name: "", description: "", price: 0 });
  }
  function useItem(item) {
    setLines((current) => [...current, { description: item.description || item.name, quantity: 1, price: item.price }]);
    setView("builder");
  }
  function removeItem(id) {
    deleteCatalogItem(id);
  }
  return (
    <>
      <Topbar title="Catalogue services" subtitle="Produits et prestations prêts à insérer dans une facture." />
      <div className="management-grid">
        <form className="panel data-panel" onSubmit={submit}>
          <p className="eyebrow">Nouvelle prestation</p>
          <Field label="Nom" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Description" textarea value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <Field label="Prix" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} />
          <button className="primary-button wide" type="submit"><Plus /><span>Ajouter</span></button>
        </form>
        <section className="panel data-panel">
          <p className="eyebrow">Catalogue</p>
          <div className="card-list">
            {catalog.map((item) => (
              <article className="entity-card" key={item.id}>
                <div><strong>{item.name}</strong><span>{formatMoney(item.price, "FCFA")}</span><p>{item.description}</p></div>
                <div className="entity-actions">
                  <button className="ghost-button" onClick={() => useItem(item)} type="button"><ArrowRight /><span>Insérer</span></button>
                  <button className="icon-button" onClick={() => removeItem(item.id)} type="button"><Trash2 /></button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function BrandingPage({ branding, updateBranding, invoice, lines, template, totals }) {
  const [draft, setDraft] = useState(branding);
  return (
    <>
      <Topbar title="Branding" subtitle="Logo texte, couleurs et signature de bas de facture." />
      <div className="builder-grid">
        <section className="panel data-panel">
          <p className="eyebrow">Identité visuelle</p>
          <Field label="Logo texte" value={draft.logoText} onChange={(value) => setDraft({ ...draft, logoText: value })} />
          <label>Couleur principale<input type="color" value={draft.primaryColor} onChange={(event) => setDraft({ ...draft, primaryColor: event.target.value })} /></label>
          <label>Couleur secondaire<input type="color" value={draft.accentColor} onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })} /></label>
          <Field label="Signature" textarea value={draft.footerSignature} onChange={(value) => setDraft({ ...draft, footerSignature: value })} />
          <button className="primary-button wide" onClick={() => updateBranding(draft)} type="button"><Settings /><span>Sauvegarder</span></button>
        </section>
        <InvoicePreview invoice={invoice} lines={lines} template={template} totals={totals} branding={draft} />
      </div>
    </>
  );
}

function PurchaseOrdersPage({ history, clients, token, setInvoice, setLines, setView }) {
  const [orders, setOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [form, setForm] = useState({
    number: `BC-${new Date().getFullYear()}-002`,
    orderDate: new Date().toISOString().slice(0, 10),
    clientName: clients[0]?.name || "",
    clientEmail: clients[0]?.email || "",
    clientAddress: clients[0]?.address || "",
    supplierName: initialInvoice.companyName,
    supplierEmail: initialInvoice.companyEmail,
    supplierAddress: initialInvoice.companyAddress,
    itemsSummary: "200 repas | 200 | 2500\n50 bouteilles d'eau | 50 | 500",
    paymentTerms: "Paiement à 15 jours après réception de la facture.",
    validationName: "",
    invoiceNumber: "",
  });
  const orderLines = useMemo(() => parseOrderLines(form.itemsSummary), [form.itemsSummary]);
  const orderAmount = orderLines.reduce((sum, line) => sum + line.quantity * line.price, 0);

  useEffect(() => {
    loadOrders();
  }, [token]);

  async function loadOrders() {
    if (!token) {
      setOrders(loadStored("facture-studio-purchase-orders", []));
      return;
    }
    try {
      const response = await apiRequest("/api/purchase-orders", { token });
      setOrders(response);
      setOrderStatus("Bons de commande synchronisés.");
    } catch {
      setOrderStatus("Impossible de charger les bons de commande.");
    }
  }

  function applyClient(clientName) {
    const client = clients.find((item) => item.name === clientName);
    setForm({
      ...form,
      clientName,
      clientEmail: client?.email || form.clientEmail,
      clientAddress: client?.address || form.clientAddress,
    });
  }

  async function submit(event) {
    event.preventDefault();
    const payload = { ...form, amount: orderAmount };
    if (token) {
      try {
        await apiRequest("/api/purchase-orders", { token, method: "POST", body: payload });
        setOrderStatus("Bon de commande créé et validé.");
        await loadOrders();
        return;
      } catch {
        setOrderStatus("Le bon de commande n'a pas pu être enregistré.");
      }
    }
    const next = [{ id: crypto.randomUUID(), ...payload, status: payload.invoiceNumber ? "INVOICED" : "VALIDATED" }, ...orders];
    setOrders(next);
    saveStored("facture-studio-purchase-orders", next);
  }

  function createInvoiceFromOrder(order) {
    const lines = parseOrderLines(order.itemsSummary || "");
    setInvoice((current) => ({
      ...current,
      clientName: order.clientName,
      clientEmail: order.clientEmail || current.clientEmail,
      clientAddress: order.clientAddress || current.clientAddress,
      companyName: order.supplierName || current.companyName,
      companyEmail: order.supplierEmail || current.companyEmail,
      companyAddress: order.supplierAddress || current.companyAddress,
      invoiceNumber: order.invoiceNumber || `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      invoiceDate: new Date().toISOString().slice(0, 10),
      notes: `Facture créée à partir du bon de commande ${order.number}.`,
      paymentTerms: order.paymentTerms || current.paymentTerms,
    }));
    setLines(lines.length ? lines : [{ description: `Bon de commande ${order.number}`, quantity: 1, price: Number(order.amount) || 0 }]);
    setView("builder");
  }

  return (
    <>
      <Topbar title="Bons de commande" subtitle="Validez une commande client, puis créez la facture correspondante après livraison." />
      <div className="management-grid">
        <form className="panel data-panel" onSubmit={submit}>
          <p className="eyebrow">Nouveau bon</p>
          <Field label="Numéro" value={form.number} onChange={(value) => setForm({ ...form, number: value })} />
          <Field label="Date" type="date" value={form.orderDate} onChange={(value) => setForm({ ...form, orderDate: value })} />
          <label>Client<select value={form.clientName} onChange={(event) => applyClient(event.target.value)}><option value="">Choisir</option>{clients.map((client) => <option key={client.id}>{client.name}</option>)}</select></label>
          <Field label="Email client" type="email" value={form.clientEmail} onChange={(value) => setForm({ ...form, clientEmail: value })} />
          <Field label="Adresse client" textarea value={form.clientAddress} onChange={(value) => setForm({ ...form, clientAddress: value })} />
          <Field label="Fournisseur" value={form.supplierName} onChange={(value) => setForm({ ...form, supplierName: value })} />
          <Field label="Email fournisseur" type="email" value={form.supplierEmail} onChange={(value) => setForm({ ...form, supplierEmail: value })} />
          <Field label="Adresse fournisseur" textarea value={form.supplierAddress} onChange={(value) => setForm({ ...form, supplierAddress: value })} />
          <Field label="Produits/services, format: description | quantité | prix unitaire" textarea value={form.itemsSummary} onChange={(value) => setForm({ ...form, itemsSummary: value })} />
          <Metric label="Total du bon" value={formatMoney(orderAmount, "FCFA")} />
          <Field label="Conditions de paiement" textarea value={form.paymentTerms} onChange={(value) => setForm({ ...form, paymentTerms: value })} />
          <Field label="Validation / signature" value={form.validationName} onChange={(value) => setForm({ ...form, validationName: value })} />
          <label>Facture liée<select value={form.invoiceNumber} onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })}><option value="">Pas encore facturé</option>{history.map((invoice) => <option key={invoice.id}>{invoice.number}</option>)}</select></label>
          <button className="primary-button wide" type="submit"><Plus /><span>Créer le bon</span></button>
          {orderStatus && <p className="support-text">{orderStatus}</p>}
        </form>
        <section className="panel data-panel">
          <p className="eyebrow">Cycle commande, livraison, facture</p>
          <div className="card-list">
            {orders.length === 0 ? <p className="support-text">Aucun bon de commande disponible.</p> : orders.map((order) => (
              <article className="entity-card" key={order.id}>
                <div>
                  <strong>{order.number} · {order.clientName}</strong>
                  <span>{formatMoney(order.amount, "FCFA")} · {order.invoiceNumber ? `Facture ${order.invoiceNumber}` : "À facturer après livraison"}</span>
                  <p>{order.itemsSummary || "Aucune ligne détaillée."}</p>
                </div>
                <div className="entity-actions">
                  <button className="ghost-button" onClick={() => createInvoiceFromOrder(order)} type="button"><FileSpreadsheet /><span>Créer facture</span></button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function AdminPage({ token, user }) {
  const [stats, setStats] = useState(null);
  const [adminClients, setAdminClients] = useState([]);
  const [adminInvoices, setAdminInvoices] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [adminStatus, setAdminStatus] = useState("");

  const revenue = adminInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const isAdmin = user?.role === "ADMIN";

  async function loadAdminData() {
    if (!token || !isAdmin) return;
    try {
      setAdminStatus("Chargement des données admin...");
      const [nextStats, nextClients, nextInvoices, nextOrders] = await Promise.all([
        apiRequest("/api/admin/stats", { token }),
        apiRequest("/api/admin/customers", { token }),
        apiRequest("/api/admin/invoices", { token }),
        apiRequest("/api/admin/purchase-orders", { token }),
      ]);
      setStats(nextStats);
      setAdminClients(nextClients);
      setAdminInvoices(nextInvoices);
      setAdminOrders(nextOrders);
      setSelectedOrderId((current) => current || String(nextOrders[0]?.id || ""));
      setSelectedInvoiceNumber((current) => current || nextInvoices[0]?.number || "");
      setAdminStatus("Données admin synchronisées.");
    } catch (error) {
      setAdminStatus(error.status === 403 ? "Accès admin refusé." : "Impossible de charger les données admin.");
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [token, isAdmin]);

  async function linkOrderToInvoice(event) {
    event.preventDefault();
    if (!selectedOrderId) {
      setAdminStatus("Sélectionnez un bon de commande.");
      return;
    }
    try {
      await apiRequest(`/api/admin/purchase-orders/${selectedOrderId}/link`, {
        token,
        method: "PUT",
        body: { invoiceNumber: selectedInvoiceNumber },
      });
      setAdminStatus(selectedInvoiceNumber ? "Bon de commande lié à la facture." : "Lien facture retiré du bon de commande.");
      await loadAdminData();
    } catch {
      setAdminStatus("La liaison n'a pas pu être enregistrée.");
    }
  }

  if (!isAdmin) {
    return (
      <>
        <Topbar title="Admin" subtitle="Accès réservé aux administrateurs de la plateforme." />
        <section className="panel data-panel">
          <p className="eyebrow">Accès protégé</p>
          <h3>Connectez-vous avec un compte admin.</h3>
          <p className="support-text">Cette zone permet de superviser tous les clients, factures et bons de commande.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <Topbar title="Admin" subtitle="Vue de supervision globale de la plateforme." />
      <div className="dashboard-grid">
        <Metric label="Utilisateurs" value={String(stats?.users ?? "-")} />
        <Metric label="Clients" value={String(stats?.customers ?? adminClients.length)} />
        <Metric label="Factures" value={String(stats?.invoices ?? adminInvoices.length)} />
        <Metric label="Bons de commande" value={String(stats?.purchaseOrders ?? adminOrders.length)} />
        <Metric label="Revenus suivis" value={formatMoney(revenue, "FCFA")} />
      </div>
      <div className="management-grid">
        <form className="panel data-panel" onSubmit={linkOrderToInvoice}>
          <p className="eyebrow">Liaison bon / facture</p>
          <label>Bon de commande<select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)}><option value="">Choisir un bon</option>{adminOrders.map((order) => <option key={order.id} value={order.id}>{order.number} - {order.clientName}</option>)}</select></label>
          <label>Facture<select value={selectedInvoiceNumber} onChange={(event) => setSelectedInvoiceNumber(event.target.value)}><option value="">Retirer le lien</option>{adminInvoices.map((invoice) => <option key={invoice.id} value={invoice.number}>{invoice.number} - {invoice.clientName}</option>)}</select></label>
          <button className="primary-button wide" type="submit"><BadgeCheck /><span>Enregistrer le lien</span></button>
          {adminStatus && <p className="support-text">{adminStatus}</p>}
        </form>
        <section className="panel data-panel">
          <p className="eyebrow">Bons de commande</p>
          <DataTable headers={["Bon", "Client", "Fournisseur", "Date", "Montant", "Facture", "Statut", "Compte"]} rows={adminOrders.map((order) => [order.number, order.clientName, order.supplierName || "-", formatDate(order.orderDate), formatMoney(order.amount, "FCFA"), order.invoiceNumber || "-", order.status, order.ownerEmail])} />
        </section>
      </div>
      <section className="panel data-panel">
        <p className="eyebrow">Toutes les factures</p>
        <DataTable headers={["Facture", "Client", "Montant", "Modèle", "Statut", "Compte"]} rows={adminInvoices.map((invoice) => [invoice.number, invoice.clientName, formatMoney(invoice.total, invoice.currency), invoice.templateName || "-", invoice.status, invoice.ownerEmail])} />
      </section>
      <section className="panel data-panel">
        <p className="eyebrow">Tous les clients</p>
        <DataTable headers={["Client", "Email", "Adresse", "Compte"]} rows={adminClients.map((client) => [client.name, client.email || "-", client.address || "-", client.ownerEmail])} />
      </section>
    </>
  );
}

function MonitoringPage({ history }) {
  const total = history.length || 1;
  const sent = history.filter((item) => item.status === "Envoyée").length;
  const overdue = history.filter((item) => item.status === "À relancer").length;
  const paid = history.filter((item) => item.status === "Payée").length;
  const bars = [
    ["Envoyées", sent, "#0f8b8d"],
    ["À relancer", overdue, "#db6b57"],
    ["Payées", paid, "#237052"],
  ];
  return (
    <>
      <Topbar title="Monitoring" subtitle="Indicateurs de santé métier et activité de facturation." />
      <div className="monitoring-grid">
        {bars.map(([label, value, color]) => (
          <div className="panel chart-card" key={label}>
            <span>{label}</span>
            <div className="bar-track"><div style={{ width: `${Math.min((value / total) * 100, 100)}%`, background: color }} /></div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="panel data-panel">
        <p className="eyebrow">Outil recommandé</p>
        <h3>Prometheus + Grafana</h3>
        <p className="support-text">À brancher côté backend pour suivre disponibilité API, temps de réponse, erreurs, volumes d'exports, connexions, inscriptions et consommation des quotas.</p>
      </section>
    </>
  );
}

function SubscriptionPage({ token, premium, user, openPaywall }) {
  const [subscription, setSubscription] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState("Chargement de l'abonnement...");

  useEffect(() => {
    async function loadSubscription() {
      try {
        const response = await apiRequest("/api/billing/subscription", { token });
        setSubscription(response);
        setSubscriptionStatus(response.stripeConfigured ? "Stripe est configuré pour les paiements." : "Stripe n'est pas encore configuré côté serveur.");
      } catch {
        setSubscriptionStatus("Impossible de charger l'abonnement.");
      }
    }
    if (token) loadSubscription();
  }, [token]);

  const planName = subscription?.subscriptionPlan || (premium ? "premium" : "free");
  return (
    <>
      <Topbar title="Abonnement" subtitle="Gérez votre formule, votre quota et l'activation Premium." />
      <div className="dashboard-grid">
        <Metric label="Plan actuel" value={premium ? "Premium" : "Gratuit"} />
        <Metric label="Compte" value={user?.email || "-"} />
        <Metric label="Offre Stripe" value={planName} />
        <Metric label="Statut" value={subscription?.status || (premium ? "active" : "inactive")} />
      </div>
      <div className="management-grid">
        <section className="panel data-panel">
          <p className="eyebrow">Paiement premium</p>
          <h3>{premium ? "Votre accès Premium est actif" : "Passez à Premium avec Stripe Checkout"}</h3>
          <p className="support-text">Le paiement est redirigé vers Stripe Checkout. Le webhook active ensuite le forfait Premium côté backend, qui devient l'autorité pour les quotas.</p>
          <button className="primary-button wide" onClick={() => openPaywall("premium-template")} type="button"><CreditCard /><span>{premium ? "Changer d'offre" : "Choisir une offre"}</span></button>
          <p className="support-text">{subscriptionStatus}</p>
        </section>
        <section className="panel data-panel">
          <p className="eyebrow">À configurer dans Stripe</p>
          <DataTable
            headers={["Variable", "Usage"]}
            rows={[
              ["STRIPE_SECRET_KEY", "Clé secrète API Stripe"],
              ["STRIPE_WEBHOOK_SECRET", "Signature du webhook"],
              ["STRIPE_PREMIUM_PRICE_ID", "Prix mensuel Premium"],
              ["STRIPE_BRANCHES_PRICE_ID", "Prix mensuel Succursales"],
            ]}
          />
        </section>
      </div>
    </>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={headers.length}>Aucune donnée disponible.</td></tr> : rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function Topbar({ title, subtitle, downloadExcel, downloadPdf, sendEmail }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Générateur Excel</p>
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>
      <div className="topbar-actions">
        {sendEmail && <button className="ghost-button" onClick={sendEmail} type="button"><Send /><span>Email</span></button>}
        {downloadPdf && <button className="ghost-button" onClick={downloadPdf} type="button"><FileDown /><span>PDF</span></button>}
        {downloadExcel && <button className="primary-button" onClick={downloadExcel} type="button"><Download /><span>Excel</span></button>}
      </div>
    </header>
  );
}

function TemplateRail({ templates, activeTemplate, selectTemplate }) {
  return (
    <div className="panel template-picker">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Modèle actif</p>
          <h3>{activeTemplate.name}</h3>
        </div>
      </div>
      <div className="swatches">
        {templates.map((template) => (
          <button className={`swatch ${template.id === activeTemplate.id ? "active" : ""}`} key={template.id} style={{ "--swatch": template.color }} title={template.name} onClick={() => selectTemplate(template)} type="button">
            {template.tier === "premium" && <Crown />}
          </button>
        ))}
      </div>
    </div>
  );
}

function TemplateThumbnail({ template }) {
  return (
    <div className={`template-thumbnail ${template.style}`} style={{ "--template-color": template.color, "--template-accent": template.accent }}>
      <div className="thumb-head" />
      <div className="thumb-lines">
        <span />
        <span />
        <span />
      </div>
      <div className="thumb-total" />
      <div className="thumb-badge">{template.tier === "premium" ? "Premium" : "Gratuit"}</div>
    </div>
  );
}

function InvoicePreview({ invoice, lines, template, totals, compact = false, branding = defaultBranding }) {
  const previewTemplate = { ...template, color: branding.primaryColor || template.color, accent: branding.accentColor || template.accent };
  return (
    <div className={`invoice-preview template-${template.style} ${compact ? "compact-preview" : ""}`} style={{ "--template-color": previewTemplate.color, "--template-accent": previewTemplate.accent }}>
      <div className="preview-inner">
        <div className="preview-header">
          <div>
            <div className="preview-logo">{branding.logoText || "FS"}</div>
            <div className="preview-title">Facture</div>
            <div className="invoice-number">{invoice.invoiceNumber || "FAC-0000"}</div>
          </div>
          <div className="preview-meta">
            <Meta label="Date" value={formatDate(invoice.invoiceDate)} />
            <Meta label="Échéance" value={formatDate(invoice.dueDate)} />
            <Meta label="Devise" value={invoice.currency} />
          </div>
        </div>
        <div className="preview-parties">
          <div>
            <h3>{invoice.companyName || "Votre entreprise"}</h3>
            <p>{invoice.companyAddress}</p>
            <p>{[invoice.companyEmail, invoice.companyPhone, invoice.companyTaxId].filter(Boolean).join(" | ")}</p>
          </div>
          <div>
            <h3>Facturé à</h3>
            <strong>{invoice.clientName || "Nom du client"}</strong>
            <p>{invoice.clientAddress}</p>
            <p>{invoice.clientEmail}</p>
          </div>
        </div>
        <table className="items-table">
          <thead><tr><th>Description</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index}>
                <td>{line.description || "Prestation"}</td>
                <td>{Number(line.quantity) || 0}</td>
                <td>{formatMoney(line.price, invoice.currency)}</td>
                <td>{formatMoney((Number(line.quantity) || 0) * (Number(line.price) || 0), invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <TotalRow label="Sous-total" value={formatMoney(totals.subtotal, invoice.currency)} />
          <TotalRow label="Remise" value={formatMoney(totals.discount, invoice.currency)} />
          <TotalRow label={`TVA (${invoice.taxRate || 0}%)`} value={formatMoney(totals.tax, invoice.currency)} />
          <TotalRow label="Total TTC" value={formatMoney(totals.total, invoice.currency)} grand />
        </div>
        <div className="preview-footer">
          <div><strong>Notes</strong><p>{invoice.notes}</p></div>
          <div><strong>Paiement</strong><p>{invoice.paymentTerms}</p><small>{branding.footerSignature}</small></div>
        </div>
      </div>
    </div>
  );
}

function Paywall({ reason, onClose, activatePremium }) {
  const isQuota = reason === "quota";
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [paymentMethod, setPaymentMethod] = useState("mobile-money");
  const plans = [
    { id: "premium", name: "Premium", price: "4 900 FCFA", cadence: "/ mois", description: "Pour indépendants et petites équipes.", features: ["Exports illimités", "Modèles premium", "Branding avancé"] },
    { id: "branches", name: "Succursales", price: "19 900 FCFA", cadence: "/ mois", description: "Pour plusieurs points de vente.", features: ["Quotas par équipe", "Suivi centralisé", "Support prioritaire"] },
    { id: "enterprise", name: "Entreprise", price: "Sur devis", cadence: "", description: "Pour grandes organisations.", features: ["Rôles avancés", "Monitoring global", "Accompagnement dédié"] },
  ];
  const methods = [
    ["mobile-money", "Mobile Money"],
    ["card", "Carte bancaire"],
    ["transfer", "Virement"],
  ];
  const activePlan = plans.find((plan) => plan.id === selectedPlan) || plans[0];
  return (
    <div className="modal-backdrop">
      <div className="paywall" data-testid="premium-modal">
        <button className="icon-button modal-close" onClick={onClose} type="button">×</button>
        <div className="paywall-hero">
          <p className="eyebrow">{isQuota ? "Limite atteinte" : "Offres premium"}</p>
          <h3>{isQuota ? "Votre quota gratuit est terminé" : "Passez à une facturation sans limite"}</h3>
          <p>{isQuota ? "Choisissez une formule pour continuer à générer et télécharger vos documents." : "Débloquez les modèles les plus soignés, les exports illimités et les fonctions d'équipe."}</p>
        </div>
        <div className="plan-grid">
          {plans.map((plan) => (
            <button className={`plan-card ${selectedPlan === plan.id ? "selected" : ""}`} key={plan.id} onClick={() => setSelectedPlan(plan.id)} type="button">
              <span>{plan.name}</span>
              <strong>{plan.price}<small>{plan.cadence}</small></strong>
              <p>{plan.description}</p>
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            </button>
          ))}
        </div>
        <div className="checkout-box">
          <div>
            <p className="eyebrow">Paiement sécurisé</p>
            <h4>{activePlan.name} · {activePlan.price}{activePlan.cadence}</h4>
          </div>
          <div className="payment-methods" role="group" aria-label="Méthode de paiement">
            {methods.map(([id, label]) => (
              <button className={paymentMethod === id ? "selected" : ""} key={id} onClick={() => setPaymentMethod(id)} type="button">{label}</button>
            ))}
          </div>
          <button className="primary-button wide" onClick={() => activatePremium(selectedPlan, paymentMethod)} type="button"><CreditCard /><span>{selectedPlan === "enterprise" ? "Demander un devis" : "Payer avec Stripe"}</span></button>
          <small>Vous serez redirigé vers Stripe Checkout. Le forfait est activé après confirmation du webhook.</small>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea = false, className = "" }) {
  return (
    <label className={className}>
      {label}
      {textarea ? <textarea rows="2" value={value} onChange={(event) => onChange(event.target.value)} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function FormSection({ title, children }) {
  return <section className="form-section"><h4>{title}</h4>{children}</section>;
}

function Meta({ label, value }) {
  return <div className="preview-meta-row"><span>{label}</span><strong>{value}</strong></div>;
}

function TotalRow({ label, value, grand = false }) {
  return <div className={`total-row ${grand ? "grand" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function parseOrderLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => {
      const [description, quantity, price] = line.split("|").map((part) => part?.trim());
      return {
        description: description || "Produit/service",
        quantity: Number(quantity) || 0,
        price: Number(price) || 0,
      };
    })
    .filter((line) => line.description && (line.quantity > 0 || line.price > 0));
}

function calculateTotals(invoice, lines) {
  const subtotal = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.price) || 0), 0);
  const discount = Math.min(Number(invoice.discount) || 0, subtotal);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = taxable * ((Number(invoice.taxRate) || 0) / 100);
  return { subtotal, discount, taxable, tax, total: taxable + tax };
}

function formatMoney(value, currency) {
  const amount = Number(value) || 0;
  if (currency === "FCFA") return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(value) {
  if (!value) return "Non définie";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

function currencyFormat(currency) {
  return currency === "FCFA" ? '#,##0 "FCFA"' : `#,##0.00 "${currency}"`;
}

async function buildWorkbook({ invoice, lines, template, totals }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Facture Studio";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Facture", {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  sheet.columns = [{ width: 28 }, { width: 14 }, { width: 16 }, { width: 18 }, { width: 18 }];
  const accent = template.color.replace("#", "");
  const border = { style: "thin", color: { argb: "FFD9E2E0" } };

  sheet.mergeCells("A1:E2");
  sheet.getCell("A1").value = "FACTURE";
  sheet.getCell("A1").font = { size: 30, bold: true, color: { argb: `FF${accent}` } };
  sheet.getCell("A1").alignment = { vertical: "middle" };

  sheet.getCell("A4").value = invoice.companyName;
  sheet.getCell("A4").font = { bold: true, size: 13 };
  sheet.getCell("A5").value = invoice.companyAddress;
  sheet.getCell("A6").value = [invoice.companyEmail, invoice.companyPhone].filter(Boolean).join(" | ");
  sheet.getCell("A7").value = invoice.companyTaxId;
  [["D4", "Numéro", invoice.invoiceNumber], ["D5", "Date", formatDate(invoice.invoiceDate)], ["D6", "Échéance", formatDate(invoice.dueDate)], ["D7", "Devise", invoice.currency]].forEach(([labelCell, label, value]) => {
    sheet.getCell(labelCell).value = label;
    sheet.getCell(labelCell.replace("D", "E")).value = value;
  });

  sheet.getCell("A9").value = "Facturé à";
  sheet.getCell("A9").font = { bold: true, color: { argb: `FF${accent}` } };
  sheet.getCell("A10").value = invoice.clientName;
  sheet.getCell("A10").font = { bold: true };
  sheet.getCell("A11").value = invoice.clientAddress;
  sheet.getCell("A12").value = invoice.clientEmail;

  const headerRow = sheet.getRow(15);
  headerRow.values = ["Description", "Quantité", "Prix unitaire", "Total", ""];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${accent}` } };

  let rowIndex = 16;
  lines.forEach((line) => {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).value = line.description || "Prestation";
    row.getCell(2).value = Number(line.quantity) || 0;
    row.getCell(3).value = Number(line.price) || 0;
    row.getCell(4).value = (Number(line.quantity) || 0) * (Number(line.price) || 0);
    row.getCell(3).numFmt = currencyFormat(invoice.currency);
    row.getCell(4).numFmt = currencyFormat(invoice.currency);
    row.eachCell((cell) => {
      cell.border = { bottom: border };
      cell.alignment = { vertical: "top", wrapText: true };
    });
    rowIndex += 1;
  });

  rowIndex += 1;
  [["Sous-total", totals.subtotal], ["Remise", totals.discount], [`TVA (${invoice.taxRate || 0}%)`, totals.tax], ["Total TTC", totals.total]].forEach(([label, value], index) => {
    const row = sheet.getRow(rowIndex + index);
    row.getCell(3).value = label;
    row.getCell(4).value = value;
    row.getCell(4).numFmt = currencyFormat(invoice.currency);
    row.getCell(3).font = { bold: true };
    row.getCell(4).font = { bold: true };
    if (index === 3) {
      [3, 4].forEach((cellIndex) => {
        row.getCell(cellIndex).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${accent}` } };
        row.getCell(cellIndex).font = { bold: true, color: { argb: "FFFFFFFF" } };
      });
    }
  });

  rowIndex += 6;
  sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  sheet.getCell(`A${rowIndex}`).value = "Notes";
  sheet.getCell(`A${rowIndex}`).font = { bold: true, color: { argb: `FF${accent}` } };
  sheet.mergeCells(`A${rowIndex + 1}:B${rowIndex + 3}`);
  sheet.getCell(`A${rowIndex + 1}`).value = invoice.notes;
  sheet.getCell(`A${rowIndex + 1}`).alignment = { wrapText: true, vertical: "top" };
  sheet.mergeCells(`D${rowIndex}:E${rowIndex}`);
  sheet.getCell(`D${rowIndex}`).value = "Paiement";
  sheet.getCell(`D${rowIndex}`).font = { bold: true, color: { argb: `FF${accent}` } };
  sheet.mergeCells(`D${rowIndex + 1}:E${rowIndex + 3}`);
  sheet.getCell(`D${rowIndex + 1}`).value = invoice.paymentTerms;
  sheet.getCell(`D${rowIndex + 1}`).alignment = { wrapText: true, vertical: "top" };

  sheet.eachRow((row) => {
    row.height = 22;
    row.eachCell((cell) => {
      cell.alignment = { ...cell.alignment, vertical: "middle" };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const fileName = `${(invoice.invoiceNumber || "facture").replace(/[^\w-]+/g, "-")}.xlsx`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function buildPdf({ invoice, lines, template, totals, branding }) {
  const doc = new jsPDF();
  const color = hexToRgb(branding.primaryColor || template.color);
  doc.setTextColor(color.r, color.g, color.b);
  doc.setFontSize(24);
  doc.text("FACTURE", 18, 24);
  doc.setFontSize(10);
  doc.text(branding.logoText || "FS", 180, 18);

  doc.setTextColor(25, 34, 34);
  doc.setFontSize(11);
  doc.text(invoice.companyName || "Votre entreprise", 18, 42);
  doc.text(splitPdfText(doc, invoice.companyAddress || "", 80), 18, 49);
  doc.text([invoice.companyEmail, invoice.companyPhone].filter(Boolean).join(" | "), 18, 66);

  doc.text(`N° ${invoice.invoiceNumber || "FAC-0000"}`, 140, 42);
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 140, 50);
  doc.text(`Échéance: ${formatDate(invoice.dueDate)}`, 140, 58);

  doc.setTextColor(color.r, color.g, color.b);
  doc.text("Facturé à", 18, 84);
  doc.setTextColor(25, 34, 34);
  doc.text(invoice.clientName || "Client", 18, 92);
  doc.text(splitPdfText(doc, invoice.clientAddress || "", 80), 18, 99);
  doc.text(invoice.clientEmail || "", 18, 116);

  let y = 132;
  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(18, y - 7, 174, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("Description", 22, y);
  doc.text("Qté", 118, y);
  doc.text("Prix", 138, y);
  doc.text("Total", 166, y);
  doc.setTextColor(25, 34, 34);

  y += 12;
  lines.forEach((line) => {
    const amount = (Number(line.quantity) || 0) * (Number(line.price) || 0);
    doc.text(splitPdfText(doc, line.description || "Prestation", 82), 22, y);
    doc.text(String(Number(line.quantity) || 0), 120, y);
    doc.text(formatMoney(line.price, invoice.currency), 138, y);
    doc.text(formatMoney(amount, invoice.currency), 166, y);
    y += 11;
  });

  y += 8;
  doc.text(`Sous-total: ${formatMoney(totals.subtotal, invoice.currency)}`, 124, y);
  y += 8;
  doc.text(`Remise: ${formatMoney(totals.discount, invoice.currency)}`, 124, y);
  y += 8;
  doc.text(`TVA: ${formatMoney(totals.tax, invoice.currency)}`, 124, y);
  y += 10;
  doc.setTextColor(color.r, color.g, color.b);
  doc.setFontSize(14);
  doc.text(`Total TTC: ${formatMoney(totals.total, invoice.currency)}`, 124, y);

  doc.setFontSize(10);
  doc.setTextColor(25, 34, 34);
  doc.text("Notes", 18, 252);
  doc.text(splitPdfText(doc, invoice.notes || "", 80), 18, 259);
  doc.text("Paiement", 118, 252);
  doc.text(splitPdfText(doc, invoice.paymentTerms || "", 72), 118, 259);
  doc.setTextColor(color.r, color.g, color.b);
  doc.text(branding.footerSignature || "", 18, 286);

  doc.save(`${(invoice.invoiceNumber || "facture").replace(/[^\w-]+/g, "-")}.pdf`);
}

function splitPdfText(doc, text, width) {
  return doc.splitTextToSize(String(text || ""), width);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const number = parseInt(normalized, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

createRoot(document.getElementById("root")).render(<App />);
