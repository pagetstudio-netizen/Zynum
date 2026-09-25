import "./_group.css";

const sections = [
  {
    title: "1. Données collectées",
    body: "Nous collectons uniquement les données nécessaires au fonctionnement du service : nom, adresse e-mail, historique des commandes. Aucune donnée de carte bancaire n'est stockée sur nos serveurs.",
  },
  {
    title: "2. Utilisation des données",
    body: "Vos données sont utilisées exclusivement pour fournir le service ZyNum, améliorer l'expérience utilisateur, et vous envoyer des notifications importantes liées à votre compte.",
  },
  {
    title: "3. Partage des données",
    body: "Nous ne vendons, ne louons et ne partageons jamais vos données personnelles avec des tiers à des fins commerciales. Les données peuvent être partagées avec nos prestataires techniques (hébergement, base de données) dans le strict cadre de la fourniture du service.",
  },
  {
    title: "4. Sécurité",
    body: "Vos données sont chiffrées en transit (HTTPS/TLS) et au repos. Les mots de passe sont hachés avec bcrypt. Nous effectuons des audits de sécurité réguliers.",
  },
  {
    title: "5. Durée de conservation",
    body: "Les données de compte sont conservées tant que votre compte est actif. En cas de suppression du compte, vos données personnelles sont supprimées dans un délai de 30 jours, à l'exception des données de transaction conservées pour des raisons légales.",
  },
  {
    title: "6. Vos droits",
    body: "Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous via la page Contact.",
  },
  {
    title: "7. Cookies",
    body: "ZyNum utilise uniquement des cookies techniques nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.",
  },
  {
    title: "8. Contact",
    body: "Pour toute question relative à votre vie privée, contactez notre équipe via la page Contact.",
  },
];

export function Current() {
  return (
    <main className="privacy-current-page">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <header className="mb-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Légal
          </p>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-slate-500">
            Dernière mise à jour : mars 2026
          </p>
        </header>

        <div className="space-y-8 text-[15px] leading-7 text-slate-600">
          {sections.map((section) => (
            <section
              key={section.title}
              className="border-b border-slate-200 pb-6 last:border-0"
            >
              <h2 className="mb-3 text-xl font-bold text-slate-900">
                {section.title}
              </h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}