#!/usr/bin/env python3
"""
Phase 2+3: Update FR corrections and WO translations for lessons 26-52 in mock.js.
Uses targeted regex replacements per card ID.
"""
import re, json, os

MOCK_JS = '/home/claudeuser/xam-xam/src/data/mock.js'
OUTPUT_DIR = '/home/claudeuser/xam-xam/scripts/output'

def escape_js(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")

# All corrections: card_id -> (corrected_fr, corrected_wo)
CARDS = {
    # === VILLE (26) ===
    'ville_01': ("En ville.", "Ci biir dëkk bi."),
    'ville_02': ("Pour trouver son chemin.", "Ngir gis sa yoon."),
    'ville_03': ("Où puis-je trouver des toilettes, s'il vous plaît ?", "Fan laa man a gis wanaag?"),
    'ville_04': ("Pardon, où se trouve le Musée de la femme ?", "Baal ma, fan mooy Mise bu jigéen?"),
    'ville_05': ("Va tout droit jusqu'au rond-point.", "Dem jub ba ca roo-pwee bi."),
    'ville_06': ("C'est la première rue à gauche.", "Moomu mooy njëlbéen wi ci càmmiñ."),
    'ville_07': ("Il faut revenir en arrière et tourner à droite à la station-service.", "War nga dellu ginnaaw te wëndeelu ci ndakaaru ci sitaasiyoŋ serwis bi."),
    'ville_08': ("Le bus.", "Büs bi."),
    'ville_09': ("Où se trouve l'arrêt du bus ?", "Fan la tëralinu büs bi nekk?"),
    'ville_10': ("Quel est le bus qui va à... ?", "Ban büs mooy jëm ci...?"),
    'ville_11': ("Où dois-je descendre pour... ?", "Fan laa war a wàcc ngir...?"),

    # === MUSEES (27) ===
    'musees_01': ("Visite d'expositions, de musées et de sites touristiques.", "Xool ekspozisiyoŋ, mise ak palaas yi."),
    'musees_02': ("Est-ce qu'on peut visiter... ?", "Ndax ñu mën a xool...?"),
    'musees_03': ("Est-ce qu'il y a une visite guidée ?", "Ndax am na wizit gide?"),
    'musees_04': ("Je voudrais un billet pour l'exposition.", "Damaa bëgg benn biyee ngir ekspozisiyoŋ bi."),
    'musees_05': ("Est-ce qu'il y a un tarif réduit pour... ?", "Ndax am na prix bu wàññi ngir...?"),
    'musees_06': ("Les enfants.", "Xale yi."),
    'musees_07': ("Autres curiosités.", "Yeneeni palaas yu sell."),
    'musees_08': ("Cathédrale de Dakar.", "Katedral bu Ndakaaru."),
    'musees_09': ("Désert de Lompoul.", "Suufu Lompoul."),
    'musees_10': ("Marché Sandaga.", "Marse Sandaga."),
    'musees_11': ("Monastère de Keur Moussa.", "Monasteer bu Kër Muusa."),
    'musees_12': ("Palais présidentiel.", "Pale bu Prezidaan bi."),
    'musees_13': ("Réserve de Bandia.", "Reserw bu Bandia."),

    # === POSTE (28) ===
    'poste_01': ("À la poste.", "Ci post bi."),
    'poste_02': ("Je voudrais envoyer ce colis.", "Damaa bëgg yónne kolis bii."),

    # === TELEPHONE (29) ===
    'telephone_01': ("Au téléphone.", "Ci telefon bi."),
    'telephone_02': ("Oui, allô ?", "Waaw, alo?"),
    'telephone_03': ("Bonsoir.", "Nanga def ci ngoon si?"),
    'telephone_04': ("C'est de la part de qui ?", "Kan mooy woo?"),
    'telephone_05': ("C'est de la part d'Anta Dieng.", "Anta Jeŋ la woo."),

    # === INTERNET (30) ===
    'internet_01': ("Internet.", "Enternet."),
    'internet_02': ("Y a-t-il un accès à Internet dans l'hôtel ?", "Ndax am na enternet ci oteel bi?"),
    'internet_03': ("Quel est le code pour le wifi ?", "Lan mooy kodu wifi bi?"),
    'internet_04': ("Sais-tu où il y a un cybercafé par ici ?", "Xam nga fan la siberkafe bi nekk fii?"),
    'internet_05': ("Pouvez-vous imprimer ce fichier ?", "Mën ngeen a imprimer fisiyee bii?"),

    # === ADMINISTRATION (31) ===
    'administration_01': ("L'administration.", "Administrasiyoŋ bi."),
    'administration_02': ("Je cherche l'ambassade...", "Damay wut ambasad bi..."),
    'administration_03': ("...de Belgique.", "...bu Belsik."),
    'administration_04': ("...du Canada.", "...bu Kanada."),
    'administration_05': ("...de France.", "...bu Faraas."),
    'administration_06': ("...de Suisse.", "...bu Suwis."),
    'administration_07': ("Au commissariat.", "Ci komisariya bi."),
    'administration_08': ("J'ai perdu mes papiers.", "Réer naa samay papiye."),
    'administration_09': ("Est-ce que vous pourriez me délivrer une attestation provisoire ?", "Ndax mën ngeen a may ma atestasiyoŋ bu diir?"),
    'administration_10': ("On m'a volé mon sac à l'arraché.", "Sacc nañu ma sama saak, raxas nañu ko."),
    'administration_11': ("Je veux porter plainte.", "Damaa bëgg dajale."),
    'administration_12': ("On m'a volé...", "Sacc nañu ma..."),
    'administration_13': ("...mon appareil photo.", "...sama aparey foto."),
    'administration_14': ("...l'argent que j'avais sur moi.", "...xaalis bi ma amoon ci yaram."),
    'administration_15': ("...ma carte de crédit.", "...sama kart bu kredi."),
    'administration_16': ("...mes chèques de voyage.", "...samay seek bu wiyaas."),
    'administration_17': ("...mes clés.", "...samay caabi."),
    'administration_18': ("...mon ordinateur.", "...sama ordinateer."),
    'administration_19': ("...mes papiers.", "...samay papiye."),
    'administration_20': ("...mon portable.", "...sama portaabal."),
    'administration_21': ("...mon portefeuille.", "...sama portfëy."),
    'administration_22': ("...ma voiture.", "...sama oto."),

    # === BANQUE (32) ===
    'banque_01': ("À la banque.", "Ci baŋk bi."),
    'banque_02': ("Où puis-je trouver... ?", "Fan laa man a gis...?"),
    'banque_03': ("...une banque.", "...benn baŋk."),
    'banque_04': ("...un distributeur automatique.", "...benn distribiteer otomatik."),
    'banque_05': ("Je voudrais...", "Damaa bëgg..."),
    'banque_06': ("...changer des chèques de voyage.", "...soppali samay seek bu wiyaas."),
    'banque_07': ("...encaisser un chèque.", "...ànkeese benn seek."),
    'banque_08': ("...faire un dépôt sur un compte.", "...def benn depo ci benn kont."),
    'banque_09': ("...faire un virement.", "...def benn wirmaŋ."),
    'banque_10': ("...retirer de l'argent.", "...jël xaalis."),

    # === SPECTACLES (33) ===
    'spectacles_01': ("Sorties au cinéma, théâtre et concerts.", "Génn ci sinema, teyaat ak konseer."),
    'spectacles_02': ("Quel est le prix du billet ?", "Ñaata mooy biyee bi?"),

    # === COIFFEUR (34) ===
    'coiffeur_01': ("Chez le coiffeur.", "Ci kwafeer bi."),
    'coiffeur_02': ("Je veux me faire couper les cheveux.", "Damaa bëgg dagg samay kawar."),
    'coiffeur_03': ("Vous pouvez me tresser les cheveux ?", "Mën ngeen a rëdd ma samay kawar?"),

    # === CAMPAGNE (35) ===
    'campagne_01': ("À la campagne, à la plage, à la montagne.", "Ci dëkk ba, ci plaaas bi, ci tund wi."),
    'campagne_02': ("Sports et loisirs.", "Espoor ak njaaxal."),
    'campagne_03': ("Lutte sénégalaise.", "Lamb ji."),
    'campagne_04': ("Judo.", "Judo."),
    'campagne_05': ("Chasse.", "Gànn."),
    'campagne_06': ("Équitation.", "Kaaw fas."),
    'campagne_07': ("Escalade.", "Yagg tund."),
    'campagne_08': ("Pêche.", "Jën."),
    'campagne_09': ("Plongée.", "Dubbo."),
    'campagne_10': ("Quad.", "Kwad."),
    'campagne_11': ("Randonnée.", "Doxantu."),
    'campagne_12': ("Vélo.", "Welo."),
    'campagne_13': ("Nous souhaiterions prendre un cours d'initiation à la lutte.", "Danuy bëgg jàng njëkk ci lamb ji."),
    'campagne_14': ("Peut-on faire une balade à cheval ?", "Ndax ñu mën doxantu ak fas?"),
    'campagne_15': ("À la piscine.", "Ci pisin bi."),
    'campagne_16': ("Combien coûte l'entrée à la piscine ?", "Ñaata la dugg bi pisin bi di jar?"),
    'campagne_17': ("Est-ce qu'il y a une piscine pour les enfants ?", "Ndax am na pisin bu xale yi?"),
    'campagne_18': ("Quel est le chemin pour aller à la plage ?", "Yoon wi ngir jëm ci plaaas bi, fan la?"),
    'campagne_19': ("Je cherche une plage surveillée.", "Damay wut plaaas bu ñu seet."),
    'campagne_20': ("Je voudrais louer...", "Damaa bëgg luwe..."),
    'campagne_21': ("...un parasol.", "...benn parasol."),
    'campagne_22': ("...une serviette.", "...benn serwiyeet."),

    # === CAMPING (36) ===
    'camping_01': ("Camper et camping.", "Kampe ak kampiŋ."),
    'camping_02': ("Quel est le tarif pour... ?", "Ñaata la ngir...?"),
    'camping_03': ("Est-ce que les chambres ont des douches individuelles ?", "Ndax nég yi am nañu duus bu seen bopp?"),
    'camping_04': ("Est-il possible de planter notre tente ici pour cette nuit ?", "Ndax mën nañu tëdd sunu tànt fii guddi gii?"),
    'camping_05': ("Arbres et plantes sauvages.", "Garab yi ak ub yi wu àll."),
    'camping_06': ("Faut-il une autorisation pour visiter le Parc national du Niokolo-Koba ?", "Ndax am na otorizasiyoŋ ngir xool Park nasiyonal bu Ñokoloo-Koba?"),
    'camping_07': ("Peux-tu me dire...", "Mën nga ma wax..."),
    'camping_08': ("...ce qui est interdit dans le parc ?", "...li ñu tere ci park bi?"),
    'camping_09': ("Acacia albida.", "Kadd."),

    # === ANIMAUX (37) ===
    'animaux_01': ("Animaux.", "Mala yi."),
    'animaux_02': ("Âne.", "Mbaam-sëf."),
    'animaux_03': ("Caïman.", "Kaymaan."),
    'animaux_04': ("Chacal.", "Buuki."),
    'animaux_05': ("Chat.", "Muus."),
    'animaux_06': ("Cheval.", "Fas."),
    'animaux_07': ("Couleuvre.", "Jaan."),
    'animaux_08': ("Écureuil.", "Jaar."),
    'animaux_09': ("Gazelle.", "Gasel."),
    'animaux_10': ("Gibier.", "Jibi."),
    'animaux_11': ("Grenouille.", "Mbott."),
    'animaux_12': ("Hyène.", "Bukki."),
    'animaux_13': ("Lapin.", "Lapën."),
    'animaux_14': ("Lézard.", "Lesar."),
    'animaux_15': ("Lièvre.", "Léwru."),
    'animaux_16': ("Perdrix.", "Mbisaan."),
    'animaux_17': ("Phacochère.", "Mbaam-àll."),
    'animaux_18': ("Pigeon.", "Piis."),
    'animaux_19': ("Pintade.", "Jëntaaga."),
    'animaux_20': ("Rat.", "Kaña."),
    'animaux_21': ("Singe.", "Golo."),
    'animaux_22': ("Souris.", "Janax."),
    'animaux_23': ("Vipère.", "Jaas."),
    'animaux_24': ("Insectes.", "Gunóor yi."),
    'animaux_25': ("Abeille.", "Yamb."),
    'animaux_26': ("Araignée.", "Jargoñ."),
    'animaux_27': ("Cafard.", "Bëñ."),
    'animaux_28': ("Chenille.", "Lënk."),
    'animaux_29': ("Guêpe.", "Wàpp."),
    'animaux_30': ("Mouche.", "Wécc."),
    'animaux_31': ("Moustique.", "Ween."),
    'animaux_32': ("Scorpion.", "Saxtaana."),
    'animaux_33': ("Tique.", "Wëtt."),
    'animaux_34': ("J'ai été piqué par un scorpion.", "Saxtaana dafa ma toob."),
    'animaux_35': ("J'ai besoin d'un antivenin contre les morsures de vipère.", "Damaa soxla àntivenan ngir matt bu jaas."),
    'animaux_36': ("Je voudrais un répulsif contre les moustiques.", "Damaa bëgg repilsif ngir ween yi."),
    'animaux_37': ("Vous avez des moustiquaires ?", "Am ngeen mustikeeri?"),
    'animaux_38': ("Je suis allergique.", "Alersi laa."),

    # === HEBERGEMENT (38) ===
    'hebergement_01': ("Hébergement.", "Dëkkuwaay."),
    'hebergement_02': ("Réservation d'hôtel.", "Reserwe oteel."),
    'hebergement_03': ("J'aurais besoin...", "Damaa soxla..."),
    'hebergement_04': ("...d'une chambre avec un lit double.", "...benn nég bu am lal bu ñaari nit."),
    'hebergement_05': ("...d'une chambre double avec un lit d'appoint.", "...benn nég bu ñaari nit ak benn lal bu yokk."),
    'hebergement_06': ("Nous sommes deux adultes et deux enfants.", "Ñaar noo nekk mag ak ñaari xale."),
    'hebergement_07': ("Nous resterons du 10 au 17 avril.", "Danuy toog dale ci 10 ba 17 awril."),
    'hebergement_08': ("Vous devez laisser une caution à la réservation.", "War ngeen bàyyi kosiyoŋ ci reserwe bi."),
    'hebergement_09': ("Est-ce que le prix comprend le petit-déjeuner ?", "Ndax pri bi am na petit-dejëne?"),
    'hebergement_10': ("Est-ce qu'il y a la climatisation dans les chambres ?", "Ndax am na klimatizasiyoŋ ci nég yi?"),
    'hebergement_11': ("À la réception.", "Ci resepsiyoŋ bi."),
    'hebergement_12': ("J'ai réservé une chambre au nom de...", "Reserwe naa benn nég ci tur bu..."),
    'hebergement_13': ("Pour combien de nuits ?", "Ngir ñaata guddi?"),
    'hebergement_14': ("Pouvez-vous me réveiller demain à 6h ?", "Mën ngeen a fexee ma ëllëg ci 6 waxtu?"),
    'hebergement_15': ("À quelle heure devons-nous rendre la clé ?", "Ban waxtu lañu war a delloo caabi bi?"),
    'hebergement_16': ("Vocabulaire des services.", "Baat yi ci serwiis yi."),
    'hebergement_17': ("Vous avez des consignes à bagages ?", "Am ngeen koñsiñ bu bagaas?"),
    'hebergement_18': ("Pouvez-vous garder nos bagages jusqu'à ce soir ?", "Mën ngeen a denc sunu bagaas ba ngoon si?"),
    'hebergement_19': ("Est-ce qu'il y a le wifi dans les chambres ?", "Ndax am na wifi ci nég yi?"),
    'hebergement_20': ("Pouvez-vous me faire... ?", "Mën ngeen a def ma...?"),
    'hebergement_21': ("...un café noir.", "...benn kafe bu ñuul."),
    'hebergement_22': ("...un jus d'orange.", "...benn jus doraas."),
    'hebergement_23': ("...une tartine jambon tomates.", "...benn tartiin jambóŋ ak tamaat."),
    'hebergement_24': ("...une tartine beurrée.", "...benn tartiin bu bër."),
    'hebergement_25': ("En cas de petits problèmes.", "Su am na ay ndaw jafe-jafe."),
    'hebergement_26': ("Le robinet fuit.", "Robine bi dafay tooy."),
    'hebergement_27': ("Une ampoule a grillé.", "Benn àmpul dafa sànni."),
    'hebergement_28': ("Régler la note.", "Fey adisiyoŋ bi."),
    'hebergement_29': ("Je peux payer...", "Mën naa fey..."),

    # === RESTAURANT (39) ===
    'restaurant_01': ("Au restaurant.", "Ci restoraaŋ bi."),
    'restaurant_02': ("Bonsoir, j'ai réservé une table.", "Nanga def, reserwe naa benn taabul."),
    'restaurant_03': ("Je voudrais réserver une table pour ce soir.", "Damaa bëgg reserwe benn taabul ngir ngoon sii."),
    'restaurant_04': ("Pour 22 heures, pour 4 personnes.", "Ngir 22 waxtu, ngir ñeenti nit."),
    'restaurant_05': ("Auriez-vous une table pour 6 personnes ?", "Am ngeen benn taabul bu juróom benni nit?"),
    'restaurant_06': ("Avez-vous réservé ?", "Reserwe ngeen?"),
    'restaurant_07': ("Avez-vous un menu ?", "Am ngeen menu?"),
    'restaurant_08': ("Vous avez choisi ?", "Tànn ngeen?"),
    'restaurant_09': ("Vous le préférez frit ou grillé ?", "Mbaa bëgg ngeen ko firi walla grillee?"),
    'restaurant_10': ("Quelle est la garniture ?", "Lan mooy garnitir bi?"),
    'restaurant_11': ("Bleu.", "Blë."),
    'restaurant_12': ("...un autre couteau.", "...beneen paka."),
    'restaurant_13': ("...une serviette.", "...benn serwiyeet."),
    'restaurant_14': ("...du pain.", "...mburu."),
    'restaurant_15': ("Qu'est-ce que vous avez comme glace ?", "Lan ngeen am ci galaas?"),
    'restaurant_16': ("Où sont les toilettes, s'il vous plaît ?", "Fan lañu wanaag yi nekk?"),
    'restaurant_17': ("Spécialités et plats traditionnels.", "Speesalite ak ñam yu cosaan."),

    # === METS (40) ===
    'mets_01': ("Vocabulaire des mets et produits.", "Baat yi ci ñam yi ak produi yi."),
    'mets_02': ("La boucherie.", "Busri bi."),
    'mets_03': ("Agneau.", "Xar bu ndaw."),
    'mets_04': ("Blanc de poulet.", "Blaŋ bu ginaar."),
    'mets_05': ("Bœuf.", "Nag."),
    'mets_06': ("Côte d'agneau.", "Kot bu xar."),
    'mets_07': ("Côte de porc.", "Kot bu mbaam."),
    'mets_08': ("Côte de veau.", "Kot bu mbaam-bëy."),
    'mets_09': ("Cuisse.", "Tànk."),
    'mets_10': ("Dinde.", "Deend."),
    'mets_11': ("Épaule.", "Bewet."),
    'mets_12': ("Filet de bœuf.", "File bu nag."),
    'mets_13': ("Filet de porc.", "File bu mbaam."),
    'mets_14': ("Lapin.", "Lapën."),
    'mets_15': ("Mouton.", "Xar."),
    'mets_16': ("Poulet.", "Ginaar."),
    'mets_17': ("Steak.", "Steek."),
    'mets_18': ("Escalope.", "Eskalop."),
    'mets_19': ("Veau.", "Mbaam-bëy."),
    'mets_20': ("La charcuterie.", "Sarkiteri bi."),
    'mets_21': ("Cervelle.", "Xel."),
    'mets_22': ("Cœur.", "Xol."),
    'mets_23': ("Foie.", "Res."),
    'mets_24': ("Jambon.", "Jambóŋ."),
    'mets_25': ("Langue.", "Lammiñ."),
    'mets_26': ("Rognon.", "Roñoŋ."),
    'mets_27': ("Saucisse.", "Sosis."),
    'mets_28': ("Saucisson.", "Sosisoŋ."),
    'mets_29': ("Tranches de jambon.", "Pees bu jambóŋ."),
    'mets_30': ("Tranches de saucisson.", "Pees bu sosisoŋ."),
    'mets_31': ("La poissonnerie.", "Jëndaayu jën."),
    'mets_32': ("Donnez-moi trois darnes de mérou.", "May ma ñetti daarn bu meeru."),
    'mets_33': ("Pouvez-vous me vider cette dorade ?", "Mën ngeen a dàqal ma doraad bii?"),
    'mets_34': ("Carpe.", "Kaarp."),
    'mets_35': ("Chinchard.", "Yabooy."),
    'mets_36': ("Crevette.", "Sipax."),
    'mets_37': ("Dorade.", "Doraad."),
    'mets_38': ("Gambas.", "Gàmbas."),
    'mets_39': ("Huître.", "Yoxos."),
    'mets_40': ("Langouste.", "Langust."),
    'mets_41': ("Mulet.", "Mulóŋ."),
    'mets_42': ("Sardine.", "Sardiin."),
    'mets_43': ("Sèche.", "Sec."),
    'mets_44': ("Sole.", "Sol."),
    'mets_45': ("Thon.", "Tóŋ."),
    'mets_46': ("Les fruits et légumes.", "Meññ yi ak leguuŋ yi."),
    'mets_47': ("Ail.", "Laay."),
    'mets_48': ("Ananas.", "Anana."),
    'mets_49': ("Aubergine.", "Berseŋ."),
    'mets_50': ("Avocat.", "Awoka."),
    'mets_51': ("Banane.", "Banaan."),
    'mets_52': ("Carotte.", "Karot."),
    'mets_53': ("Citron.", "Limoŋ."),
    'mets_54': ("Concombre.", "Koŋkomb."),
    'mets_55': ("Courgette.", "Kurset."),
    'mets_56': ("Chou-fleur.", "Su-flër."),
    'mets_57': ("Haricot vert, haricot blanc.", "Ariko weer, ariko weex."),
    'mets_58': ("Lentilles.", "Laanti."),
    'mets_59': ("Manioc.", "Ñambi."),
    'mets_60': ("Melon.", "Meloŋ."),
    'mets_61': ("Navet.", "Nawe."),
    'mets_62': ("Noix de coco.", "Koko."),
    'mets_63': ("Oignon.", "Soble."),
    'mets_64': ("Olive.", "Oliw."),
    'mets_65': ("Orange.", "Oraas."),
    'mets_66': ("Pamplemousse.", "Pàmpëlumus."),
    'mets_67': ("Pastèque.", "Xaal."),
    'mets_68': ("Mangue.", "Mango."),
    'mets_69': ("Petit pois.", "Peti powa."),
    'mets_70': ("Piment.", "Kani."),
    'mets_71': ("Poireau.", "Pwaro."),
    'mets_72': ("Poivron.", "Pwaworoŋ."),
    'mets_73': ("Pomme de terre.", "Pombiteer."),
    'mets_74': ("Pomme.", "Pom."),
    'mets_75': ("Raisin.", "Reseŋ."),
    'mets_76': ("Tomate.", "Tamaat."),
    'mets_77': ("Façon de préparer et sauces.", "Njaay ju tabax ak saas yi."),
    'mets_78': ("Préparations des plats.", "Tabaxu ñam yi."),
    'mets_79': ("Bouilli.", "Xëmm."),
    'mets_80': ("Braisé.", "Brese."),
    'mets_81': ("Brochette.", "Dibi."),
    'mets_82': ("En sauce.", "Ci saas."),
    'mets_83': ("Farci.", "Feex."),
    'mets_84': ("Fumé.", "Géej."),
    'mets_85': ("Grillé.", "Sëlëm."),
    'mets_86': ("Frit.", "Firi."),
    'mets_87': ("Salé.", "Xorom."),
    'mets_88': ("Mariné.", "Marinee."),
    'mets_89': ("Rôti.", "Rooti."),
    'mets_90': ("Pané.", "Panee."),

    # === ALCOOL (41) ===
    'alcool_01': ("Boissons alcoolisées.", "Naan yu alkol."),
    'alcool_02': ("Qu'est-ce que vous prendrez comme boisson ?", "Lan ngeen di naan?"),
    'alcool_03': ("Vous avez la carte des vins ?", "Am ngeen kart bu diwaŋ bi?"),
    'alcool_04': ("Pouvez-vous m'apporter... ?", "Mën ngeen a indil ma...?"),
    'alcool_05': ("Un verre de...", "Benn weer bu..."),
    'alcool_06': ("Une demi-bouteille de...", "Genn-wàll bu buteey bu..."),
    'alcool_07': ("Une bouteille de...", "Benn buteey bu..."),
    'alcool_08': ("Une bière.", "Benn biyer."),
    'alcool_09': ("Je vais manger du poisson.", "Dinaa lekk jën."),

    # === BOISSONS (42) ===
    'boissons_01': ("Autres boissons.", "Yeneeni naan."),
    'boissons_02': ("Je vais prendre...", "Dinaa jël..."),
    'boissons_03': ("...un café.", "...benn kafe."),
    'boissons_04': ("Un café au lait.", "Benn kafe bu meew."),
    'boissons_05': ("Un café glacé.", "Benn kafe bu sedd."),
    'boissons_06': ("Un chocolat.", "Benn sokolaa."),
    'boissons_07': ("Une eau minérale.", "Benn ndox mineral."),
    'boissons_08': ("Un thé au lait.", "Benn ataaya bu meew."),
    'boissons_09': ("Un jus de fruit.", "Benn jus bu meññ."),
    'boissons_10': ("Un thé.", "Benn ataaya."),
    'boissons_11': ("Pouvez-vous nous apporter une carafe d'eau ?", "Mën ngeen a indil nu benn karaf bu ndox?"),
    'boissons_12': ("Je voudrais un café.", "Damaa bëgg benn kafe."),

    # === MAGASINS (43) ===
    'magasins_01': ("Magasins et services.", "Bitik yi ak serwiis yi."),
    'magasins_02': ("Je cherche...", "Damay wut..."),
    'magasins_03': ("...un fleuriste.", "...benn flerist."),
    'magasins_04': ("Ce n'est pas très cher.", "Dëru-ul lool."),
    'magasins_05': ("Mets-moi un kilo.", "Tegal ma benn kilo."),
    'magasins_06': ("Ça fait 1500 francs CFA.", "Amu na 1500 dërëm."),
    'magasins_07': ("Livres, revues, journaux, musique.", "Téere yi, rebii yi, jourñaal yi, misik."),
    'magasins_08': ("Un kiosque à journaux dans le coin ?", "Am na kiyosk bu jourñaal fii ci wetu?"),
    'magasins_09': ("Une librairie par ici ?", "Am na libereeri fii ci wetu?"),
    'magasins_10': ("Est-ce que vous avez... ?", "Ndax am ngeen...?"),
    'magasins_11': ("...des journaux en français.", "...jourñaal ci faransee."),
    'magasins_12': ("Auriez-vous des livres sur les traditions ?", "Ndax am ngeen téere ci cosaan?"),
    'magasins_13': ("Je voudrais acheter l'album de cet artiste.", "Damaa bëgg jënd àlbuŋ bu artis bii."),
    'magasins_14': ("Est-ce que vous avez un artiste à me recommander ?", "Ndax am ngeen benn artis ngir ma rekomàndee?"),
    'magasins_15': ("Blanchisserie, teinturerie.", "Blaŋsisri, teŋtiirëri."),
    'magasins_16': ("Repassage.", "Pasaas."),
    'magasins_17': ("Je vous laisse ces vêtements.", "Damay bàyyi yéen yëreem yii."),
    'magasins_18': ("Ils seront prêts pour quand ?", "Kañ lañuy pare?"),
    'magasins_19': ("Ils sont propres.", "Set nañu."),

    # === VETEMENTS (44) ===
    'vetements_01': ("Vêtements et chaussures.", "Yëreem yi ak dàll yi."),
    'vetements_02': ("Où sont les cabines d'essayage ?", "Fan la kabin deseyaas yi nekk?"),
    'vetements_03': ("C'est trop serré.", "Dafa rëy lool."),
    'vetements_04': ("Ça me serre.", "Dafay ma rëcc."),
    'vetements_05': ("Ça me va.", "Baax na ci man."),

    # === TABAC (45) ===
    'tabac_01': ("Bureau de tabac.", "Biro bu taaba."),
    'tabac_02': ("Je voudrais...", "Damaa bëgg..."),
    'tabac_03': ("...un paquet de cigarettes.", "...benn pake bu sigareet."),
    'tabac_04': ("...une cartouche de...", "...benn kartus bu..."),
    'tabac_05': ("...une boîte d'allumettes.", "...benn boyit bu alimet."),
    'tabac_06': ("...un briquet.", "...benn brike."),
    'tabac_07': ("...du tabac à rouler.", "...taaba bu roole."),
    'tabac_08': ("...des feuilles de tabac à rouler.", "...ay fëy bu taaba bu roole."),
    'tabac_09': ("...une recharge pour cigarette électronique.", "...benn resaars ngir sigareet elektronik."),

    # === PHOTO (46) ===
    'photo_01': ("Photo.", "Foto."),
    'photo_02': ("Carte mémoire.", "Kart memwaar."),
    'photo_03': ("Chargeur.", "Saarsëer."),
    'photo_04': ("Je voudrais faire imprimer ces photos.", "Damaa bëgg imprimer foto yii."),
    'photo_05': ("Mon appareil ne marche pas bien.", "Sama aparey du dox bu baax."),
    'photo_06': ("Vous pouvez nous prendre en photo, s'il vous plaît ?", "Mën ngeen a dëkkal nu foto?"),
    'photo_07': ("Est-ce que je peux vous prendre en photo ?", "Ndax mën naa la dëkkal foto?"),
    'photo_08': ("A-t-on le droit de prendre des photos ici ?", "Ndax mën nañu def foto fii?"),
    'photo_09': ("Vous pouvez prendre des photos sans flash.", "Mën ngeen a def foto te xampe bu amul."),

    # === PROVISIONS (47) ===
    'provisions_01': ("Provisions.", "Proviziyoŋ."),
    'provisions_02': ("Alimentation.", "Ñamte."),
    'provisions_03': ("Beurre.", "Bër."),
    'provisions_04': ("Biscuit.", "Bisko."),
    'provisions_05': ("Bonbon.", "Bonboŋ."),
    'provisions_06': ("Confiture.", "Koŋfitir."),
    'provisions_07': ("Farine.", "Fuñu."),
    'provisions_08': ("Glace.", "Galaas."),
    'provisions_09': ("Huile.", "Diw."),
    'provisions_10': ("Lait.", "Meew."),
    'provisions_11': ("Moutarde.", "Mutard."),
    'provisions_12': ("Œuf.", "Nen."),
    'provisions_13': ("Olive.", "Oliw."),
    'provisions_14': ("Pain.", "Mburu."),
    'provisions_15': ("Pâte.", "Paat."),
    'provisions_16': ("Poivre.", "Puwaar."),
    'provisions_17': ("Riz.", "Ceeb."),
    'provisions_18': ("Sandwich.", "Sàndwis."),
    'provisions_19': ("Sel.", "Xorom."),
    'provisions_20': ("Sucre.", "Suukër."),
    'provisions_21': ("Vin.", "Diwaŋ."),
    'provisions_22': ("Vinaigre.", "Winegër."),
    'provisions_23': ("Hygiène et soins.", "Iyeen ak wéetal."),
    'provisions_24': ("Brosse à dents.", "Bëros bu bëñ."),
    'provisions_25': ("Couches pour bébé.", "Kuus bu gone."),
    'provisions_26': ("Dentifrice.", "Dàntifris."),
    'provisions_27': ("Déodorant.", "Deyodoraŋ."),
    'provisions_28': ("Lame de rasoir.", "Laam bu rasuwaar."),
    'provisions_29': ("Mascara.", "Maskara."),
    'provisions_30': ("Mouchoirs en papier.", "Musuwaar bu papiye."),
    'provisions_31': ("Papier toilette.", "Papiye bu wanaag."),
    'provisions_32': ("Parfum.", "Parfëŋ."),
    'provisions_33': ("Peigne.", "Xaas."),
    'provisions_34': ("Rouge à lèvres.", "Ruus a leewr."),
    'provisions_35': ("Savon.", "Saafuŋ."),
    'provisions_36': ("Shampooing.", "Sàmpuwee."),

    # === SOUVENIRS (48) ===
    'souvenirs_01': ("Souvenirs.", "Fattaliku."),
    'souvenirs_02': ("Je voudrais ramener un souvenir du Sénégal à des amis.", "Damaa bëgg yóbbu fattaliku bu Senegaal ngir samay xarit."),
    'souvenirs_03': ("Je voudrais acheter un masque africain.", "Damaa bëgg jënd benn mask bu Afrik."),
    'souvenirs_04': ("Je peux voir les bijoux ?", "Mën naa xool bij yi?"),
    'souvenirs_05': ("Je vais prendre...", "Dinaa jël..."),
    'souvenirs_06': ("...ce bracelet.", "...barsëlë bii."),
    'souvenirs_07': ("...ce collier.", "...kolee bii."),
    'souvenirs_08': ("...cette montre.", "...moŋtr bii."),
    'souvenirs_09': ("C'est combien ?", "Ñaata la?"),
    'souvenirs_10': ("C'est pour un cadeau. Tu pourrais me l'envelopper ?", "Ndimbal la. Mën nga ma ko mbale?"),

    # === RDV-PRO (49) ===
    'rdv-pro_01': ("Rendez-vous professionnel.", "Rànde-wu profesiyonel."),
    'rdv-pro_02': ("Pourriez-vous me donner un rendez-vous avec Madame Diop ?", "Mën ngeen a may ma rànde-wu ak Maam Jóob?"),
    'rdv-pro_03': ("Mardi à 17h.", "Talaata ci 17 waxtu."),
    'rdv-pro_04': ("Parfait, faisons comme ça.", "Baax na, def nañu ko noonu."),
    'rdv-pro_05': ("Visiter l'entreprise.", "Xool àntëpriis bi."),
    'rdv-pro_06': ("L'atelier.", "Atelee bi."),
    'rdv-pro_07': ("Je vous laisse ma carte de visite.", "Damay bàyyi leen sama kart bu wizit."),

    # === SANTE (50) ===
    'sante_01': ("Santé.", "Wergu yaram."),
    'sante_02': ("Chez le médecin.", "Ci doktoor bi."),
    'sante_03': ("J'ai besoin d'aller aux urgences.", "Soxla naa jëm ci irjaas bi."),
    'sante_04': ("Je ne me sens pas bien.", "Baaxu ma."),
    'sante_05': ("Je suis malade.", "Feebar naa."),
    'sante_06': ("Quand est-ce qu'il pourra me voir ?", "Kañ la mën a gis ma?"),
    'sante_07': ("Symptômes.", "Sintom yi."),
    'sante_08': ("J'ai des frissons.", "Dama tàng-sedd."),
    'sante_09': ("Je suis constipé.", "Dama koŋstipe."),
    'sante_10': ("J'ai des rougeurs.", "Am naa xuuge."),
    'sante_11': ("Ça me démange.", "Dafay ma yoxo."),
    'sante_12': ("J'ai mal quand je bouge le bras.", "Dafa metti su ma toxoe sama loxo."),
    'sante_13': ("J'ai mal quand je marche.", "Dafa metti su ma doxee."),
    'sante_14': ("Je crois que j'ai de l'hypertension.", "Man naa am tànsiyoŋ bu kawe."),
    'sante_15': ("Je crois que j'ai une baisse de tension.", "Man naa am tànsiyoŋ bu suuf."),
    'sante_16': ("Douleur et parties du corps.", "Metit ak yaram wi."),
    'sante_17': ("...aux articulations.", "...ci samay artikilaasiyoŋ."),
    'sante_18': ("Je me suis brûlé.", "Tàng naa."),
    'sante_19': ("...le nez.", "...bakkan bi."),
    'sante_20': ("Santé de la femme.", "Wergub jigéen ji."),
    'sante_21': ("J'ai un retard de deux mois.", "Am naa ñaari weer yu ma ñàkk."),
    'sante_22': ("Je suis enceinte.", "Ëmb naa."),
    'sante_23': ("J'aurais besoin de passer une échographie.", "Soxla naa def benn ekografi."),

    # === LECON51 (51) ===
    'lecon51_01': ("Soins médicaux.", "Wéetalu doktoor."),
    'lecon51_02': ("Je vais vous ausculter.", "Dinaa la seet."),
    'lecon51_03': ("Il faut faire...", "War na def..."),
    'lecon51_04': ("...quelques examens.", "...ay egzamen."),
    'lecon51_05': ("Je vais vous envoyer chez un spécialiste.", "Dinaa la yónne ci benn spesiyalist."),
    'lecon51_06': ("Vous allez devoir...", "Dinaa war..."),
    'lecon51_07': ("Il faut vous faire des piqûres.", "War nañu la def ay pikir."),
    'lecon51_08': ("Est-ce que vous êtes allergique à un médicament ?", "Ndax alersi nga ci benn garab?"),
    'lecon51_09': ("Chez le dentiste.", "Ci dàntist bi."),
    'lecon51_10': ("J'ai un abcès.", "Am naa benn absee."),
    'lecon51_11': ("Je vais devoir vous arracher une dent.", "Dinaa war a raxas la benn bëñ."),
    'lecon51_12': ("Vous pouvez ouvrir la bouche.", "Mën nga ubbi sa gémmiñ."),
    'lecon51_13': ("Crachez.", "Tuufi."),
    'lecon51_14': ("Chez l'ophtalmologue.", "Ci oftalmolog bi."),
    'lecon51_15': ("J'ai cassé un verre.", "Dafa dagg benn weer."),
    'lecon51_16': ("J'ai quelque chose dans l'œil, ça me fait mal.", "Am naa dara ci sama bët, dafay metti."),
    'lecon51_17': ("Pourriez-vous...", "Mën ngeen a..."),
    'lecon51_18': ("...me montrer des montures ?", "...won ma ay moŋtir?"),
    'lecon51_19': ("Je voudrais des lunettes de soleil avec une bonne protection.", "Damaa bëgg lineti bu jant bu am proteksiyoŋ bu baax."),

    # === LECON52 (52) ===
    'lecon52_01': ("À la pharmacie.", "Ci farmasi bi."),
    'lecon52_02': ("Pouvez-vous m'indiquer une pharmacie ?", "Mën ngeen a won ma benn farmasi?"),
    'lecon52_03': ("J'ai une ordonnance.", "Am naa benn ordoñaans."),
    'lecon52_04': ("Est-ce que je peux prendre ce médicament sans ordonnance ?", "Ndax mën naa jël garab gii te ordoñaans amul?"),
    'lecon52_05': ("Est-ce que je peux prendre ces médicaments ensemble ?", "Ndax mën naa jël garab yii ñaari yépp?"),
    'lecon52_06': ("Pouvez-vous me donner quelque chose contre...", "Mën ngeen a may ma dara ngir..."),
    'lecon52_07': ("...les brûlures.", "...tàng bi."),
    'lecon52_08': ("...du coton.", "...kotoŋ."),
    'lecon52_09': ("...quelque chose contre la fièvre.", "...dara ngir féebar bu tàng."),
    'lecon52_10': ("...des pansements.", "...ay pànsëmaŋ."),
}

def main():
    with open(MOCK_JS, 'r') as f:
        content = f.read()

    updated = 0
    errors = []

    for card_id, (new_fr, new_wo) in CARDS.items():
        fr_esc = escape_js(new_fr)
        wo_esc = escape_js(new_wo)

        # Match the existing card line by its ID
        # Pattern: { id: 'card_id', lessonId: '...', position: N, wo: '...', fr: '...', audioWo: ..., audioFr: ... },
        pattern = re.compile(
            r"(\{\s*id:\s*'" + re.escape(card_id) + r"',\s*lessonId:\s*'[^']*',\s*position:\s*\d+,\s*)"
            r"wo:\s*'(?:[^'\\]|\\.)*',\s*fr:\s*'(?:[^'\\]|\\.)*'"
            r"(,\s*audioWo:[^}]+\})"
        )

        match = pattern.search(content)
        if match:
            old = match.group(0)
            new = f"{match.group(1)}wo: '{wo_esc}', fr: '{fr_esc}'{match.group(2)}"
            content = content.replace(old, new, 1)
            updated += 1
        else:
            errors.append(card_id)

    with open(MOCK_JS, 'w') as f:
        f.write(content)

    print(f"Updated {updated}/{len(CARDS)} cards in mock.js")
    if errors:
        print(f"Errors ({len(errors)}):")
        for e in errors:
            print(f"  - {e}")

    # Also update JSON files
    for lesson_id in ['ville','musees','poste','telephone','internet','administration','banque',
                       'spectacles','coiffeur','campagne','camping','animaux','hebergement',
                       'restaurant','mets','alcool','boissons','magasins','vetements','tabac',
                       'photo','provisions','souvenirs','rdv-pro','sante','lecon51','lecon52']:
        json_path = os.path.join(OUTPUT_DIR, f'lesson_{lesson_id}.json')
        with open(json_path, 'r') as f:
            data = json.load(f)

        changed = False
        for c in data['cards']:
            cid = c['id']
            if cid in CARDS:
                new_fr, new_wo = CARDS[cid]
                c['fr'] = new_fr
                c['wo'] = new_wo
                changed = True

        if changed:
            with open(json_path, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    print("JSON files updated.")

if __name__ == '__main__':
    main()
