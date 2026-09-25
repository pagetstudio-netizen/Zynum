export type PrivacyBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export interface PrivacySectionCopy {
  id: string;
  title: string;
  blocks: PrivacyBlock[];
}

export interface PrivacyPolicyCopy {
  badge: string;
  title: string;
  updated: string;
  introduction: string;
  disclaimerTitle: string;
  disclaimer: string;
  indexLabel: string;
  sections: PrivacySectionCopy[];
  contactLabel: string;
  contactAction: string;
  contactNumber: string;
}

export const privacyPolicyContent: Record<"fr" | "en", PrivacyPolicyCopy> = {
  fr: {
    badge: "INFORMATIONS JURIDIQUES",
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 25 septembre 2026",
    introduction:
      "Cette politique décrit les données personnelles traitées lorsque vous utilisez ZyNum, notamment son application, son site, son API et les fonctions d’assistance. Elle explique quelles données sont concernées, pourquoi elles sont utilisées, à qui elles peuvent être transmises et comment nous contacter.",
    disclaimerTitle: "Information générale",
    disclaimer:
      "Ce document décrit les pratiques de confidentialité de ZyNum et ne constitue pas un avis juridique. Les droits et obligations applicables peuvent varier selon votre pays.",
    indexLabel: "Dans cette politique",
    contactLabel: "Une question sur vos données ?",
    contactAction: "Contacter ZyNum sur WhatsApp",
    contactNumber: "+228 92299772",
    sections: [
      {
        id: "responsable",
        title: "1. Qui est responsable du traitement ?",
        blocks: [
          {
            type: "paragraph",
            text: "ZyNum est exploité par ASHTECH SARL, société enregistrée au Cameroun. Dans cette politique, « ZyNum », « nous » et « notre » désignent ASHTECH SARL pour les traitements liés au service.",
          },
          {
            type: "paragraph",
            text: "Cette politique s’applique aux données traitées dans le cadre de votre compte, des commandes de numéros virtuels et de la réception de SMS, des recharges et transactions, des fonctions de parrainage ou d’affiliation, de l’API, de l’assistance et de la sécurité du service.",
          },
        ],
      },
      {
        id: "donnees",
        title: "2. Quelles données traitons-nous ?",
        blocks: [
          {
            type: "paragraph",
            text: "Les catégories de données dépendent des fonctions que vous utilisez. Elles peuvent comprendre :",
          },
          {
            type: "list",
            items: [
              "Compte et profil : nom, adresse e-mail, identifiant de compte, état de vérification, solde, code de parrainage et lien avec un parrain. Le mot de passe est conservé sous forme de hachage, et non en texte lisible.",
              "Connexion et sécurité : informations de session, clé API ou jeton d’authentification, date de dernière connexion, adresse IP, informations de pays ou de région lorsqu’elles sont déterminées, chemin de requête et événements de sécurité.",
              "Commandes et SMS : service demandé, numéro virtuel attribué, dates et état de la commande, ainsi que le contenu des SMS reçus, y compris les codes à usage unique et le texte associé.",
              "Recharges et transactions : montants, soldes, méthode ou parcours de paiement, état, références de transaction et informations de réponse transmises à ZyNum par le service de paiement concerné.",
              "Parrainage et affiliation : informations de parrainage, commissions, demandes de retrait et, lorsqu’un retrait est demandé, les coordonnées nécessaires, qui peuvent inclure un numéro de téléphone et un pays.",
              "Informations que vous fournissez : échanges avec l’assistance, paramètres de compte et adresse de webhook que vous choisissez de configurer.",
              "Données techniques du navigateur : jeton d’authentification, préférences de langue, de devise et de thème, ainsi que des données de commande en cours ou d’état temporaire de l’interface.",
            ],
          },
          {
            type: "paragraph",
            text: "Certains SMS et codes de vérification peuvent être sensibles. Ne partagez pas vos identifiants ou vos clés API dans une demande d’assistance.",
          },
        ],
      },
      {
        id: "utilisation",
        title: "3. Pourquoi utilisons-nous ces données ?",
        blocks: [
          {
            type: "paragraph",
            text: "Nous utilisons les données pertinentes pour fournir et administrer les fonctions que vous demandez, notamment pour :",
          },
          {
            type: "list",
            items: [
              "créer et gérer votre compte, vous authentifier et traiter les demandes de connexion ou de récupération d’accès ;",
              "fournir des numéros virtuels, recevoir et afficher les SMS, gérer les commandes, crédits, recharges, annulations et remboursements ;",
              "envoyer les messages nécessaires au compte, à la vérification, à la sécurité et à l’assistance ;",
              "calculer les parrainages, commissions et retraits d’affiliation ;",
              "protéger le service, détecter les abus ou activités suspectes, appliquer les règles du service et traiter les incidents ;",
              "répondre aux demandes des utilisateurs et respecter les obligations légales applicables.",
            ],
          },
        ],
      },
      {
        id: "partage",
        title: "4. Avec qui les données peuvent-elles être partagées ?",
        blocks: [
          {
            type: "paragraph",
            text: "Pour faire fonctionner les fonctions demandées, certaines données peuvent être traitées par des prestataires techniques ou opérationnels. Selon la fonction utilisée, ces catégories peuvent inclure :",
          },
          {
            type: "list",
            items: [
              "des services d’hébergement, de base de données et d’infrastructure, qui peuvent traiter les données de compte, de commande et les journaux techniques ;",
              "des services de numéros virtuels et de messagerie, qui traitent les commandes et les SMS associés ;",
              "des services de paiement ou de recharge, qui reçoivent les informations nécessaires à la transaction et peuvent transmettre à ZyNum des références ou des données de statut ;",
              "des services de courrier électronique, de communication et de sécurité, utilisés pour les vérifications, les messages de compte et le traitement des événements de sécurité.",
            ],
          },
          {
            type: "paragraph",
            text: "Si vous configurez un webhook, ZyNum peut transmettre à l’adresse que vous avez fournie des notifications de commande comprenant le numéro concerné ainsi que le code et le texte du SMS reçu. Configurez uniquement une destination que vous contrôlez ou que vous êtes autorisé à utiliser, et vérifiez les personnes qui peuvent y accéder.",
          },
          {
            type: "paragraph",
            text: "Les données peuvent aussi être communiquées lorsque cela est nécessaire pour répondre à une obligation légale, protéger les utilisateurs ou le service, ou traiter une réclamation. Les destinataires et les données concernées varient selon les fonctions effectivement utilisées.",
          },
        ],
      },
      {
        id: "transferts",
        title: "5. Où les données peuvent-elles être traitées ?",
        blocks: [
          {
            type: "paragraph",
            text: "Les prestataires nécessaires au service peuvent exploiter leur infrastructure dans des pays différents du vôtre. Les données peuvent donc être traitées hors du Cameroun ou de votre pays de résidence. Les lieux de traitement dépendent des services sollicités et peuvent évoluer.",
          },
          {
            type: "paragraph",
            text: "Les règles applicables aux transferts de données dépendent de votre situation et du droit applicable. Vous pouvez nous contacter pour demander les informations disponibles sur un traitement précis.",
          },
        ],
      },
      {
        id: "conservation",
        title: "6. Combien de temps conservons-nous les données ?",
        blocks: [
          {
            type: "paragraph",
            text: "Nous n’indiquons pas de durée fixe de conservation dans cette politique. Les données sont conservées aussi longtemps qu’elles sont nécessaires au fonctionnement du compte et des services demandés, à la gestion des transactions et réclamations, à la sécurité du service ou au respect d’obligations légales. Les besoins de conservation peuvent différer selon la catégorie de données.",
          },
          {
            type: "paragraph",
            text: "La fermeture ou l’inactivité d’un compte ne signifie pas nécessairement que toutes les commandes, transactions, données de sécurité ou sauvegardes sont immédiatement supprimées. Certaines informations peuvent être conservées lorsqu’un motif opérationnel ou une obligation légale le justifie.",
          },
        ],
      },
      {
        id: "droits",
        title: "7. Vos choix et vos droits",
        blocks: [
          {
            type: "paragraph",
            text: "Selon le droit applicable à votre situation, vous pouvez demander l’accès à vos données, leur rectification ou leur suppression, la limitation de certains traitements, vous y opposer ou demander leur portabilité lorsque ce droit est prévu. Vous pouvez aussi demander des précisions sur un traitement particulier.",
          },
          {
            type: "paragraph",
            text: "Pour exercer un droit, contactez-nous sur WhatsApp au numéro indiqué ci-dessous. Indiquez l’adresse e-mail liée au compte et la nature de votre demande ; nous pouvons demander des éléments raisonnables pour vérifier votre identité avant d’agir. Les demandes sont évaluées au regard du droit applicable et des obligations de conservation pertinentes.",
          },
        ],
      },
      {
        id: "suppression",
        title: "8. Demander la suppression d’un compte",
        blocks: [
          {
            type: "paragraph",
            text: "ZyNum ne propose actuellement pas de fonction automatique de suppression de compte dans l’application. Pour demander la fermeture de votre compte ou la suppression de données, contactez-nous sur WhatsApp. Nous vérifierons la demande et vous informerons des suites possibles.",
          },
          {
            type: "paragraph",
            text: "La suppression peut être limitée si certaines données doivent être conservées pour traiter une transaction, prévenir une fraude, résoudre un différend, protéger le service ou respecter une obligation légale. Cette politique ne promet ni suppression immédiate ni délai fixe.",
          },
        ],
      },
      {
        id: "securite",
        title: "9. Comment protégeons-nous les données ?",
        blocks: [
          {
            type: "paragraph",
            text: "Nous prenons des mesures techniques et organisationnelles destinées à protéger les données traitées par ZyNum. Les mots de passe sont hachés avec scrypt et ne sont pas conservés sous forme de texte lisible. Cette mesure ne signifie pas que toutes les autres données sont chiffrées de bout en bout ou qu’un système peut être garanti sans risque.",
          },
          {
            type: "paragraph",
            text: "Les identifiants de session et les clés API permettent l’accès au compte ou aux fonctions de l’API. Gardez-les confidentiels et contactez-nous si vous pensez qu’un tiers y a accédé.",
          },
        ],
      },
      {
        id: "stockage-navigateur",
        title: "10. Cookies et stockage sur votre appareil",
        blocks: [
          {
            type: "paragraph",
            text: "Le site et l’application Web utilisent des mécanismes de stockage du navigateur pour permettre certaines fonctions. Selon votre utilisation, le navigateur peut conserver un jeton d’authentification, vos préférences de langue, de devise ou de thème, ainsi que l’état temporaire ou le brouillon d’une commande. Un cookie peut également être utilisé pour une session ou une préférence d’interface.",
          },
          {
            type: "paragraph",
            text: "Effacer les cookies ou le stockage local du navigateur peut vous déconnecter et supprimer des préférences ou des données de commande non finalisées. Cette politique ne prétend pas que les journaux techniques générés par les infrastructures ou les prestataires sont absents.",
          },
        ],
      },
      {
        id: "mineurs",
        title: "11. Âge minimum",
        blocks: [
          {
            type: "paragraph",
            text: "ZyNum est destiné aux personnes âgées d’au moins 18 ans. Nous ne cherchons pas à collecter les données personnelles d’enfants de moins de 18 ans. Si vous pensez qu’un mineur a créé un compte, contactez-nous afin que nous puissions examiner la situation.",
          },
        ],
      },
      {
        id: "modifications",
        title: "12. Modifications de cette politique",
        blocks: [
          {
            type: "paragraph",
            text: "Nous pouvons mettre cette politique à jour lorsque le service ou les règles applicables évoluent. La date de mise à jour figurant en haut de la page indique la version publiée. Si un changement est important, nous chercherons à le signaler par un moyen adapté au service.",
          },
        ],
      },
      {
        id: "contact",
        title: "13. Nous contacter",
        blocks: [
          {
            type: "paragraph",
            text: "Pour toute question sur cette politique, une demande relative à vos données ou une demande de suppression de compte, contactez ASHTECH SARL, exploitant de ZyNum, sur WhatsApp au numéro ci-dessous.",
          },
        ],
      },
    ],
  },
  en: {
    badge: "LEGAL INFORMATION",
    title: "Privacy Policy",
    updated: "Last updated: September 25, 2026",
    introduction:
      "This policy describes the personal data processed when you use ZyNum, including its app, website, API, and support features. It explains what data is involved, why it is used, who may receive it, and how to contact us.",
    disclaimerTitle: "General information",
    disclaimer:
      "This document describes ZyNum’s privacy practices and is not legal advice. Applicable rights and obligations may vary depending on your country.",
    indexLabel: "In this policy",
    contactLabel: "Questions about your data?",
    contactAction: "Contact ZyNum on WhatsApp",
    contactNumber: "+228 92299772",
    sections: [
      {
        id: "responsable",
        title: "1. Who is responsible for processing?",
        blocks: [
          {
            type: "paragraph",
            text: "ZyNum is operated by ASHTECH SARL, a company registered in Cameroon. In this policy, “ZyNum,” “we,” and “us” refer to ASHTECH SARL for processing connected with the service.",
          },
          {
            type: "paragraph",
            text: "This policy applies to data processed for your account, virtual-number orders and SMS receipt, recharges and transactions, referral or affiliate features, the API, support, and service security.",
          },
        ],
      },
      {
        id: "donnees",
        title: "2. What data do we process?",
        blocks: [
          {
            type: "paragraph",
            text: "The data involved depends on which features you use. It may include:",
          },
          {
            type: "list",
            items: [
              "Account and profile data: name, email address, account identifier, verification status, balance, referral code, and relationship to a referrer. Passwords are stored as a hash, not readable text.",
              "Sign-in and security data: session information, an API key or authentication token, last sign-in time, IP address, country or region information where determined, request path, and security events.",
              "Orders and SMS: requested service, assigned virtual number, order dates and status, and the content of received SMS messages, including one-time codes and related text.",
              "Recharges and transactions: amounts, balances, payment route or method, status, transaction references, and information provided to ZyNum in a response from the relevant payment service.",
              "Referrals and affiliates: referral information, commissions, withdrawal requests and, when a withdrawal is requested, necessary contact details that may include a phone number and country.",
              "Information you provide: support conversations, account settings, and a webhook address that you choose to configure.",
              "Browser data: authentication token, language, currency, and theme preferences, and in-progress order or temporary interface state.",
            ],
          },
          {
            type: "paragraph",
            text: "Some SMS messages and verification codes may be sensitive. Do not include your passwords or API keys in a support request.",
          },
        ],
      },
      {
        id: "utilisation",
        title: "3. Why do we use this data?",
        blocks: [
          {
            type: "paragraph",
            text: "We use relevant data to provide and administer the features you request, including to:",
          },
          {
            type: "list",
            items: [
              "create and manage your account, authenticate you, and handle sign-in or account-recovery requests;",
              "provide virtual numbers, receive and display SMS messages, and manage orders, credits, recharges, cancellations, and refunds;",
              "send messages needed for account administration, verification, security, and support;",
              "calculate referrals, commissions, and affiliate withdrawals;",
              "protect the service, detect abuse or suspicious activity, enforce service rules, and investigate incidents; and",
              "respond to user requests and meet applicable legal obligations.",
            ],
          },
        ],
      },
      {
        id: "partage",
        title: "4. Who may receive data?",
        blocks: [
          {
            type: "paragraph",
            text: "Some data may be processed by technical or operational service providers so we can deliver the features you request. Depending on the feature, these categories may include:",
          },
          {
            type: "list",
            items: [
              "hosting, database, and infrastructure services, which may process account, order, and technical-log data;",
              "virtual-number and messaging services, which process orders and related SMS messages;",
              "payment or recharge services, which receive information needed for a transaction and may send ZyNum references or status data; and",
              "email, communications, and security services used for verification, account messages, and security-event handling.",
            ],
          },
          {
            type: "paragraph",
            text: "If you configure a webhook, ZyNum may send order notifications to the address you supplied, including the relevant phone number and the code and text of a received SMS. Only configure a destination you control or are authorized to use, and check who can access it.",
          },
          {
            type: "paragraph",
            text: "Data may also be disclosed when needed to meet a legal obligation, protect users or the service, or handle a claim. Recipients and the data involved vary with the features actually used.",
          },
        ],
      },
      {
        id: "transferts",
        title: "5. Where may data be processed?",
        blocks: [
          {
            type: "paragraph",
            text: "Service providers may operate infrastructure in countries other than yours. Data may therefore be processed outside Cameroon or your country of residence. Processing locations depend on the services involved and may change.",
          },
          {
            type: "paragraph",
            text: "Rules for data transfers depend on your circumstances and applicable law. You can contact us to request information available about a particular processing activity.",
          },
        ],
      },
      {
        id: "conservation",
        title: "6. How long do we keep data?",
        blocks: [
          {
            type: "paragraph",
            text: "This policy does not state a fixed retention period. Data is kept for as long as it is needed to operate your account and requested services, manage transactions and claims, protect the service, or meet legal obligations. Retention needs may differ by data category.",
          },
          {
            type: "paragraph",
            text: "Closing or leaving an account inactive does not necessarily mean that all order, transaction, security, or backup data is immediately deleted. Some information may be retained where an operational reason or legal obligation applies.",
          },
        ],
      },
      {
        id: "droits",
        title: "7. Your choices and rights",
        blocks: [
          {
            type: "paragraph",
            text: "Depending on the law that applies to you, you may be able to request access to your data, correction or deletion, restriction of certain processing, object to processing, or request portability where that right is available. You may also ask us about a particular processing activity.",
          },
          {
            type: "paragraph",
            text: "To make a request, contact us on WhatsApp at the number below. Include the email address linked to your account and the nature of your request; we may ask for reasonable information to verify your identity before acting. Requests are assessed under applicable law and relevant retention obligations.",
          },
        ],
      },
      {
        id: "suppression",
        title: "8. Requesting account deletion",
        blocks: [
          {
            type: "paragraph",
            text: "ZyNum does not currently provide an automatic in-app account-deletion feature. To request account closure or deletion of data, contact us on WhatsApp. We will verify the request and let you know what action can be taken.",
          },
          {
            type: "paragraph",
            text: "Deletion may be limited where information must be retained to process a transaction, prevent fraud, resolve a dispute, protect the service, or meet a legal obligation. This policy does not promise immediate deletion or a fixed deadline.",
          },
        ],
      },
      {
        id: "securite",
        title: "9. How do we protect data?",
        blocks: [
          {
            type: "paragraph",
            text: "We take technical and organizational measures intended to protect data processed by ZyNum. Passwords are hashed using scrypt and are not stored as readable text. This does not mean that all other data is end-to-end encrypted or that any system can be guaranteed risk-free.",
          },
          {
            type: "paragraph",
            text: "Session credentials and API keys can provide access to your account or API features. Keep them confidential and contact us if you believe someone else has accessed them.",
          },
        ],
      },
      {
        id: "stockage-navigateur",
        title: "10. Cookies and storage on your device",
        blocks: [
          {
            type: "paragraph",
            text: "The website and web app use browser storage mechanisms to support certain features. Depending on your use, your browser may store an authentication token, language, currency, or theme preferences, and temporary state or a draft order. A cookie may also be used for a session or interface preference.",
          },
          {
            type: "paragraph",
            text: "Clearing browser cookies or local storage may sign you out and remove preferences or unfinished order data. This policy does not claim that technical logs generated by infrastructure or service providers are absent.",
          },
        ],
      },
      {
        id: "mineurs",
        title: "11. Minimum age",
        blocks: [
          {
            type: "paragraph",
            text: "ZyNum is intended for people aged 18 or older. We do not seek to collect personal data from children under 18. If you believe a minor has created an account, contact us so we can review the situation.",
          },
        ],
      },
      {
        id: "modifications",
        title: "12. Changes to this policy",
        blocks: [
          {
            type: "paragraph",
            text: "We may update this policy as the service or applicable rules change. The update date at the top of the page identifies the published version. If a change is significant, we will seek to communicate it through an appropriate service channel.",
          },
        ],
      },
      {
        id: "contact",
        title: "13. Contact us",
        blocks: [
          {
            type: "paragraph",
            text: "For questions about this policy, a request about your data, or an account-deletion request, contact ASHTECH SARL, the operator of ZyNum, on WhatsApp at the number below.",
          },
        ],
      },
    ],
  },
};