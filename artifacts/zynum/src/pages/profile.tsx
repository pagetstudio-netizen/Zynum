import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  Check, Copy, Eye, EyeOff, Globe2, Lock, RotateCw, User, Webhook,
} from "lucide-react";
import iconCustomerSupport from "@assets/mine-mod-cs-DtBQ0Sp0_1790066990139.png";
import iconChangePassword from "@assets/mine-mod-change-pwd-D4tL_Aft_1790066990157.png";
import iconAboutAccount from "@assets/mine-mod-aboutus-xnaBhqOq_1790066990174.png";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  WHATSAPP_SUPPORT_NUMBER,
  openWhatsAppSupport,
} from "@/hooks/use-public-settings";
import "./profile-reference.css";

type ProfileUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="profile-reference-password-wrap">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="profile-reference-password-input"
      />
      <button
        type="button"
        onClick={() => setShow((current) => !current)}
        className="profile-reference-password-toggle"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {show ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

export default function ProfilePage({ user }: { user: ProfileUser }) {
  const { toast } = useToast();
  const { lang, setLang, t } = useLanguage();
  const [profileTab, setProfileTab] = useState<"personal" | "security" | "developer">("personal");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookError, setWebhookError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [rotatingApiKey, setRotatingApiKey] = useState(false);

  const developerCopy = lang === "fr" ? {
    tab: "Développeur",
    title: "Intégration développeur",
    subtitle: "Configurez le webhook de votre compte et gérez votre clé API unique.",
    apiKey: "Clé API du compte",
    keyHelp: "Cette clé authentifie vos appels API et sert à vérifier la signature des webhooks. Ne la partagez jamais.",
    showKey: "Afficher la clé API",
    hideKey: "Masquer la clé API",
    copyKey: "Copier la clé API",
    keyCopied: "Clé API copiée",
    rotate: "Renouveler la clé",
    rotateConfirm: "Renouveler la clé API invalidera immédiatement l’ancienne et les signatures de webhook utiliseront la nouvelle. Continuer ?",
    webhook: "Webhook sortant",
    webhookHelp: "Recevez les événements de commande sur une URL HTTPS publique. Le code et le texte du SMS peuvent être présents dans order.",
    endpoint: "URL de réception",
    save: "Enregistrer l’URL",
    disable: "Désactiver",
    events: "Événements envoyés",
    created: "Nouvelle commande créée",
    updated: "Statut ou données SMS modifiés",
    signature: "Chaque requête inclut X-ZyNum-Event, X-ZyNum-Delivery et X-ZyNum-Signature. Vérifiez le HMAC-SHA256 du corps brut avec votre clé API.",
    retry: "Livraison persistante : reprise automatique avec délai progressif, jusqu’à 12 tentatives. Répondez avec un statut HTTP 2xx pour confirmer la réception.",
    docs: "Voir le contrat webhook dans la documentation API",
    loading: "Chargement des paramètres développeur…",
    saveSuccess: "Configuration webhook enregistrée.",
    rotateSuccess: "La clé API a été renouvelée.",
    requestError: "Impossible de charger les paramètres développeur.",
  } : {
    tab: "Developer",
    title: "Developer integration",
    subtitle: "Configure this account’s webhook and manage its single API key.",
    apiKey: "Account API key",
    keyHelp: "This key authenticates API requests and verifies webhook signatures. Never share it.",
    showKey: "Show API key",
    hideKey: "Hide API key",
    copyKey: "Copy API key",
    keyCopied: "API key copied",
    rotate: "Rotate key",
    rotateConfirm: "Rotating the API key immediately invalidates the old key, and webhook signatures will use the new one. Continue?",
    webhook: "Outgoing webhook",
    webhookHelp: "Receive order events at a public HTTPS URL. The SMS code and text may be included in order.",
    endpoint: "Destination URL",
    save: "Save URL",
    disable: "Disable",
    events: "Events sent",
    created: "A new order is created",
    updated: "Order status or SMS data changes",
    signature: "Each request includes X-ZyNum-Event, X-ZyNum-Delivery, and X-ZyNum-Signature. Verify the HMAC-SHA256 of the raw body with your API key.",
    retry: "Persistent delivery with automatic backoff for up to 12 attempts. Reply with an HTTP 2xx status to acknowledge receipt.",
    docs: "Read the webhook contract in the API docs",
    loading: "Loading developer settings…",
    saveSuccess: "Webhook settings saved.",
    rotateSuccess: "API key rotated.",
    requestError: "Could not load developer settings.",
  };

  useEffect(() => {
    if (profileTab !== "developer") return;
    let active = true;
    setWebhookLoading(true);
    setWebhookError("");
    const token = localStorage.getItem("zynum_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch("/api/v1/developer/webhook", { headers }),
      fetch("/api/v1/developer/apikey", { headers }),
    ])
      .then(async ([webhookResponse, keyResponse]) => {
        const webhookData = await webhookResponse.json();
        const keyData = await keyResponse.json();
        if (!webhookResponse.ok || !keyResponse.ok) {
          throw new Error(webhookData.message ?? keyData.message ?? developerCopy.requestError);
        }
        if (!active) return;
        setWebhookUrl(webhookData.webhookUrl ?? "");
        setWebhookInput(webhookData.webhookUrl ?? "");
        setApiKey(keyData.apiKey);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setWebhookError(error instanceof Error ? error.message : developerCopy.requestError);
      })
      .finally(() => {
        if (active) setWebhookLoading(false);
      });

    return () => { active = false; };
  }, [profileTab, developerCopy.requestError]);

  const handleWebhookSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setWebhookSaving(true);
    setWebhookError("");
    try {
      const token = localStorage.getItem("zynum_token");
      const response = await fetch("/api/v1/developer/webhook", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: webhookInput.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? developerCopy.requestError);
      setWebhookUrl(data.webhookUrl ?? "");
      setWebhookInput(data.webhookUrl ?? "");
      toast({ title: developerCopy.saveSuccess });
    } catch (error) {
      setWebhookError(error instanceof Error ? error.message : developerCopy.requestError);
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleWebhookDisable = async () => {
    setWebhookSaving(true);
    setWebhookError("");
    try {
      const token = localStorage.getItem("zynum_token");
      const response = await fetch("/api/v1/developer/webhook", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? developerCopy.requestError);
      setWebhookUrl("");
      setWebhookInput("");
      toast({ title: developerCopy.saveSuccess });
    } catch (error) {
      setWebhookError(error instanceof Error ? error.message : developerCopy.requestError);
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleApiKeyRotate = async () => {
    if (!window.confirm(developerCopy.rotateConfirm)) return;
    setRotatingApiKey(true);
    try {
      const token = localStorage.getItem("zynum_token");
      const response = await fetch("/api/v1/developer/apikey", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? developerCopy.requestError);
      setApiKey(data.apiKey);
      setShowApiKey(false);
      toast({ title: developerCopy.rotateSuccess });
    } catch (error) {
      setWebhookError(error instanceof Error ? error.message : developerCopy.requestError);
    } finally {
      setRotatingApiKey(false);
    }
  };

  const handleApiKeyCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast({ title: developerCopy.keyCopied });
    } catch {
      setWebhookError(lang === "fr" ? "Impossible de copier la clé dans le presse-papiers." : "Could not copy the key to the clipboard.");
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPwd.length < 8) {
      toast({
        variant: "destructive",
        title: "Mot de passe trop court",
        description: "Au moins 8 caractères requis.",
      });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({
        variant: "destructive",
        title: "Mots de passe différents",
        description: "Le nouveau mot de passe et la confirmation ne correspondent pas.",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("zynum_token");
      const response = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erreur inconnue");

      setSuccess(true);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast({
        title: "Mot de passe modifié !",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Échec",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = Math.min(
    4,
    Math.floor(
      (newPwd.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(newPwd) ? 1 : 0) +
      (/[0-9]/.test(newPwd) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(newPwd) ? 1 : 0),
    ),
  );

  return (
    <div className="profile-reference">
      <div className="profile-reference-heading">
        <h2>Mon Profil</h2>
        <p>{t("profile_sub")}</p>
      </div>

      <div className="profile-reference-avatar-wrap">
        <div className="profile-reference-avatar">
          <User />
        </div>
        <span className="profile-reference-avatar-edit" aria-hidden="true">✎</span>
      </div>

      <div className="profile-reference-tabs" role="tablist" aria-label="Paramètres du profil">
        <button
          type="button"
          role="tab"
          aria-selected={profileTab === "personal"}
          className={profileTab === "personal" ? "is-active" : ""}
          onClick={() => setProfileTab("personal")}
        >
          Informations personnelles
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={profileTab === "security"}
          className={profileTab === "security" ? "is-active" : ""}
          onClick={() => setProfileTab("security")}
        >
          Sécurité
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={profileTab === "developer"}
          className={profileTab === "developer" ? "is-active" : ""}
          onClick={() => setProfileTab("developer")}
          data-testid="tab-profile-developer"
        >
          {developerCopy.tab}
        </button>
      </div>

      {profileTab === "personal" ? (
        <div className="profile-reference-tab-content" role="tabpanel">
          <div className="profile-reference-fields">
            <div className="profile-reference-field">
              <label htmlFor="profile-name">{t("profile_full_name")}</label>
              <div id="profile-name" className="profile-reference-readonly">{user.name}</div>
            </div>
            <div className="profile-reference-field">
              <label htmlFor="profile-email">{t("profile_email")}</label>
              <div id="profile-email" className="profile-reference-readonly">{user.email}</div>
            </div>
            <div className="profile-reference-field">
              <label htmlFor="profile-member-since">{t("profile_member_since")}</label>
              <div id="profile-member-since" className="profile-reference-readonly">
                {format(new Date(user.createdAt), "MMMM yyyy")}
              </div>
            </div>
          </div>

          <div className="profile-reference-subcard">
            <div className="profile-reference-subcard-heading">
              <Globe2 />
              <div>
                <h3>{t("profile_language")}</h3>
                <p>{t("profile_language_sub")}</p>
              </div>
            </div>
            <div className="profile-reference-language-list">
              {(["fr", "en"] as const).map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setLang(language)}
                  className={lang === language ? "is-active" : ""}
                >
                  {language === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : profileTab === "security" ? (
        <div className="profile-reference-tab-content" role="tabpanel">
          <section className="profile-reference-security-card">
            <div className="profile-reference-section-heading">
              <div className="profile-reference-section-icon">
                <img
                  src={iconChangePassword}
                  alt=""
                  aria-hidden="true"
                  className="profile-reference-asset-icon"
                />
              </div>
              <div>
                <h3>{t("profile_change_pwd")}</h3>
                <p>{t("profile_change_pwd_sub")}</p>
              </div>
            </div>

            {success && (
              <div className="profile-reference-success">
                <Check />
                {t("profile_pwd_updated")}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="profile-reference-password-form">
              <div className="profile-reference-field">
                <label htmlFor="current-password">{t("profile_current_pwd")}</label>
                <PasswordInput value={currentPwd} onChange={setCurrentPwd} placeholder="••••••••" />
              </div>
              <div className="profile-reference-field">
                <label htmlFor="new-password">{t("profile_new_pwd")}</label>
                <PasswordInput value={newPwd} onChange={setNewPwd} placeholder={t("profile_min_chars")} />
              </div>
              <div className="profile-reference-field">
                <label htmlFor="confirm-password">{t("profile_confirm_pwd")}</label>
                <PasswordInput value={confirmPwd} onChange={setConfirmPwd} placeholder={t("profile_repeat_pwd")} />
              </div>

              {newPwd.length > 0 && (
                <div className="profile-reference-strength">
                  <div className="profile-reference-strength-bars">
                    {[...Array(4)].map((_, index) => (
                      <span
                        key={index}
                        className={index < passwordStrength ? `strength-${passwordStrength}` : ""}
                      />
                    ))}
                  </div>
                  <p>
                    {newPwd.length < 8 ? t("profile_pwd_short") :
                     !/[A-Z]/.test(newPwd) ? t("profile_pwd_uppercase") :
                     !/[0-9]/.test(newPwd) ? t("profile_pwd_number") :
                     t("profile_pwd_strong")}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !currentPwd || !newPwd || !confirmPwd}
                className="profile-reference-submit"
              >
                {loading ? (
                  <span><span className="profile-reference-spinner" /> {t("profile_updating")}</span>
                ) : (
                  <span><Lock /> {t("profile_update_pwd")}</span>
                )}
              </Button>
            </form>
          </section>

          <div className="profile-reference-security-status">
            <img
              src={iconAboutAccount}
              alt=""
              aria-hidden="true"
              className="profile-reference-asset-icon profile-reference-status-icon"
            />
            <div>
              <strong>{t("profile_secure")}</strong>
              <p>{t("profile_secure_desc")}</p>
            </div>
            <span><Check /> {t("profile_active")}</span>
          </div>
        </div>
      ) : (
        <div className="profile-reference-tab-content" role="tabpanel" data-testid="panel-profile-developer">
          {webhookLoading ? (
            <p className="profile-reference-developer-loading">{developerCopy.loading}</p>
          ) : (
            <>
              <div className="profile-reference-developer-heading">
                <div>
                  <h3>{developerCopy.title}</h3>
                  <p>{developerCopy.subtitle}</p>
                </div>
                <Webhook aria-hidden="true" />
              </div>

              {webhookError && <p className="profile-reference-developer-error" role="alert" data-testid="status-developer-error">{webhookError}</p>}

              <section className="profile-reference-developer-card">
                <h4>{developerCopy.apiKey}</h4>
                <div className="profile-reference-api-key">
                  <code data-testid="text-developer-api-key">
                    {showApiKey ? apiKey : `${apiKey.slice(0, 4)}${"•".repeat(24)}${apiKey.slice(-4)}`}
                  </code>
                  <button type="button" aria-label={showApiKey ? developerCopy.hideKey : developerCopy.showKey} onClick={() => setShowApiKey((value) => !value)} data-testid="button-toggle-api-key">
                    {showApiKey ? <EyeOff /> : <Eye />}
                  </button>
                  <button type="button" aria-label={developerCopy.copyKey} onClick={handleApiKeyCopy} data-testid="button-copy-api-key">
                    <Copy />
                  </button>
                </div>
                <p>{developerCopy.keyHelp}</p>
                <button type="button" className="profile-reference-developer-secondary" onClick={handleApiKeyRotate} disabled={rotatingApiKey} data-testid="button-rotate-api-key">
                  <RotateCw aria-hidden="true" /> {rotatingApiKey ? "…" : developerCopy.rotate}
                </button>
              </section>

              <section className="profile-reference-developer-card">
                <h4>{developerCopy.webhook}</h4>
                <p>{developerCopy.webhookHelp}</p>
                <form onSubmit={handleWebhookSave} className="profile-reference-developer-form">
                  <label htmlFor="developer-webhook-url">{developerCopy.endpoint}</label>
                  <input
                    id="developer-webhook-url"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://example.com/webhooks/zynum"
                    value={webhookInput}
                    onChange={(event) => setWebhookInput(event.target.value)}
                    data-testid="input-developer-webhook-url"
                  />
                  <div className="profile-reference-developer-actions">
                    <button type="submit" disabled={webhookSaving} data-testid="button-save-webhook">
                      {webhookSaving ? "…" : developerCopy.save}
                    </button>
                    {webhookUrl && (
                      <button type="button" className="is-secondary" disabled={webhookSaving} onClick={handleWebhookDisable} data-testid="button-disable-webhook">
                        {developerCopy.disable}
                      </button>
                    )}
                  </div>
                </form>
                <div className="profile-reference-webhook-details">
                  <strong>{developerCopy.events}</strong>
                  <ul>
                    <li><code>order.created</code> — {developerCopy.created}</li>
                    <li><code>order.updated</code> — {developerCopy.updated}</li>
                  </ul>
                  <p>{developerCopy.signature}</p>
                  <p>{developerCopy.retry}</p>
                </div>
                <a className="profile-reference-docs-link" href="/api-docs#webhooks" data-testid="link-developer-webhook-docs">{developerCopy.docs}</a>
              </section>
            </>
          )}
        </div>
      )}

      <div className="profile-reference-help">
        <div>
          <img
            src={iconCustomerSupport}
            alt=""
            aria-hidden="true"
            className="profile-reference-asset-icon profile-reference-help-icon"
          />
          <div>
            <h3>{t("profile_need_help")}</h3>
            <p>{t("profile_help_desc")}</p>
          </div>
        </div>
        <div className="profile-reference-help-actions">
          <Link href="/aide" className="profile-reference-link-button">
            {t("profile_help_center")}
          </Link>
          <Button
            className="profile-reference-whatsapp"
            onClick={() => openWhatsAppSupport(WHATSAPP_SUPPORT_NUMBER)}
          >
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}