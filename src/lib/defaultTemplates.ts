import type { DocumentTemplate } from './types';

export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  // ==================== LETTRES ====================
  {
    id: 'tpl-lettre-mise-en-demeure',
    code: 'lettre-mise-en-demeure',
    title: 'Mise en demeure de payer',
    category: 'Lettres',
    description: 'Sommation formelle de règlement d\'une créance commerciale impayée avant engagement de poursuites judiciaires ou d\'injonction de payer.',
    ohada_reference: 'AUDCG Art. 225 & AUPSRVE Art. 38',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'creancier_nom', label: 'Nom / Raison sociale du créancier', type: 'text', required: true },
      { key: 'creancier_adresse', label: 'Adresse du créancier', type: 'textarea', required: true },
      { key: 'debiteur_nom', label: 'Nom / Raison sociale du débiteur', type: 'text', required: true },
      { key: 'debiteur_adresse', label: 'Adresse du débiteur', type: 'textarea', required: true },
      { key: 'facture_numero', label: 'Numéro de facture / Référence créance', type: 'text', required: true },
      { key: 'facture_date', label: 'Date de la facture', type: 'date', required: true },
      { key: 'montant_principal', label: 'Montant principal dû (FCFA)', type: 'number', required: true },
      { key: 'delai_jours', label: 'Délai accordé pour payer (en jours)', type: 'number', default: '8', required: true },
      { key: 'ville', label: 'Ville de rédaction', type: 'text', default: 'Abidjan', required: true },
      { key: 'date_courrier', label: 'Date du courrier', type: 'date', required: true },
    ],
    compliance_rules: [
      {
        id: 'rule_montant_positif',
        description: 'Le montant de la créance doit être supérieur à 0.',
        severity: 'error',
        expression: 'montant_principal > 0',
      },
      {
        id: 'rule_delai_raisonnable',
        description: 'Le délai de mise en demeure doit être d\'au moins 8 jours selon les usages OHADA.',
        severity: 'warning',
        expression: 'delai_jours >= 8',
      },
    ],
    body: `LETTRE DE MISE EN DEMEURE DE PAYER
(Sous toutes réserves d'usage - Valant sommation)

DE :
{{creancier_nom}}
{{creancier_adresse}}

À L'ATTENTION DE :
{{debiteur_nom}}
{{debiteur_adresse}}

Fait à {{ville}}, le {{date_courrier}}

Objet : MISE EN DEMEURE DE PAYER - Facture n° {{facture_numero}}

Madame, Monsieur,

Sauf erreur ou omission de notre part, nous constatons qu'à ce jour, le règlement de la facture n° {{facture_numero}} émise le {{facture_date}}, pour un montant total de {{montant_principal}} FCFA, demeure impayé malgré l'échéance convenue.

Par la présente, et conformément aux dispositions de l'Acte Uniforme OHADA portant sur le Droit Commercial Général (AUDCG) et des Procédures Simplifiées de Recouvrement (AUPSRVE) :

NOUS VOUS METTONS EN DEMEURE DE PAYER

la somme principale de : {{montant_principal}} FCFA (Francs CFA),

dans un délai strict et impératif de {{delai_jours}} jours à compter de la réception de la présente lettre.

À défaut de règlement intégral dans ce délai, nous nous verrons dans l'obligation de saisir la juridiction compétente afin d'obtenir le recouvrement forcé de notre créance par voie d'injonction de payer ou de saisie, les frais de procédure et intérêts légaux restant à votre charge exclusive.

Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

Pour {{creancier_nom}},
Signature et cachet :`,
  },
  {
    id: 'tpl-lettre-convocation-ago',
    code: 'lettre-convocation-ago',
    title: 'Convocation à l\'Assemblée Générale Ordinaire',
    category: 'Lettres',
    description: 'Lettre recommandée de convocation des associés ou actionnaires pour l\'approbation des comptes annuels selon les règles OHADA.',
    ohada_reference: 'AUSCGIE Art. 338 & 348',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'societe_nom', label: 'Dénomination sociale de la société', type: 'text', required: true },
      { key: 'societe_forme', label: 'Forme juridique (SARL, SAS, SA)', type: 'select', options: ['SARL', 'SAS', 'SA'], required: true },
      { key: 'societe_siege', label: 'Siège social', type: 'text', required: true },
      { key: 'destinataire_nom', label: 'Nom de l\'associé convoqué', type: 'text', required: true },
      { key: 'destinataire_adresse', label: 'Adresse de l\'associé', type: 'textarea', required: true },
      { key: 'date_ag', label: 'Date de l\'assemblée', type: 'date', required: true },
      { key: 'heure_ag', label: 'Heure de l\'assemblée', type: 'text', default: '10h00', required: true },
      { key: 'lieu_ag', label: 'Lieu de réunion', type: 'text', required: true },
      { key: 'exercice_clos', label: 'Date de clôture de l\'exercice', type: 'date', required: true },
      { key: 'ville', label: 'Ville d\'envoi', type: 'text', default: 'Dakar', required: true },
      { key: 'date_envoi', label: 'Date d\'envoi du courrier', type: 'date', required: true },
    ],
    compliance_rules: [],
    body: `CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE

Société : {{societe_nom}}, {{societe_forme}}
Siège social : {{societe_siege}}

À L'ATTENTION DE :
{{destinataire_nom}}
{{destinataire_adresse}}

Fait à {{ville}}, le {{date_envoi}}

Objet : Convocation à l'Assemblée Générale Ordinaire Annuelle

Cher(e) Associé(e),

Conformément aux statuts de notre société et aux dispositions de l'Acte Uniforme OHADA relatif au droit des sociétés commerciales et du GIE (AUSCGIE), nous avons l'honneur de vous convoquer à l'Assemblée Générale Ordinaire qui se tiendra le :

Date : {{date_ag}} à {{heure_ag}}
Lieu : {{lieu_ag}}

L'ordre du jour est fixé comme suit :
1. Présentation du rapport de gestion établi par la gérance sur l'exercice clos le {{exercice_clos}} ;
2. Examen et approbation des comptes annuels (bilan, compte de résultat, annexes) ;
3. Affectation du résultat de l'exercice ;
4. Quitus à la gérance pour l'exécution de son mandat ;
5. Questions diverses.

Vous trouverez ci-joint les documents financiers et le projet de résolutions. En cas d'empêchement, vous pouvez vous faire représenter par un autre associé muni d'un pouvoir régulier.

Veuillez agréer, Cher(e) Associé(e), nos salutations distinguées.

La Gérance / Direction`,
  },
  {
    id: 'tpl-lettre-licenciement',
    code: 'lettre-licenciement-personnel',
    title: 'Notification de licenciement pour motif personnel',
    category: 'Lettres',
    description: 'Notification écrite et motivée de rupture de contrat de travail avec respect du préavis et droits légaux.',
    ohada_reference: 'Droit du travail & Pratique OHADA',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'employeur_nom', label: 'Nom de l\'entreprise', type: 'text', required: true },
      { key: 'employeur_adresse', label: 'Adresse de l\'entreprise', type: 'text', required: true },
      { key: 'salarie_nom', label: 'Nom du salarié', type: 'text', required: true },
      { key: 'salarie_adresse', label: 'Adresse du salarié', type: 'textarea', required: true },
      { key: 'poste_occupe', label: 'Poste occupé', type: 'text', required: true },
      { key: 'date_entretien', label: 'Date de l\'entretien préalable', type: 'date', required: true },
      { key: 'motif_detaille', label: 'Motifs précis de la rupture', type: 'textarea', required: true },
      { key: 'duree_preavis_mois', label: 'Durée du préavis (en mois)', type: 'number', default: '1', required: true },
      { key: 'ville', label: 'Ville', type: 'text', default: 'Douala', required: true },
      { key: 'date_lettre', label: 'Date de notification', type: 'date', required: true },
    ],
    compliance_rules: [],
    body: `NOTIFICATION DE LICENCIEMENT POUR MOTIF PERSONNEL

DE :
{{employeur_nom}}
{{employeur_adresse}}

À :
Monsieur / Madame {{salarie_nom}}
{{salarie_adresse}}

Fait à {{ville}}, le {{date_lettre}}

Objet : Notification de rupture de contrat de travail (Licenciement)

Madame, Monsieur,

Faisant suite à notre entretien préalable qui s'est tenu le {{date_entretien}}, nous vous notifions par la présente notre décision de procéder à la résiliation de votre contrat de travail en qualité de {{poste_occupe}}.

Cette décision est motivée par les faits suivants :
{{motif_detaille}}

Votre période de préavis est d'une durée de {{duree_preavis_mois}} mois et débutera à la date de réception de cette notification.

À la date d'expiration de votre contrat, nous tiendrons à votre entière disposition votre certificat de travail, votre reçu pour solde de tout compte ainsi que votre attestation de travail.

Nous vous prions d'agréer, Madame, Monsieur, nos salutations distinguées.

Pour {{employeur_nom}},
Direction Générale`,
  },
  {
    id: 'tpl-lettre-demission-gerant',
    code: 'lettre-demission-gerant',
    title: 'Lettre de démission du Gérant',
    category: 'Lettres',
    description: 'Notification officielle de renonciation aux fonctions de gérant adressée à la collectivité des associés d\'une société commerciale.',
    ohada_reference: 'AUSCGIE Art. 326',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'gerant_nom', label: 'Nom du gérant démissionnaire', type: 'text', required: true },
      { key: 'societe_nom', label: 'Nom de la société', type: 'text', required: true },
      { key: 'societe_siege', label: 'Siège social', type: 'text', required: true },
      { key: 'date_effet', label: 'Date d\'effet de la démission', type: 'date', required: true },
      { key: 'motifs', label: 'Motifs (optionnel)', type: 'textarea', default: 'Pour des raisons strictement personnelles et professionnelles.' },
      { key: 'ville', label: 'Ville', type: 'text', default: 'Cotonou', required: true },
      { key: 'date_lettre', label: 'Date du courrier', type: 'date', required: true },
    ],
    compliance_rules: [],
    body: `LETTRE DE DÉMISSION DU MANDAT DE GÉRANCE

DE : {{gerant_nom}}
Gérant de la société {{societe_nom}}

AUX ASSOCIÉS DE LA SOCIÉTÉ {{societe_nom}}
Siège social : {{societe_siege}}

Fait à {{ville}}, le {{date_lettre}}

Objet : Démission de mes fonctions de Gérant

Chers Associés,

Par la présente, je vous informe de ma décision irrévocable de démissionner de mes fonctions de Gérant au sein de la société {{societe_nom}}.

Cette démission prendra effet le {{date_effet}}, afin de permettre à l'assemblée des associés de pourvoir à mon remplacement dans les meilleures conditions et d'organiser la transition managériale.

Motif :
{{motifs}}

Je reste à votre entière disposition pour assurer la passation des dossiers et la reddition des comptes jusqu'à la date d'effet ci-dessus mentionnée.

Je vous remercie pour la confiance que vous m'avez accordée tout au long de l'exercice de ce mandat.

Veuillez agréer, Chers Associés, l'expression de mes salutations distinguées.

{{gerant_nom}}
Signature :`,
  },
  {
    id: 'tpl-lettre-reclamation-marchandises',
    code: 'lettre-reclamation-marchandises',
    title: 'Réclamation pour marchandises non-conformes',
    category: 'Lettres',
    description: 'Lettre de contestation commerciale notifiant les avaries, manquants ou non-conformités à un fournisseur selon l\'AUDCG.',
    ohada_reference: 'AUDCG Art. 255 à 258',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'acheteur_nom', label: 'Nom de l\'acheteur', type: 'text', required: true },
      { key: 'fournisseur_nom', label: 'Nom du fournisseur', type: 'text', required: true },
      { key: 'bon_commande_ref', label: 'Référence du bon de commande / livraison', type: 'text', required: true },
      { key: 'date_livraison', label: 'Date de réception de la livraison', type: 'date', required: true },
      { key: 'anomalies_constatees', label: 'Description des défauts et anomalies', type: 'textarea', required: true },
      { key: 'solution_attendue', label: 'Solution demandée (remplacement, remboursement)', type: 'text', default: 'le remplacement sans délai des articles défectueux', required: true },
      { key: 'ville', label: 'Ville', type: 'text', default: 'Libreville', required: true },
      { key: 'date_courrier', label: 'Date du courrier', type: 'date', required: true },
    ],
    compliance_rules: [],
    body: `LETTRE DE RÉCLAMATION POUR DÉFAUT DE CONFORMITÉ
(Acte Uniforme OHADA portant Droit Commercial Général)

DE : {{acheteur_nom}}
À : {{fournisseur_nom}}

Fait à {{ville}}, le {{date_courrier}}

Objet : Réclamation pour non-conformité de livraison - Commande ref. {{bon_commande_ref}}

Madame, Monsieur,

Nous faisons suite à la livraison intervenue le {{date_livraison}} concernant la commande référencée {{bon_commande_ref}}.

Lors de la vérification contradictoire des marchandises reçues, nous avons constaté les anomalies et défauts de conformité suivants :
{{anomalies_constatees}}

Conformément aux dispositions de l'Acte Uniforme OHADA portant sur le Droit Commercial Général (articles 255 et suivants relatifs à l'obligation de conformité du vendeur), nous vous mettons formellement en demeure de procéder à :
{{solution_attendue}}

À défaut d'une réponse satisfaisante sous 7 jours, nous nous réservons le droit d'invoquer la résolution de la vente ou la réduction du prix de vente, avec dommages et intérêts pour le préjudice d'exploitation subi.

Dans l'attente de votre prompt retour, veuillez agréer, Madame, Monsieur, nos salutations distinguées.

{{acheteur_nom}}`,
  },

  // ==================== CONSTITUTION ====================
  {
    id: 'tpl-statuts-sarl',
    code: 'statuts-sarl',
    title: 'Statuts de SARL Pluripersonnelle',
    category: 'Constitution',
    description: 'Modèle officiel conforme aux normes OHADA pour la constitution d\'une Société à Responsabilité Limitée avec plusieurs associés.',
    ohada_reference: 'AUSCGIE Art. 309 et suivants',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'denomination', label: 'Dénomination sociale', type: 'text', required: true },
      { key: 'siege_social', label: 'Siège social (Ville et adresse)', type: 'text', required: true },
      { key: 'objet_social', label: 'Objet social principal', type: 'textarea', required: true },
      { key: 'capital_social', label: 'Capital social (FCFA)', type: 'number', default: '1000000', required: true },
      { key: 'valeur_nominale', label: 'Valeur nominale d\'une part sociale (FCFA)', type: 'number', default: '10000', required: true },
      { key: 'nombre_parts', label: 'Nombre total de parts', type: 'number', default: '100', required: true },
      { key: 'gerant_nom', label: 'Nom du premier Gérant', type: 'text', required: true },
      { key: 'duree_annees', label: 'Durée de la société (années)', type: 'number', default: '99', required: true },
      { key: 'ville', label: 'Ville de signature', type: 'text', default: 'Abidjan', required: true },
      { key: 'date_statuts', label: 'Date des statuts', type: 'date', required: true },
    ],
    compliance_rules: [
      {
        id: 'rule_capital_positif',
        description: 'Le capital social doit être supérieur à zéro.',
        severity: 'error',
        expression: 'capital_social > 0',
      },
    ],
    body: `STATUTS DE LA SOCIÉTÉ À RESPONSABILITÉ LIMITÉE
« {{denomination}} »

Au capital de {{capital_social}} Francs CFA
Siège social : {{siege_social}}

ARTICLE 1 - FORME
Il est formé entre les soussignés une Société à Responsabilité Limitée régie par l'Acte Uniforme de l'OHADA relatif au droit des sociétés commerciales et du GIE (AUSCGIE) et par les présents statuts.

ARTICLE 2 - DÉNOMINATION SOCIALE
La société a pour dénomination sociale : « {{denomination}} SARL ».

ARTICLE 3 - OBJET SOCIAL
La société a pour objet, dans tous les États parties au Traité de l'OHADA et à l'étranger :
{{objet_social}}
Et plus généralement, toutes opérations commerciales, financières, mobilières ou immobilières se rattachant directement ou indirectement à l'objet susvisé.

ARTICLE 4 - SIÈGE SOCIAL
Le siège social est fixé à : {{siege_social}}. Il pourra être transféré en tout autre lieu par décision de la collectivité des associés.

ARTICLE 5 - DURÉE
La durée de la société est fixée à {{duree_annees}} années à compter de son immatriculation au Registre du Commerce et du Crédit Mobilier (RCCM), sauf prorogation ou dissolution anticipée.

ARTICLE 6 - CAPITAL SOCIAL ET PARTS SOCIALES
Le capital social est fixé à la somme de {{capital_social}} Francs CFA.
Il est divisé en {{nombre_parts}} parts sociales d'une valeur nominale de {{valeur_nominale}} Francs CFA chacune, intégralement souscrites et libérées.

ARTICLE 7 - GÉRANCE
La société est gérée et administrée par : {{gerant_nom}}, désigné en qualité de premier Gérant de la société pour une durée indéterminée. Le Gérant dispose des pouvoirs les plus étendus pour agir au nom de la société dans la limite de l'objet social.

Fait à {{ville}}, le {{date_statuts}}, en autant d'originaux que requis par la loi.`,
  },

  // ==================== CONTRATS ====================
  {
    id: 'tpl-bail-commercial',
    code: 'bail-commercial-professionnel',
    title: 'Bail commercial et professionnel OHADA',
    category: 'Contrats',
    description: 'Contrat de bail commercial régi par le livre IV de l\'AUDCG avec clause de destination, loyer et droit au renouvellement.',
    ohada_reference: 'AUDCG Art. 101 à 134',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'bailleur_nom', label: 'Nom du Bailleur (Propriétaire)', type: 'text', required: true },
      { key: 'preneur_nom', label: 'Nom du Preneur (Locataire)', type: 'text', required: true },
      { key: 'adresse_immeuble', label: 'Adresse et description des locaux', type: 'textarea', required: true },
      { key: 'activite_autorisee', label: 'Activité commerciale autorisée', type: 'text', required: true },
      { key: 'duree_bail_annees', label: 'Durée du bail (en années)', type: 'number', default: '3', required: true },
      { key: 'loyer_mensuel', label: 'Loyer mensuel hors charges (FCFA)', type: 'number', required: true },
      { key: 'depot_garantie_mois', label: 'Dépôt de garantie (nombre de mois)', type: 'number', default: '2', required: true },
      { key: 'date_debut', label: 'Date de prise d\'effet', type: 'date', required: true },
      { key: 'ville', label: 'Ville', type: 'text', default: 'Abidjan', required: true },
    ],
    compliance_rules: [
      {
        id: 'rule_loyer_positif',
        description: 'Le montant du loyer doit être strictement supérieur à 0.',
        severity: 'error',
        expression: 'loyer_mensuel > 0',
      },
    ],
    body: `CONTRAT DE BAIL À USAGE PROFESSIONNEL ET COMMERCIAL
(Régie par l'Acte Uniforme OHADA portant Droit Commercial Général)

ENTRE LES SOUSSIGNÉS :
1. LE BAILLEUR : {{bailleur_nom}}
D'une part,

ET :
2. LE PRENEUR : {{preneur_nom}}
D'autre part.

IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :

ARTICLE 1 - DÉSIGNATION DES LIEUX
Le Bailleur donne à bail commercial au Preneur, qui accepte, les locaux situés à :
{{adresse_immeuble}}

ARTICLE 2 - DESTINATION DES LIEUX
Les locaux loués sont exclusivement destinés à l'exercice de l'activité suivante :
{{activite_autorisee}}

ARTICLE 3 - DURÉE DU BAIL
Le présent bail est consenti pour une durée de {{duree_bail_annees}} années entières et consécutives, prenant effet le {{date_debut}}.
Le Preneur bénéficiera du droit au renouvellement de son bail commercial conformément aux dispositions protectrices des articles 123 et suivants de l'AUDCG.

ARTICLE 4 - LOYER ET DÉPÔT DE GARANTIE
Le loyer mensuel est fixé à la somme de {{loyer_mensuel}} Francs CFA, payable d'avance le premier de chaque mois.
À titre de garantie, le Preneur verse ce jour au Bailleur une somme correspondant à {{depot_garantie_mois}} mois de loyer.

Fait à {{ville}}, le {{date_debut}}, en deux exemplaires originaux.`,
  },
  {
    id: 'tpl-contrat-travail-cdi',
    code: 'contrat-travail-cdi',
    title: 'Contrat de travail à durée indéterminée (CDI)',
    category: 'Contrats',
    description: 'Contrat de travail d\'usage en zone OHADA incluant période d\'essai, classification, salaire et obligations de confidentialité.',
    ohada_reference: 'Droit du Travail OHADA',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'employeur_nom', label: 'Nom de l\'Employeur', type: 'text', required: true },
      { key: 'salarie_nom', label: 'Nom du Salarié', type: 'text', required: true },
      { key: 'intitule_poste', label: 'Intitulé du poste / fonction', type: 'text', required: true },
      { key: 'date_debut', label: 'Date d\'embauche', type: 'date', required: true },
      { key: 'salaire_base', label: 'Salaire brut mensuel (FCFA)', type: 'number', required: true },
      { key: 'lieu_travail', label: 'Lieu de travail', type: 'text', required: true },
      { key: 'periode_essai_mois', label: 'Période d\'essai (en mois)', type: 'number', default: '3', required: true },
      { key: 'ville', label: 'Ville', type: 'text', default: 'Dakar', required: true },
    ],
    compliance_rules: [],
    body: `CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)

ENTRE LES SOUSSIGNÉS :
La société {{employeur_nom}}, représentée par sa direction,
Ci-après dénommée « L'Employeur », d'une part,

ET :
Monsieur / Madame {{salarie_nom}},
Ci-après dénommé(e) « Le Salarié », d'autre part.

ARTICLE 1 - ENGAGEMENT ET FONCTIONS
L'Employeur engage le Salarié en qualité de {{intitule_poste}} à compter du {{date_debut}} sous contrat à durée indéterminée.

ARTICLE 2 - PÉRIODE D'ESSAI
Le présent contrat est soumis à une période d'essai de {{periode_essai_mois}} mois, renouvelable une fois conformément aux dispositions légales en vigueur.

ARTICLE 3 - LIEU DE TRAVAIL
Le lieu principal d'exécution de la mission est situé à : {{lieu_travail}}.

ARTICLE 4 - RÉMUNÉRATION
En contrepartie de l'accomplissement de ses fonctions, le Salarié percevra un salaire mensuel brut de {{salaire_base}} Francs CFA.

Fait à {{ville}}, le {{date_debut}}, en double exemplaire.`,
  },

  // ==================== FONCTIONNEMENT ====================
  {
    id: 'tpl-pv-approbation-comptes',
    code: 'pv-ago-approbation-comptes',
    title: 'PV d\'Assemblée Générale Ordinaire (Approbation des comptes)',
    category: 'Fonctionnement',
    description: 'Procès-verbal officiel d\'approbation des états financiers annuels et d\'affectation du résultat net selon l\'OHADA.',
    ohada_reference: 'AUSCGIE Art. 348 & 349',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'denomination', label: 'Dénomination sociale', type: 'text', required: true },
      { key: 'forme_sociale', label: 'Forme sociale (SARL, SAS, SA)', type: 'text', default: 'SARL', required: true },
      { key: 'capital_social', label: 'Capital social (FCFA)', type: 'number', required: true },
      { key: 'siege_social', label: 'Siège social', type: 'text', required: true },
      { key: 'date_ag', label: 'Date de tenue de l\'AG', type: 'date', required: true },
      { key: 'exercice_clos', label: 'Exercice clos au (date)', type: 'date', required: true },
      { key: 'resultat_net', label: 'Résultat net comptable (FCFA)', type: 'number', required: true },
      { key: 'affectation_details', label: 'Affectation du résultat (report à nouveau, dividendes)', type: 'textarea', required: true },
      { key: 'ville', label: 'Ville', type: 'text', default: 'Abidjan', required: true },
    ],
    compliance_rules: [],
    body: `PROCES-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE
SOCIÉTÉ « {{denomination}} {{forme_sociale}} »
Capital social : {{capital_social}} Francs CFA
Siège social : {{siege_social}}

L'an deux mille et le {{date_ag}}, les associés de la société se sont réunis en Assemblée Générale Ordinaire.

L'Assemblée délibère sur l'ordre du jour suivant :
1. Rapport de la gérance sur les activités de l'exercice clos le {{exercice_clos}} ;
2. Examen et approbation des comptes annuels et du bilan ;
3. Affectation du résultat net ;
4. Quitus à la gérance.

RÉSOLUTIONS ADOPTÉES À L'UNANIMITÉ :

PREMIÈRE RÉSOLUTION :
L'Assemblée Générale approuve le rapport de gestion et les états financiers de synthèse pour l'exercice clos le {{exercice_clos}}, faisant apparaître un résultat net de {{resultat_net}} Francs CFA.

DEUXIÈME RÉSOLUTION :
L'Assemblée décide d'affecter le résultat comme suit :
{{affectation_details}}

TROISIÈME RÉSOLUTION :
L'Assemblée donne quitus entier et sans réserve à la Gérance pour l'exécution de son mandat au titre dudit exercice.

Fait à {{ville}}, le {{date_ag}}.`,
  },

  // ==================== RÉSOLUTIONS ====================
  {
    id: 'tpl-pv-transfert-siege',
    code: 'pv-age-transfert-siege',
    title: 'PV d\'Assemblée Extraordinaire (Transfert de siège social)',
    category: 'Résolutions',
    description: 'Procès-verbal de modification statutaire consécutive au changement d\'adresse du siège social de l\'entreprise.',
    ohada_reference: 'AUSCGIE Art. 451',
    country: null,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    variables: [
      { key: 'denomination', label: 'Dénomination de la société', type: 'text', required: true },
      { key: 'ancien_siege', label: 'Ancien siège social', type: 'text', required: true },
      { key: 'nouveau_siege', label: 'Nouveau siège social', type: 'text', required: true },
      { key: 'date_age', label: 'Date de l\'assemblée', type: 'date', required: true },
      { key: 'ville', label: 'Ville', type: 'text', default: 'Abidjan', required: true },
    ],
    compliance_rules: [],
    body: `PROCES-VERBAL DE L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE
« {{denomination}} »

Le {{date_age}}, les associés réunis en Assemblée Générale Extraordinaire ont adopté la résolution suivante :

RÉSOLUTION UNIQUE - TRANSFERT DU SIÈGE SOCIAL ET MODIFICATION STATUTAIRE :
L'Assemblée Générale Extraordinaire décide de transférer le siège social de la société :
- Ancien siège : {{ancien_siege}}
- Nouveau siège : {{nouveau_siege}}

En conséquence, l'article 4 des statuts est modifié afin de refléter la nouvelle adresse du siège social.
Tous pouvoirs sont conférés au porteur d'un original du présent procès-verbal pour accomplir les formalités modificatives auprès du Registre du Commerce et du Crédit Mobilier (RCCM).

Fait à {{ville}}, le {{date_age}}.`,
  },
];
