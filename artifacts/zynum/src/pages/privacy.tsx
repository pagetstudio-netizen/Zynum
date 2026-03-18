import React from "react";

export default function Privacy() {
  return (
    <div className="w-full py-16">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="mb-12">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Légal</p>
          <h1 className="text-4xl font-display font-extrabold text-white mb-3">Politique de Confidentialité</h1>
          <p className="text-muted-foreground">Dernière mise à jour : mars 2026</p>
        </div>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <Section title="1. Données collectées">
            Nous collectons uniquement les données nécessaires au fonctionnement du service : nom, adresse e-mail, historique des commandes. Aucune donnée de carte bancaire n'est stockée sur nos serveurs.
          </Section>

          <Section title="2. Utilisation des données">
            Vos données sont utilisées exclusivement pour fournir le service ZyNum, améliorer l'expérience utilisateur, et vous envoyer des notifications importantes liées à votre compte.
          </Section>

          <Section title="3. Partage des données">
            Nous ne vendons, ne louons et ne partageons jamais vos données personnelles avec des tiers à des fins commerciales. Les données peuvent être partagées avec nos prestataires techniques (hébergement, base de données) dans le strict cadre de la fourniture du service.
          </Section>

          <Section title="4. Sécurité">
            Vos données sont chiffrées en transit (HTTPS/TLS) et au repos. Les mots de passe sont hachés avec bcrypt. Nous effectuons des audits de sécurité réguliers.
          </Section>

          <Section title="5. Durée de conservation">
            Les données de compte sont conservées tant que votre compte est actif. En cas de suppression du compte, vos données personnelles sont supprimées dans un délai de 30 jours, à l'exception des données de transaction conservées pour des raisons légales.
          </Section>

          <Section title="6. Vos droits">
            Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous via la page Contact.
          </Section>

          <Section title="7. Cookies">
            ZyNum utilise uniquement des cookies techniques nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </Section>

          <Section title="8. Contact">
            Pour toute question relative à votre vie privée, contactez notre équipe via la page Contact.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/5 pb-6">
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
