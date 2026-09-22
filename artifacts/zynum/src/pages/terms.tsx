import React from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileText, MessageCircle, ShieldCheck, WalletCards } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

type LegalSection = {
  number: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  tone?: "default" | "refund" | "warning";
};

const legalContent = {
  fr: {
    badge: "Document légal",
    title: "Conditions générales d'utilisation",
    updated: "Dernière mise à jour : 22 septembre 2026",
    intro:
      "Ces conditions encadrent l'utilisation de ZyNum, l'achat de numéros virtuels temporaires et la réception de codes de vérification par SMS. En créant un compte, en créditant votre solde ou en passant une commande, vous reconnaissez les avoir lues et acceptées.",
    notice:
      "Ces conditions sont un document d'information contractuelle pour les utilisateurs de ZyNum. Elles ne remplacent pas l'avis d'un professionnel du droit dans votre pays.",
    sections: [
      {
        number: "1",
        title: "Objet et acceptation",
        paragraphs: [
          "ZyNum fournit une interface permettant de sélectionner un service, un pays, un numéro virtuel temporaire et une période d'utilisation afin de recevoir un ou plusieurs SMS de vérification. Le service est destiné à une utilisation ponctuelle et ne constitue pas une ligne téléphonique permanente.",
          "L'utilisation du site, de l'application, de l'API ou de toute fonctionnalité ZyNum vaut acceptation de ces conditions. Si vous n'acceptez pas une disposition, vous devez cesser d'utiliser le service et ne pas passer de commande.",
        ],
      },
      {
        number: "2",
        title: "Description du service",
        paragraphs: [
          "ZyNum met en relation votre compte avec des fournisseurs techniques de numéros virtuels. La disponibilité, le prix, le pays, le service demandé et les délais peuvent varier en temps réel selon le stock du fournisseur et la demande.",
          "ZyNum ne garantit pas qu'un numéro sera accepté par un service tiers, qu'un compte tiers sera créé, ni qu'un SMS sera envoyé. Les décisions de WhatsApp, Telegram, Google, TikTok, Facebook ou de tout autre service tiers relèvent exclusivement de ces services.",
        ],
        bullets: [
          "Une commande correspond à une session temporaire liée à un service précis.",
          "Un numéro ne doit pas être présenté comme votre numéro personnel, professionnel ou permanent.",
          "Les indications de disponibilité et de délai sont des estimations et peuvent changer avant la confirmation de la commande.",
        ],
      },
      {
        number: "3",
        title: "Compte utilisateur et sécurité",
        paragraphs: [
          "Vous devez fournir des informations exactes et maintenir l'accès à l'adresse e-mail associée à votre compte. Vous êtes responsable de votre mot de passe, de votre jeton de session et de toutes les actions réalisées depuis votre compte.",
          "Vous devez prévenir ZyNum dès que vous constatez un accès non autorisé. ZyNum peut suspendre une session, réinitialiser l'accès ou demander des vérifications supplémentaires lorsqu'une activité présente un risque pour le compte, le service ou un tiers.",
        ],
        bullets: [
          "Un compte est personnel et ne doit pas être vendu, loué ou partagé.",
          "Il est interdit de contourner une suspension ou de créer des comptes destinés à contourner une limite.",
          "Vous devez protéger les codes SMS affichés dans votre espace et ne pas les transmettre à une personne non autorisée.",
        ],
      },
      {
        number: "4",
        title: "Utilisation autorisée et interdite",
        paragraphs: [
          "Vous pouvez utiliser ZyNum uniquement pour une finalité licite, légitime et conforme aux règles du service tiers que vous cherchez à utiliser. Vous êtes seul responsable de la finalité de la vérification demandée.",
          "Il est strictement interdit d'utiliser ZyNum pour la fraude, l'usurpation d'identité, le spam, le phishing, les escroqueries, le harcèlement, la création de faux comptes en masse, le contournement d'une restriction, l'accès non autorisé à un service ou toute activité contraire à la loi.",
        ],
        bullets: [
          "Ne tentez pas de recevoir des codes pour accéder au compte d'une autre personne.",
          "Ne tentez pas de contourner les mécanismes anti-abus ou les limites d'un service tiers.",
          "N'utilisez pas les numéros ZyNum pour envoyer des messages, appeler des tiers ou revendiquer une identité qui ne vous appartient pas.",
          "Toute commande liée à une activité illégale peut être annulée sans préjudice des autres recours disponibles.",
        ],
      },
      {
        number: "5",
        title: "Prix, solde et commandes",
        paragraphs: [
          "Le prix applicable est celui affiché au moment où vous confirmez la commande. Il peut dépendre du pays, du service, de la disponibilité et du fournisseur. La commande est validée uniquement si le solde nécessaire est disponible et si le fournisseur confirme la création de la session.",
          "Une commande confirmée peut rester en attente pendant la recherche du SMS. Vous devez vérifier le service, le pays et le prix avant de confirmer : une erreur de sélection ne constitue pas automatiquement un motif de remboursement.",
          "Les éventuels frais de paiement, de conversion ou de recharge sont affichés par le moyen de paiement concerné. Le solde ZyNum et l'historique des commandes constituent la référence de suivi des crédits et des débits.",
        ],
      },
      {
        number: "6",
        title: "Remboursements et annulation des numéros",
        tone: "refund",
        paragraphs: [
          "La présente section décrit précisément le fonctionnement des remboursements d'une commande de numéro virtuel. Un remboursement n'est pas une décision manuelle automatique : il dépend de l'état local de la commande, de l'absence de SMS et de la confirmation du fournisseur technique.",
          "Lorsqu'un remboursement est validé, le montant de la commande est recrédité sur le solde ZyNum du même compte. Il ne s'agit pas d'un versement en espèces ou d'un remboursement automatique vers une carte, un compte Mobile Money ou un autre moyen de paiement.",
        ],
        bullets: [
          "Annulation possible : la commande est en attente, ou un numéro a été attribué mais aucun code ni contenu SMS n'a été reçu.",
          "Annulation automatique : une commande sans SMS peut être vérifiée et annulée automatiquement après environ 6 minutes, conformément au délai opérationnel du service.",
          "Échec fournisseur : si le prestataire technique signale une commande comme annulée, expirée ou bannie sans SMS reçu, ZyNum tente de confirmer l'annulation puis de recréditer le solde.",
          "Confirmation obligatoire : ZyNum vérifie d'abord l'état de la commande auprès du prestataire technique. Le crédit n'est effectué qu'après confirmation que la commande est effectivement annulée et remboursable.",
          "Montant remboursé : le prix de la commande concernée, selon l'enregistrement de la transaction. Un remboursement est crédité une seule fois.",
        ],
      },
      {
        number: "7",
        title: "Cas dans lesquels aucun remboursement n'est dû",
        tone: "warning",
        paragraphs: [
          "Le remboursement n'est pas dû lorsque la commande a déjà fourni un code ou un contenu SMS, lorsque la commande est terminée, ou lorsque le service tiers a refusé le numéro après réception du SMS. Le fait qu'un compte tiers soit ensuite bloqué, vérifié à nouveau ou refusé ne transforme pas une commande consommée en commande remboursable.",
        ],
        bullets: [
          "Un code SMS, un texte SMS ou toute preuve de livraison a été reçu.",
          "La commande est marquée comme terminée ou a déjà été consommée.",
          "Le numéro a été utilisé pour une tentative qui a abouti à la réception du SMS, même si le compte tiers n'a pas été créé.",
          "L'utilisateur a choisi un mauvais pays, un mauvais service ou une mauvaise option.",
          "La demande concerne une commande déjà annulée et déjà recréditée.",
          "La demande vise un dommage indirect, une perte de compte tiers ou une dépense externe à la commande ZyNum.",
        ],
      },
      {
        number: "8",
        title: "Délai et traitement d'un remboursement",
        paragraphs: [
          "Une vérification auprès du fournisseur peut être nécessaire avant le crédit. Si le réseau, le prestataire technique ou un autre composant ne confirme pas immédiatement l'annulation, la commande peut apparaître comme en cours de remboursement. Le système réessaie automatiquement ; l'absence de crédit instantané ne signifie pas que la demande a été ignorée.",
          "Pendant ce traitement, vous ne devez pas multiplier les demandes d'annulation pour la même commande. Les contrôles techniques empêchent un double crédit et une même commande ne peut être remboursée qu'une seule fois.",
          "Si le statut reste bloqué après le délai raisonnable indiqué dans l'espace de commande, contactez le support en indiquant l'identifiant de commande, l'adresse e-mail du compte et une description du problème. Ne transmettez jamais votre mot de passe.",
        ],
      },
      {
        number: "9",
        title: "Disponibilité, maintenance et fournisseurs",
        paragraphs: [
          "ZyNum dépend de fournisseurs de numéros, de réseaux mobiles, de services tiers, d'hébergeurs et de connexions internet. Une panne, une rupture de stock, une limitation ou une modification d'un service tiers peut empêcher la réception d'un SMS ou retarder le traitement d'une commande.",
          "ZyNum peut suspendre temporairement une fonctionnalité pour maintenance, sécurité, mise à jour ou vérification fournisseur. Nous faisons des efforts raisonnables pour rétablir le service, sans garantir une disponibilité permanente ni un délai fixe pour les systèmes externes.",
        ],
      },
      {
        number: "10",
        title: "Suspension et résiliation",
        paragraphs: [
          "ZyNum peut suspendre ou fermer un compte en cas de violation de ces conditions, d'utilisation abusive, de fraude présumée, de risque de sécurité, de demande légale ou d'activité susceptible de nuire au service ou à un tiers.",
          "La suspension ne supprime pas les obligations nées avant celle-ci. Les commandes déjà consommées restent soumises aux règles de remboursement ci-dessus. Lorsqu'une vérification est nécessaire, ZyNum peut conserver temporairement les informations utiles à la sécurité, à la prévention de la fraude et au respect de ses obligations.",
        ],
      },
      {
        number: "11",
        title: "Responsabilité et limites",
        paragraphs: [
          "ZyNum fournit un service de moyens techniques et ne contrôle pas le contenu, les décisions, les règles ou la disponibilité des plateformes tierces. Vous restez responsable de vos comptes tiers, de vos démarches et de la conformité de votre utilisation.",
          "Dans la mesure permise par la loi applicable, ZyNum ne répond pas des dommages indirects, pertes de données externes, pertes de compte tiers, manque à gagner, interruption d'activité ou décisions prises par un service tiers. La responsabilité directe éventuelle de ZyNum est limitée au montant de la commande concernée, sauf disposition légale impérative contraire.",
        ],
      },
      {
        number: "12",
        title: "Propriété intellectuelle",
        paragraphs: [
          "Les éléments ZyNum — marque, interface, textes, visuels, code, organisation et contenus — restent protégés par les droits applicables. Aucun droit de reproduction, de revente, de copie ou d'exploitation commerciale n'est accordé en dehors de l'utilisation normale du service.",
          "Vous conservez les droits sur les informations que vous fournissez, sous réserve de la licence nécessaire à ZyNum pour exploiter, sécuriser et améliorer le service conformément à sa politique de confidentialité.",
        ],
      },
      {
        number: "13",
        title: "Modifications des conditions",
        paragraphs: [
          "ZyNum peut modifier ces conditions pour tenir compte d'une évolution du service, d'un fournisseur, de la sécurité ou de la réglementation. La date de mise à jour est indiquée en haut de cette page. Les modifications importantes peuvent être signalées dans l'application ou par e-mail.",
          "La poursuite de l'utilisation après la publication d'une nouvelle version vaut acceptation des conditions modifiées. Si vous refusez une modification, vous devez cesser d'utiliser le service et contacter ZyNum pour toute question sur les opérations déjà en cours.",
        ],
      },
      {
        number: "14",
        title: "Contact et résolution des réclamations",
        paragraphs: [
          "Pour une question sur une commande, un remboursement ou votre compte, utilisez le centre d'aide ou la page Contact. Pour accélérer le traitement, indiquez l'identifiant de commande, la date approximative, le service sélectionné et l'adresse e-mail du compte.",
          "Le support client WhatsApp est disponible au +228 92299772. Ne communiquez jamais votre mot de passe, votre code de connexion ou un secret de sécurité dans une demande de support.",
          "Avant toute procédure formelle, les parties s'efforcent de résoudre la réclamation à l'amiable. Les règles impératives de protection des consommateurs et les droits qui ne peuvent pas être exclus par contrat restent applicables.",
        ],
      },
    ] satisfies LegalSection[],
  },
  en: {
    badge: "Legal document",
    title: "Terms of Service",
    updated: "Last updated: September 22, 2026",
    intro:
      "These terms govern the use of ZyNum, the purchase of temporary virtual numbers, and the receipt of verification codes by SMS. By creating an account, adding funds, or placing an order, you acknowledge that you have read and accepted them.",
    notice:
      "These terms are a public contractual information document for ZyNum users. They do not replace advice from a qualified lawyer in your country.",
    sections: [
      {
        number: "1",
        title: "Purpose and acceptance",
        paragraphs: [
          "ZyNum provides an interface to select a service, country, temporary virtual number, and usage session for receiving one or more verification SMS messages. The service is intended for one-time use and is not a permanent phone line.",
          "Using the website, application, API, or any ZyNum feature means that you accept these terms. If you do not accept a provision, you must stop using the service and must not place an order.",
        ],
      },
      {
        number: "2",
        title: "Service description",
        paragraphs: [
          "ZyNum connects your account to technical virtual-number providers. Availability, price, country, requested service, and delivery time may change in real time based on provider inventory and demand.",
          "ZyNum does not guarantee that a number will be accepted by a third-party service, that a third-party account will be created, or that an SMS will be sent. Decisions made by WhatsApp, Telegram, Google, TikTok, Facebook, or any other third party are controlled solely by that service.",
        ],
        bullets: [
          "An order is a temporary session tied to a specific service.",
          "A number must not be presented as your personal, business, or permanent number.",
          "Availability and timing shown before purchase are estimates and may change before confirmation.",
        ],
      },
      {
        number: "3",
        title: "Account and security",
        paragraphs: [
          "You must provide accurate information and keep access to the email address linked to your account. You are responsible for your password, session token, and every action taken from your account.",
          "Notify ZyNum as soon as you notice unauthorized access. ZyNum may suspend a session, reset access, or request additional verification when activity creates a risk to the account, service, or another person.",
        ],
        bullets: [
          "An account is personal and must not be sold, rented, or shared.",
          "You may not bypass a suspension or create accounts to evade a limit.",
          "Protect SMS codes shown in your account and do not share them with unauthorized people.",
        ],
      },
      {
        number: "4",
        title: "Permitted and prohibited use",
        paragraphs: [
          "You may use ZyNum only for a lawful, legitimate purpose that follows the rules of the third-party service you are trying to use. You are solely responsible for the purpose of the requested verification.",
          "You may not use ZyNum for fraud, impersonation, spam, phishing, scams, harassment, mass fake-account creation, restriction bypassing, unauthorized access, or any activity that violates applicable law.",
        ],
        bullets: [
          "Do not request codes to access another person's account.",
          "Do not bypass anti-abuse controls or limits imposed by a third-party service.",
          "Do not use ZyNum numbers to message or call people, or to claim an identity that is not yours.",
          "An order connected to illegal activity may be canceled without limiting any other available remedy.",
        ],
      },
      {
        number: "5",
        title: "Prices, balance, and orders",
        paragraphs: [
          "The applicable price is the price displayed when you confirm the order. It may depend on country, service, availability, and provider. An order is validated only if the required balance is available and the provider confirms the session.",
          "A confirmed order may remain pending while the SMS is being searched for. Check the service, country, and price before confirming: a selection error is not automatically a refund reason.",
          "Any payment, conversion, or top-up fees are shown by the relevant payment method. Your ZyNum balance and order history are the reference for credits and debits.",
        ],
      },
      {
        number: "6",
        title: "Refunds and number cancellation",
        tone: "refund",
        paragraphs: [
          "This section explains how refunds for virtual-number orders work. A refund is not an automatic manual decision: it depends on the local order status, the absence of an SMS, and confirmation from the technical provider.",
          "When approved, the order amount is credited back to the ZyNum balance of the same account. It is not a cash payment or an automatic refund to a card, Mobile Money account, or another payment method.",
        ],
        bullets: [
          "Eligible cancellation: the order is pending, or a number was assigned but no SMS code or SMS content was received.",
          "Automatic cancellation: an order with no SMS may be checked and canceled automatically after approximately 6 minutes under the service's operational timeout.",
          "Provider failure: if the technical provider marks an order canceled, timed out, or banned without an SMS, ZyNum attempts to confirm the cancellation and credit the balance.",
          "Confirmation required: ZyNum checks the order status with the technical provider first. Credit is made only after the order is confirmed canceled and refundable.",
          "Refund amount: the price recorded for that order. A single order can be credited only once.",
        ],
      },
      {
        number: "7",
        title: "When no refund is owed",
        tone: "warning",
        paragraphs: [
          "A refund is not owed when the order has already delivered a code or SMS content, when the order is finished, or when a third-party service rejected the number after the SMS was received. A later block, re-verification, or rejection by a third-party service does not turn a consumed order into a refundable order.",
        ],
        bullets: [
          "An SMS code, SMS text, or other evidence of delivery was received.",
          "The order is marked finished or has already been consumed.",
          "The number was used in an attempt that received the SMS, even if the third-party account was not created.",
          "The user selected the wrong country, service, or option.",
          "The request concerns an order that was already canceled and credited.",
          "The request concerns indirect damage, loss of a third-party account, or an expense outside the ZyNum order.",
        ],
      },
      {
        number: "8",
        title: "Refund timing and processing",
        paragraphs: [
          "A provider check may be required before the credit is made. If the network, technical provider, or another component does not immediately confirm the cancellation, the order may show as refund in progress. The system retries automatically; an immediate credit is not guaranteed and does not mean the request was ignored.",
          "During this process, do not submit repeated cancellation requests for the same order. Technical safeguards prevent duplicate credits, and each order can be refunded only once.",
          "If the status remains blocked after the reasonable period shown in the order area, contact support with the order ID, account email, and a description of the issue. Never send your password.",
        ],
      },
      {
        number: "9",
        title: "Availability, maintenance, and providers",
        paragraphs: [
          "ZyNum depends on number providers, mobile networks, third-party services, hosting providers, and internet connections. An outage, inventory shortage, restriction, or change in a third-party service may prevent an SMS or delay an order.",
          "ZyNum may temporarily suspend a feature for maintenance, security, updates, or provider checks. We make reasonable efforts to restore service but do not guarantee permanent availability or a fixed timeframe for external systems.",
        ],
      },
      {
        number: "10",
        title: "Suspension and termination",
        paragraphs: [
          "ZyNum may suspend or close an account for a breach of these terms, abuse, suspected fraud, security risk, legal request, or activity likely to harm the service or another person.",
          "Suspension does not remove obligations that arose before it. Consumed orders remain subject to the refund rules above. When a review is necessary, ZyNum may temporarily retain information needed for security, fraud prevention, and legal compliance.",
        ],
      },
      {
        number: "11",
        title: "Liability and limitations",
        paragraphs: [
          "ZyNum provides technical tools and does not control the content, decisions, rules, or availability of third-party platforms. You remain responsible for third-party accounts, your actions, and compliance with applicable requirements.",
          "To the extent permitted by applicable law, ZyNum is not responsible for indirect damage, loss of external data, loss of a third-party account, lost profits, business interruption, or third-party decisions. Any direct liability is limited to the amount paid for the relevant order, except where mandatory law provides otherwise.",
        ],
      },
      {
        number: "12",
        title: "Intellectual property",
        paragraphs: [
          "ZyNum elements — brand, interface, text, visuals, code, structure, and content — remain protected by applicable rights. No reproduction, resale, copying, or commercial exploitation right is granted beyond normal use of the service.",
          "You retain rights to information you provide, subject to the license ZyNum needs to operate, secure, and improve the service in accordance with its privacy policy.",
        ],
      },
      {
        number: "13",
        title: "Changes to these terms",
        paragraphs: [
          "ZyNum may change these terms to reflect service, provider, security, or regulatory changes. The update date is shown at the top of this page. Important changes may be announced in the application or by email.",
          "Continuing to use the service after a new version is published means that you accept the amended terms. If you reject a change, stop using the service and contact ZyNum about operations already in progress.",
        ],
      },
      {
        number: "14",
        title: "Contact and complaints",
        paragraphs: [
          "For a question about an order, refund, or account, use the help center or Contact page. To speed up review, include the order ID, approximate date, selected service, and account email.",
          "Customer support is available on WhatsApp at +228 92299772. Never share your password, login code, or security secret in a support request.",
          "Before formal proceedings, the parties will make reasonable efforts to resolve a complaint amicably. Mandatory consumer protections and rights that cannot be excluded by contract remain applicable.",
        ],
      },
    ] satisfies LegalSection[],
  },
} as const;

