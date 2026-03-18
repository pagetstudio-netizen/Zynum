import React from "react";

export default function Terms() {
  return (
    <div className="w-full py-16">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="mb-12">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Légal</p>
          <h1 className="text-4xl font-display font-extrabold text-white mb-3">Conditions Générales d'Utilisation</h1>
          <p className="text-muted-foreground">Dernière mise à jour : mars 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <Section title="1. Acceptation des conditions">
            En utilisant ZyNum, vous acceptez les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
          </Section>

          <Section title="2. Description du service">
            ZyNum est une plateforme permettant l'achat de numéros de téléphone virtuels temporaires pour la réception de codes OTP (One-Time Password) par SMS. Le service est fourni via l'infrastructure 5SIM.
          </Section>

          <Section title="3. Utilisation autorisée">
            Vous vous engagez à utiliser ZyNum uniquement à des fins légales. Il est strictement interdit d'utiliser nos services pour des activités frauduleuses, du spam, des arnaques, ou toute activité illégale selon les lois de votre pays.
          </Section>

          <Section title="4. Compte utilisateur">
            Vous êtes responsable de la sécurité de vos identifiants de connexion. Toute activité effectuée depuis votre compte est de votre responsabilité. Signalez immédiatement tout accès non autorisé à notre équipe.
          </Section>

          <Section title="5. Paiements et remboursements">
            Les achats de numéros virtuels sont en principe non remboursables une fois le SMS reçu. Un remboursement automatique est effectué si le numéro n'a pas reçu de SMS et que vous annulez la commande dans les délais impartis (environ 20 minutes).
          </Section>

          <Section title="6. Disponibilité du service">
            ZyNum s'efforce de maintenir une disponibilité de 99.9% mais ne peut garantir un service ininterrompu. Des maintenances peuvent être effectuées avec notification préalable.
          </Section>

          <Section title="7. Limitation de responsabilité">
            ZyNum ne saurait être tenu responsable des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service. Notre responsabilité totale ne peut excéder le montant payé pour la transaction concernée.
          </Section>

          <Section title="8. Modifications">
            ZyNum se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront notifiés par email des changements majeurs. La continuation de l'utilisation du service vaut acceptation des nouvelles conditions.
          </Section>

          <Section title="9. Droit applicable">
            Ces conditions sont régies par le droit applicable dans votre juridiction. Pour tout litige, les parties rechercheront d'abord une résolution amiable.
          </Section>

          <Section title="10. Contact">
            Pour toute question relative à ces conditions, contactez-nous via la page Contact ou à l'adresse email disponible dans votre profil.
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
