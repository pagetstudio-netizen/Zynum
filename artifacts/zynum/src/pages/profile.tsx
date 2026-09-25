import React, { useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  Check, Eye, EyeOff, Globe2, Lock, User,
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
  const [profileTab, setProfileTab] = useState<"personal" | "security">("personal");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
                <a className="profile-reference-docs-link" href={`${DEVELOPER_DOCS_URL}#webhooks`} data-testid="link-developer-webhook-docs">{developerCopy.docs}</a>
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