function Section({ section }: { section: LegalSection }) {
  const toneClass =
    section.tone === "refund"
      ? "border-[#f97316]/30 bg-[#fff8f0]"
      : section.tone === "warning"
        ? "border-amber-200 bg-amber-50/70"
        : "border-gray-200 bg-white";

  return (
    <section className={`rounded-2xl border p-5 shadow-sm md:p-7 ${toneClass}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {section.number}
        </span>
        <h2 className="pt-1 text-xl font-bold text-gray-900">{section.title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-7 text-gray-600">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {section.bullets && (
        <ul className="mt-5 space-y-3 border-t border-gray-200/80 pt-5">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Terms() {
  const { lang } = useLanguage();
  const content = legalContent[lang];
  const isFrench = lang === "fr";

  return (
    <div className="w-full bg-[#f7f9fc] py-16">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-10 rounded-3xl bg-gradient-to-br from-[#101827] via-[#17243a] to-[#243b5c] p-7 text-white shadow-xl md:p-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{content.badge}</p>
          <h1 className="mb-4 text-3xl font-display font-extrabold md:text-5xl">{content.title}</h1>
          <p className="mb-5 max-w-3xl text-sm leading-7 text-slate-300">{content.intro}</p>
          <p className="text-xs font-medium text-slate-400">{content.updated}</p>
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <ShieldCheck className="mb-3 h-6 w-6 text-primary" />
            <h2 className="mb-1 text-sm font-bold text-gray-900">{isFrench ? "Usage responsable" : "Responsible use"}</h2>
            <p className="text-xs leading-5 text-gray-500">{isFrench ? "Utilisez ZyNum uniquement dans un cadre légal et autorisé." : "Use ZyNum only for lawful and authorized purposes."}</p>
          </div>
          <div className="rounded-2xl border border-[#f97316]/20 bg-[#fff8f0] p-5 shadow-sm">
            <WalletCards className="mb-3 h-6 w-6 text-[#f97316]" />
            <h2 className="mb-1 text-sm font-bold text-gray-900">{isFrench ? "Remboursement encadré" : "Refund rules"}</h2>
            <p className="text-xs leading-5 text-gray-500">{isFrench ? "Un crédit est possible si aucun SMS n'a été reçu et si le fournisseur confirme l'annulation." : "Credit is possible when no SMS was received and the provider confirms cancellation."}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <Clock3 className="mb-3 h-6 w-6 text-primary" />
            <h2 className="mb-1 text-sm font-bold text-gray-900">{isFrench ? "Délai opérationnel" : "Operational timeout"}</h2>
            <p className="text-xs leading-5 text-gray-500">{isFrench ? "Une commande sans SMS peut être vérifiée après environ 6 minutes." : "An order without an SMS may be checked after approximately 6 minutes."}</p>
          </div>
        </div>

        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p>{content.notice}</p>
        </div>

        <div className="space-y-5">
          {content.sections.map((section) => (
            <Section key={section.number} section={section} />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-[#25D366]/25 bg-[#f2fff7] p-6 sm:flex-row sm:items-center">
          <MessageCircle className="h-7 w-7 shrink-0 text-[#25D366]" />
          <div>
            <h2 className="font-bold text-gray-900">{isFrench ? "Besoin d'une clarification ?" : "Need clarification?"}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {isFrench ? "Contactez le support client sur WhatsApp au +228 92299772." : "Contact customer support on WhatsApp at +228 92299772."}
            </p>
          </div>
          <a
            href="https://wa.me/22892299772"
            target="_blank"
            rel="noreferrer"
            className="sm:ml-auto inline-flex shrink-0 items-center rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1da851]"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}