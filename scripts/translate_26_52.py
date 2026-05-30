#!/usr/bin/env python3
"""
Phase 2+3: Correct FR transcriptions, add WO translations, inject into mock.js.
"""
import json, re, os

OUTPUT_DIR = '/home/claudeuser/xam-xam/scripts/output'
MOCK_JS = '/home/claudeuser/xam-xam/src/data/mock.js'

# ============================================================
# CORRECTIONS FR + TRADUCTIONS WO
# Format: lesson_id -> { card_position: (corrected_fr, wolof_translation) }
# If fr is None, keep the Whisper transcription as-is
# ============================================================

TRANSLATIONS = {
    'ville': {
        1:  ("En ville.", "Ci biir dëkk bi."),
        2:  ("Pour trouver son chemin.", "Ngir gis sa yoon."),
        3:  ("Où puis-je trouver des toilettes, s'il vous plaît ?", "Fan laa man a gis wanaag?"),
        4:  ("Pardon, où se trouve le Musée de la femme ?", "Baal ma, fan mooy Mise bi mu jigéen?"),
        5:  ("Va tout droit jusqu'au rond-point.", "Dem jub ba ca roo-pwee bi."),
        6:  ("C'est la première rue à gauche.", "Moomu mooy njëlbéen wi ci càmmiñ."),
        7:  ("Il faut revenir en arrière et tourner à droite à la station-service.", "War nga dellu ginnaaw te wëndeelu ci ndakaaru ci sitaasiyoŋ serwis bi."),
        8:  ("Le bus.", "Büs bi."),
        9:  ("Où se trouve l'arrêt du bus ?", "Fan la tëralinu büs bi nekk?"),
        10: ("Quel est le bus qui va à... ?", "Ban büs mooy jëm ci...?"),
        11: ("Où dois-je descendre pour... ?", "Fan laa war a wàcc ngir...?"),
    },
    'musees': {
        1:  ("Visite d'expositions, de musées et de sites touristiques.", "Xool ekspozisiyoŋ, mise ak palaas yi."),
        2:  ("Est-ce qu'on peut visiter... ?", "Ndax ñu mën a xool...?"),
        3:  ("Est-ce qu'il y a une visite guidée ?", "Ndax am na wizit gide?"),
        4:  ("Je voudrais un billet pour l'exposition.", "Damaa bëgg benn biyee ngir ekspozisiyoŋ bi."),
        5:  ("Est-ce qu'il y a un tarif réduit pour... ?", "Ndax am na prix bu wàññi ngir...?"),
        6:  ("Les enfants.", "Xale yi."),
        7:  ("Autres curiosités.", "Yeneeni palaas yu sell."),
        8:  ("Cathédrale de Dakar.", "Katedral bu Ndakaaru."),
        9:  ("Désert de Lompoul.", "Suufu Lompoul."),
        10: ("Marché Sandaga.", "Marse Sandaga."),
        11: ("Monastère de Keur Moussa.", "Monasteer bu Kër Muusa."),
        12: ("Palais présidentiel.", "Pale bu Prezidaan bi."),
        13: ("Réserve de Bandia.", "Reserw bu Bandia."),
    },
    'poste': {
        1:  ("À la poste.", "Ci post bi."),
        2:  ("Je voudrais envoyer ce colis.", "Damaa bëgg yónne kolis bii."),
    },
    'telephone': {
        1:  ("Au téléphone.", "Ci telefon bi."),
        2:  ("Oui, allô ?", "Waaw, alo?"),
        3:  ("Bonsoir.", "Nanga def ci ngoon si?"),
        4:  ("C'est de la part de qui ?", "Kan mooy woo?"),
        5:  ("C'est de la part de Anta Dieng.", "Anta Jeŋ la woo."),
    },
    'internet': {
        1:  ("Internet.", "Enternet."),
        2:  ("Y a-t-il un accès à Internet dans l'hôtel ?", "Ndax am na enternet ci oteel bi?"),
        3:  ("Quel est le code pour le wifi ?", "Lan mooy kodu wifi bi?"),
        4:  ("Sais-tu où il y a un cybercafé par ici ?", "Xam nga fan la siberkafe bi nekk fii?"),
        5:  ("Pouvez-vous imprimer ce fichier ?", "Mën ngeen a imprimer fisiyee bii?"),
    },
    'administration': {
        1:  ("L'administration.", "Administrasiyoŋ bi."),
        2:  ("Je cherche l'ambassade...", "Damay wut ambasad bi..."),
        3:  ("...de Belgique.", "...bu Belsik."),
        4:  ("...du Canada.", "...bu Kanada."),
        5:  ("...de France.", "...bu Faraas."),
        6:  ("...de Suisse.", "...bu Suwis."),
        7:  ("Au commissariat.", "Ci komisariya bi."),
        8:  ("J'ai perdu mes papiers.", "Réer naa samay papiye."),
        9:  ("Est-ce que vous pourriez me délivrer une attestation provisoire ?", "Ndax mën ngeen a may ma atestasiyoŋ bu diir?"),
        10: ("On m'a volé mon sac à l'arraché.", "Sacc nañu ma sama saak, raxas nañu ko."),
        11: ("Je veux porter plainte.", "Damaa bëgg dajale."),
        12: ("On m'a volé...", "Sacc nañu ma..."),
        13: ("...mon appareil photo.", "...sama aparey foto."),
        14: ("...l'argent que j'avais sur moi.", "...xaalis bi ma amoon ci yaram."),
        15: ("...ma carte de crédit.", "...sama kart bu kredi."),
        16: ("...mes chèques de voyage.", "...samay seek bu wiyaas."),
        17: ("...mes clés.", "...samay caabi."),
        18: ("...mon ordinateur.", "...sama ordinateer."),
        19: ("...mes papiers.", "...samay papiye."),
        20: ("...mon portable.", "...sama portaabal."),
        21: ("...mon portefeuille.", "...sama portfëy."),
        22: ("...ma voiture.", "...sama oto."),
    },
    'banque': {
        1:  ("À la banque.", "Ci baŋk bi."),
        2:  ("Où puis-je trouver... ?", "Fan laa man a gis...?"),
        3:  ("...une banque.", "...benn baŋk."),
        4:  ("...un distributeur automatique.", "...benn distribiteer otomatik."),
        5:  ("Je voudrais...", "Damaa bëgg..."),
        6:  ("...changer des chèques de voyage.", "...soppali samay seek bu wiyaas."),
        7:  ("...encaisser un chèque.", "...ànkeese benn seek."),
        8:  ("...faire un dépôt sur un compte.", "...def benn depo ci benn kont."),
        9:  ("...faire un virement.", "...def benn wirmaŋ."),
        10: ("...retirer de l'argent.", "...jël xaalis."),
    },
    'spectacles': {
        1:  ("Sorties au cinéma, théâtre et concerts.", "Génn ci sinema, teyaat ak konseer."),
        2:  ("Quel est le prix du billet ?", "Ñaata mooy biyee bi?"),
    },
    'coiffeur': {
        1:  ("Chez le coiffeur.", "Ci kwafeer bi."),
        2:  ("Je veux me faire couper les cheveux.", "Damaa bëgg dagg samay kawar."),
        3:  ("Vous pouvez me tresser les cheveux ?", "Mën ngeen a rëdd ma samay kawar?"),
    },
    'campagne': {
        1:  ("À la campagne, à la plage, à la montagne.", "Ci dëkk ba, ci plaaas bi, ci tund wi."),
        2:  ("Sports et loisirs.", "Espoor ak njaaxal."),
        3:  ("Lutte sénégalaise.", "Lamb ji."),
        4:  ("Judo.", "Judo."),
        5:  ("Chasse.", "Gànn."),
        6:  ("Équitation.", "Kaaw fas."),
        7:  ("Escalade.", "Yagg tund."),
        8:  ("Pêche.", "Jën."),
        9:  ("Plongée.", "Dubbo."),
        10: ("Quad.", "Kwad."),
        11: ("Randonnée.", "Doxantu."),
        12: ("Vélo.", "Welo."),
        13: ("Nous souhaiterions prendre un cours d'initiation à la lutte.", "Danuy bëgg jàng njëkk ci lamb ji."),
        14: ("Peut-on faire une balade à cheval ?", "Ndax ñu mën doxantu ak fas?"),
        15: ("À la piscine.", "Ci pisin bi."),
        16: ("Combien coûte l'entrée à la piscine ?", "Ñaata la dugg bi pisin bi di jar?"),
        17: ("Est-ce qu'il y a une piscine pour les enfants ?", "Ndax am na pisin bu xale yi?"),
        18: ("Quel est le chemin pour aller à la plage ?", "Yoon wi ngir jëm ci plaaas bi, fan la?"),
        19: ("Je cherche une plage surveillée.", "Damay wut plaaas bu ñu seet."),
        20: ("Je voudrais louer...", "Damaa bëgg luwe..."),
        21: ("...un parasol.", "...benn parasol."),
        22: ("...une serviette.", "...benn serwiyeet."),
    },
    'camping': {
        1:  ("Camper et camping.", "Kampe ak kampiŋ."),
        2:  ("Quel est le tarif pour... ?", "Ñaata la ngir...?"),
        3:  ("Est-ce que les chambres ont des douches individuelles ?", "Ndax nég yi am nañu duus bu seen bopp?"),
        4:  ("Est-il possible de planter notre tente ici pour cette nuit ?", "Ndax mën nañu tëdd sunu tànt fii guddi gii?"),
        5:  ("Arbres et plantes sauvages.", "Garab yi ak ub yi wu àll."),
        6:  ("Faut-il une autorisation pour visiter le Parc national du Niokolo-Koba ?", "Ndax am na otorizasiyoŋ ngir xool Park nasiyonal bu Ñokoloo-Koba?"),
        7:  ("Peux-tu me dire...", "Mën nga ma wax..."),
        8:  ("...ce qui est interdit dans le parc ?", "...li ñu tere ci park bi?"),
        9:  ("Acacia albida.", "Kadd."),
    },
    'animaux': {
        1:  ("Animaux.", "Mala yi."),
        2:  ("Âne.", "Mbaam-sëf."),
        3:  ("Caïman.", "Kaymaan."),
        4:  ("Chacal.", "Buuki."),
        5:  ("Chat.", "Muus."),
        6:  ("Cheval.", "Fas."),
        7:  ("Couleuvre.", "Jaan."),
        8:  ("Écureuil.", "Jaar."),
        9:  ("Gazelle.", "Gasel."),
        10: ("Gibier.", "Jibi."),
        11: ("Grenouille.", "Mbott."),
        12: ("Hyène.", "Bukki."),
        13: ("Lapin.", "Lapën."),
        14: ("Lézard.", "Lesar."),
        15: ("Lièvre.", "Léwru."),
        16: ("Perdrix.", "Mbisaan."),
        17: ("Phacochère.", "Mbaam-àll."),
        18: ("Pigeon.", "Piis."),
        19: ("Pintade.", "Jëntaaga."),
        20: ("Rat.", "Kaña."),
        21: ("Singe.", "Golo."),
        22: ("Souris.", "Janax."),
        23: ("Vipère.", "Jaas."),
        24: ("Insectes.", "Gunóor yi."),
        25: ("Abeille.", "Yamb."),
        26: ("Araignée.", "Jargoñ."),
        27: ("Cafard.", "Bëñ."),
        28: ("Chenille.", "Lënk."),
        29: ("Guêpe.", "Wàpp."),
        30: ("Mouche.", "Wécc."),
        31: ("Moustique.", "Ween."),
        32: ("Scorpion.", "Saxtaana."),
        33: ("Tique.", "Wëtt."),
        34: ("J'ai été piqué par un scorpion.", "Saxtaana dafa ma toob."),
        35: ("J'ai besoin d'un antivenin contre les morsures de vipère.", "Damaa soxla àntivenan ngir matt bu jaas."),
        36: ("Je voudrais un répulsif contre les moustiques.", "Damaa bëgg repilsif ngir ween yi."),
        37: ("Vous avez des moustiquaires ?", "Am ngeen mustikeeri?"),
        38: ("Je suis allergique.", "Alersi laa."),
    },
    'hebergement': {
        1:  ("Hébergement.", "Dëkkuwaay."),
        2:  ("Réservation d'hôtel.", "Reserwe oteel."),
        3:  ("J'aurais besoin...", "Damaa soxla..."),
        4:  ("...d'une chambre avec un lit double.", "...benn nég bu am lal bu ñaari nit."),
        5:  ("...d'une chambre double avec un lit d'appoint.", "...benn nég bu ñaari nit ak benn lal bu yokk."),
        6:  ("Nous sommes deux adultes et deux enfants.", "Ñaar noo nekk mag ak ñaari xale."),
        7:  ("Nous resterons du 10 au 17 avril.", "Danuy toog dale ci 10 ba 17 awril."),
        8:  ("Vous devez laisser une caution à la réservation.", "War ngeen bàyyi kosiyoŋ ci reserwe bi."),
        9:  ("Est-ce que le prix comprend le petit-déjeuner ?", "Ndax pri bi am na petit-dejëne?"),
        10: ("Est-ce qu'il y a la climatisation dans les chambres ?", "Ndax am na klimatizasiyoŋ ci nég yi?"),
        11: ("À la réception.", "Ci resepsiyoŋ bi."),
        12: ("J'ai réservé une chambre au nom de...", "Reserwe naa benn nég ci tur bu..."),
        13: ("Pour combien de nuits ?", "Ngir ñaata guddi?"),
        14: ("Pouvez-vous me réveiller demain à 6h ?", "Mën ngeen a fexee ma ëllëg ci 6 waxtu?"),
        15: ("À quelle heure devons-nous rendre la clé ?", "Ban waxtu lañu war a delloo caabi bi?"),
        16: ("Vocabulaire des services.", "Baat yi ci serwiis yi."),
        17: ("Vous avez des consignes à bagages ?", "Am ngeen koñsiñ bu bagaas?"),
        18: ("Pouvez-vous garder nos bagages jusqu'à ce soir ?", "Mën ngeen a denc sunu bagaas ba ngoon si?"),
        19: ("Est-ce qu'il y a le wifi dans les chambres ?", "Ndax am na wifi ci nég yi?"),
        20: ("Pouvez-vous me faire... ?", "Mën ngeen a def ma...?"),
        21: ("...un café noir.", "...benn kafe bu ñuul."),
        22: ("...un jus d'orange.", "...benn jus doraas."),
        23: ("...une tartine jambon tomates.", "...benn tartiin jambóŋ ak tamaat."),
        24: ("...une tartine beurrée.", "...benn tartiin bu bër."),
        25: ("En cas de petits problèmes.", "Su am na ay ndaw jafe-jafe."),
        26: ("Le robinet fuit.", "Robine bi dafay tooy."),
        27: ("Une ampoule a grillé.", "Benn àmpul dafa sànni."),
        28: ("Régler la note.", "Fey adisiyoŋ bi."),
        29: ("Je peux payer...", "Mën naa fey..."),
    },
    'restaurant': {
        1:  ("Au restaurant.", "Ci restoraaŋ bi."),
        2:  ("Bonsoir, j'ai réservé une table.", "Nanga def, reserwe naa benn taabul."),
        3:  ("Je voudrais réserver une table pour ce soir.", "Damaa bëgg reserwe benn taabul ngir ngoon sii."),
        4:  ("Pour 22 heures, pour 4 personnes.", "Ngir 22 waxtu, ngir ñeenti nit."),
        5:  ("Auriez-vous une table pour 6 personnes ?", "Am ngeen benn taabul bu juróom benni nit?"),
        6:  ("Avez-vous réservé ?", "Reserwe ngeen?"),
        7:  ("Avez-vous un menu ?", "Am ngeen menu?"),
        8:  ("Vous avez choisi ?", "Tànn ngeen?"),
        9:  ("Vous le préférez frit ou grillé ?", "Mbaa bëgg ngeen ko firi walla grillee?"),
        10: ("Quelle est la garniture ?", "Lan mooy garnitir bi?"),
        11: ("Bleu.", "Blë."),
        12: ("...un autre couteau.", "...beneen paka."),
        13: ("...une serviette.", "...benn serwiyeet."),
        14: ("...du pain.", "...mburu."),
        15: ("Qu'est-ce que vous avez comme glace ?", "Lan ngeen am ci galaas?"),
        16: ("Où sont les toilettes, s'il vous plaît ?", "Fan lañu wanaag yi nekk?"),
        17: ("Spécialités et plats traditionnels.", "Speesalite ak ñam yu cosaan."),
    },
    'mets': {
        1:  ("Vocabulaire des mets et produits.", "Baat yi ci ñam yi ak produi yi."),
        2:  ("La boucherie.", "Busri bi."),
        3:  ("Agneau.", "Xar bu ndaw."),
        4:  ("Blanc de poulet.", "Blaŋ bu ginaar."),
        5:  ("Bœuf.", "Nag."),
        6:  ("Côte d'agneau.", "Kot bu xar."),
        7:  ("Côte de porc.", "Kot bu mbaam."),
        8:  ("Côte de veau.", "Kot bu mbaam-bëy."),
        9:  ("Cuisse.", "Tànk."),
        10: ("Dinde.", "Deend."),
        11: ("Épaule.", "Bewet."),
        12: ("Filet de bœuf.", "File bu nag."),
        13: ("Filet de porc.", "File bu mbaam."),
        14: ("Lapin.", "Lapën."),
        15: ("Mouton.", "Xar."),
        16: ("Poulet.", "Ginaar."),
        17: ("Steak.", "Steek."),
        18: ("Escalope.", "Eskalop."),
        19: ("Veau.", "Mbaam-bëy."),
        20: ("La charcuterie.", "Sarkiteri bi."),
        21: ("Cervelle.", "Xel."),
        22: ("Cœur.", "Xol."),
        23: ("Foie.", "Res."),
        24: ("Jambon.", "Jambóŋ."),
        25: ("Langue.", "Lammiñ."),
        26: ("Rognon.", "Roñoŋ."),
        27: ("Saucisse.", "Sosis."),
        28: ("Saucisson.", "Sosisoŋ."),
        29: ("Tranches de jambon.", "Pees bu jambóŋ."),
        30: ("Tranches de saucisson.", "Pees bu sosisoŋ."),
        31: ("La poissonnerie.", "Jëndaayu jën."),
        32: ("Donnez-moi trois darnes de mérou.", "May ma ñetti daarn bu meeru."),
        33: ("Pouvez-vous me vider cette dorade ?", "Mën ngeen a dàqal ma doraad bii?"),
        34: ("Carpe.", "Kaarp."),
        35: ("Chinchard.", "Yabooy."),
        36: ("Crevette.", "Sipax."),
        37: ("Dorade.", "Doraad."),
        38: ("Gambas.", "Gàmbas."),
        39: ("Huître.", "Yoxos."),
        40: ("Langouste.", "Langust."),
        41: ("Mulet.", "Mulóŋ."),
        42: ("Sardine.", "Sardiin."),
        43: ("Sèche.", "Sec."),
        44: ("Sole.", "Sol."),
        45: ("Thon.", "Tóŋ."),
        46: ("Les fruits et légumes.", "Meññ yi ak leguuŋ yi."),
        47: ("Ail.", "Laay."),
        48: ("Ananas.", "Anana."),
        49: ("Aubergine.", "Berseŋ."),
        50: ("Avocat.", "Awoka."),
        51: ("Banane.", "Banaan."),
        52: ("Carotte.", "Karot."),
        53: ("Citron.", "Limoŋ."),
        54: ("Concombre.", "Koŋkomb."),
        55: ("Courgette.", "Kurset."),
        56: ("Chou-fleur.", "Su-flër."),
        57: ("Haricot vert, haricot blanc.", "Ariko weer, ariko weex."),
        58: ("Lentilles.", "Laanti."),
        59: ("Manioc.", "Ñambi."),
        60: ("Melon.", "Meloŋ."),
        61: ("Navet.", "Nawe."),
        62: ("Noix de coco.", "Koko."),
        63: ("Oignon.", "Soble."),
        64: ("Olive.", "Oliw."),
        65: ("Orange.", "Oraas."),
        66: ("Pamplemousse.", "Pàmpëlumus."),
        67: ("Pastèque.", "Xaal."),
        68: ("Mangue.", "Mango."),
        69: ("Petit pois.", "Peti powa."),
        70: ("Piment.", "Kani."),
        71: ("Poireau.", "Pwaro."),
        72: ("Poivron.", "Pwaworoŋ."),
        73: ("Pomme de terre.", "Pombiteer."),
        74: ("Pomme.", "Pom."),
        75: ("Raisin.", "Reseŋ."),
        76: ("Tomate.", "Tamaat."),
        77: ("Façon de préparer et sauces.", "Njaay ju tabax ak saas yi."),
        78: ("Préparations des plats.", "Tabaxu ñam yi."),
        79: ("Bouilli.", "Xëmm."),
        80: ("Braisé.", "Brese."),
        81: ("Brochette.", "Dibi."),
        82: ("En sauce.", "Ci saas."),
        83: ("Farci.", "Feex."),
        84: ("Fumé.", "Géej."),
        85: ("Grillé.", "Sëlëm."),
        86: ("Frit.", "Firi."),
        87: ("Salé.", "Xorom."),
        88: ("Mariné.", "Marinee."),
        89: ("Rôti.", "Rooti."),
        90: ("Pané.", "Panee."),
    },
    'alcool': {
        1:  ("Boissons alcoolisées.", "Naan yu alkol."),
        2:  ("Qu'est-ce que vous prendrez comme boisson ?", "Lan ngeen di naan?"),
        3:  ("Vous avez la carte des vins ?", "Am ngeen kart bu diwaŋ bi?"),
        4:  ("Pouvez-vous m'apporter... ?", "Mën ngeen a indil ma...?"),
        5:  ("Un verre de...", "Benn weer bu..."),
        6:  ("Une demi-bouteille de...", "Genn-wàll bu buteey bu..."),
        7:  ("Une bouteille de...", "Benn buteey bu..."),
        8:  ("Une bière.", "Benn biyer."),
        9:  ("Je vais manger du poisson.", "Dinaa lekk jën."),
    },
    'boissons': {
        1:  ("Autres boissons.", "Yeneeni naan."),
        2:  ("Je vais prendre...", "Dinaa jël..."),
        3:  ("...un café.", "...benn kafe."),
        4:  ("Un café au lait.", "Benn kafe bu meew."),
        5:  ("Un café glacé.", "Benn kafe bu sedd."),
        6:  ("Un chocolat.", "Benn sokolaa."),
        7:  ("Une eau minérale.", "Benn ndox mineral."),
        8:  ("Un thé au lait.", "Benn ataaya bu meew."),
        9:  ("Un jus de fruit.", "Benn jus bu meññ."),
        10: ("Un thé.", "Benn ataaya."),
        11: ("Pouvez-vous nous apporter une carafe d'eau ?", "Mën ngeen a indil nu benn karaf bu ndox?"),
        12: ("Je voudrais un café.", "Damaa bëgg benn kafe."),
    },
    'magasins': {
        1:  ("Magasins et services.", "Bitik yi ak serwiis yi."),
        2:  ("Je cherche...", "Damay wut..."),
        3:  ("...un fleuriste.", "...benn flerist."),
        4:  ("Ce n'est pas très cher.", "Dëru-ul lool."),
        5:  ("Mets-moi un kilo.", "Tegal ma benn kilo."),
        6:  ("Ça fait 1500 francs CFA.", "Amu na 1500 dërëm."),
        7:  ("Livres, revues, journaux, musique.", "Téere yi, rebii yi, jourñaal yi, misik."),
        8:  ("Un kiosque à journaux dans le coin ?", "Am na kiyosk bu jourñaal fii ci wetu?"),
        9:  ("Une librairie par ici ?", "Am na libereeri fii ci wetu?"),
        10: ("Est-ce que vous avez... ?", "Ndax am ngeen...?"),
        11: ("...des journaux en français.", "...jourñaal ci faransee."),
        12: ("Auriez-vous des livres sur les traditions ?", "Ndax am ngeen téere ci cosaan?"),
        13: ("Je voudrais acheter l'album de cet artiste.", "Damaa bëgg jënd àlbuŋ bu artis bii."),
        14: ("Est-ce que vous avez un artiste à me recommander ?", "Ndax am ngeen benn artis ngir ma rekomàndee?"),
        15: ("Blanchisserie, teinturerie.", "Blaŋsisri, teŋtiirëri."),
        16: ("Repassage.", "Pasaas."),
        17: ("Je vous laisse ces vêtements.", "Damay bàyyi yéen yëreem yii."),
        18: ("Ils seront prêts pour quand ?", "Kañ lañuy pare?"),
        19: ("Ils sont propres.", "Set nañu."),
    },
    'vetements': {
        1:  ("Vêtements et chaussures.", "Yëreem yi ak dàll yi."),
        2:  ("Où sont les cabines d'essayage ?", "Fan la kabin deseyaas yi nekk?"),
        3:  ("C'est trop serré.", "Dafa rëy lool."),
        4:  ("Ça me serre.", "Dafay ma rëcc."),
        5:  ("Ça me va.", "Baax na ci man."),
    },
    'tabac': {
        1:  ("Bureau de tabac.", "Biro bu taaba."),
        2:  ("Je voudrais...", "Damaa bëgg..."),
        3:  ("...un paquet de cigarettes.", "...benn pake bu sigareet."),
        4:  ("...une cartouche de...", "...benn kartus bu..."),
        5:  ("...une boîte d'allumettes.", "...benn boyit bu alimet."),
        6:  ("...un briquet.", "...benn brike."),
        7:  ("...du tabac à rouler.", "...taaba bu roole."),
        8:  ("...des feuilles de tabac à rouler.", "...ay fëy bu taaba bu roole."),
        9:  ("...une recharge pour cigarette électronique.", "...benn resaars ngir sigareet elektronik."),
    },
    'photo': {
        1:  ("Photo.", "Foto."),
        2:  ("Carte mémoire.", "Kart memwaar."),
        3:  ("Chargeur.", "Saarsëer."),
        4:  ("Je voudrais faire imprimer ces photos.", "Damaa bëgg imprimer foto yii."),
        5:  ("Mon appareil ne marche pas bien.", "Sama aparey du dox bu baax."),
        6:  ("Vous pouvez nous prendre en photo, s'il vous plaît ?", "Mën ngeen a dëkkal nu foto?"),
        7:  ("Est-ce que je peux vous prendre en photo ?", "Ndax mën naa la dëkkal foto?"),
        8:  ("A-t-on le droit de prendre des photos ici ?", "Ndax mën nañu def foto fii?"),
        9:  ("Vous pouvez prendre des photos sans flash.", "Mën ngeen a def foto te xampe bu amul."),
    },
    'provisions': {
        1:  ("Provisions.", "Proviziyoŋ."),
        2:  ("Alimentation.", "Ñamte."),
        3:  ("Beurre.", "Bër."),
        4:  ("Biscuit.", "Bisko."),
        5:  ("Bonbon.", "Bonboŋ."),
        6:  ("Confiture.", "Koŋfitir."),
        7:  ("Farine.", "Fuñu."),
        8:  ("Glace.", "Galaas."),
        9:  ("Huile.", "Diw."),
        10: ("Lait.", "Meew."),
        11: ("Moutarde.", "Mutard."),
        12: ("Œuf.", "Nen."),
        13: ("Olive.", "Oliw."),
        14: ("Pain.", "Mburu."),
        15: ("Pâte.", "Paat."),
        16: ("Poivre.", "Puwaar."),
        17: ("Riz.", "Ceeb."),
        18: ("Sandwich.", "Sàndwis."),
        19: ("Sel.", "Xorom."),
        20: ("Sucre.", "Suukër."),
        21: ("Vin.", "Diwaŋ."),
        22: ("Vinaigre.", "Winegër."),
        23: ("Hygiène et soins.", "Iyeen ak wéetal."),
        24: ("Brosse à dents.", "Bëros bu bëñ."),
        25: ("Couches pour bébé.", "Kuus bu gone."),
        26: ("Dentifrice.", "Dàntifris."),
        27: ("Déodorant.", "Deyodoraŋ."),
        28: ("Lame de rasoir.", "Laam bu rasuwaar."),
        29: ("Mascara.", "Maskara."),
        30: ("Mouchoirs en papier.", "Musuwaar bu papiye."),
        31: ("Papier toilette.", "Papiye bu wanaag."),
        32: ("Parfum.", "Parfëŋ."),
        33: ("Peigne.", "Xaas."),
        34: ("Rouge à lèvres.", "Ruus a leewr."),
        35: ("Savon.", "Saafuŋ."),
        36: ("Shampooing.", "Sàmpuwee."),
    },
    'souvenirs': {
        1:  ("Souvenirs.", "Fattaliku."),
        2:  ("Je voudrais ramener un souvenir du Sénégal à des amis.", "Damaa bëgg yóbbu fattaliku bu Senegaal ngir samay xarit."),
        3:  ("Je voudrais acheter un masque africain.", "Damaa bëgg jënd benn mask bu Afrik."),
        4:  ("Je peux voir les bijoux ?", "Mën naa xool bij yi?"),
        5:  ("Je vais prendre...", "Dinaa jël..."),
        6:  ("...ce bracelet.", "...barsëlë bii."),
        7:  ("...ce collier.", "...kolee bii."),
        8:  ("...cette montre.", "...moŋtr bii."),
        9:  ("C'est combien ?", "Ñaata la?"),
        10: ("C'est pour un cadeau. Tu pourrais me l'envelopper ?", "Ndimbal la. Mën nga ma ko mbale?"),
    },
    'rdv-pro': {
        1:  ("Rendez-vous professionnel.", "Rànde-wu profesiyonel."),
        2:  ("Pourriez-vous me donner un rendez-vous avec Madame Diop ?", "Mën ngeen a may ma rànde-wu ak Maam Jóob?"),
        3:  ("Mardi à 17h.", "Talaata ci 17 waxtu."),
        4:  ("Parfait, faisons comme ça.", "Baax na, def nañu ko noonu."),
        5:  ("Visiter l'entreprise.", "Xool àntëpriis bi."),
        6:  ("L'atelier.", "Atelee bi."),
        7:  ("Je vous laisse ma carte de visite.", "Damay bàyyi leen sama kart bu wizit."),
    },
    'sante': {
        1:  ("Santé.", "Wergu yaram."),
        2:  ("Chez le médecin.", "Ci doktoor bi."),
        3:  ("J'ai besoin d'aller aux urgences.", "Soxla naa jëm ci irjaas bi."),
        4:  ("Je ne me sens pas bien.", "Baaxu ma."),
        5:  ("Je suis malade.", "Feebar naa."),
        6:  ("Quand est-ce qu'il pourra me voir ?", "Kañ la mën a gis ma?"),
        7:  ("Symptômes.", "Sintom yi."),
        8:  ("J'ai des frissons.", "Dama tàng-sedd."),
        9:  ("Je suis constipé.", "Dama koŋstipe."),
        10: ("J'ai des rougeurs.", "Am naa xuuge."),
        11: ("Ça me démange.", "Dafay ma yoxo."),
        12: ("J'ai mal quand je bouge le bras.", "Dafa metti su ma toxoe sama loxo."),
        13: ("J'ai mal quand je marche.", "Dafa metti su ma doxee."),
        14: ("Je crois que j'ai de l'hypertension.", "Man naa am tànsiyoŋ bu kawe."),
        15: ("Je crois que j'ai une baisse de tension.", "Man naa am tànsiyoŋ bu suuf."),
        16: ("Douleur et parties du corps.", "Metit ak yaram wi."),
        17: ("...aux articulations.", "...ci samay artikilaasiyoŋ."),
        18: ("Je me suis brûlé.", "Tàng naa."),
        19: ("...le nez.", "...bakkan bi."),
        20: ("Santé de la femme.", "Wergub jigéen ji."),
        21: ("J'ai un retard de deux mois.", "Am naa ñaari weer yu ma ñàkk."),
        22: ("Je suis enceinte.", "Ëmb naa."),
        23: ("J'aurais besoin de passer une échographie.", "Soxla naa def benn ekografi."),
    },
    'lecon51': {
        1:  ("Soins médicaux.", "Wéetalu doktoor."),
        2:  ("Je vais vous ausculter.", "Dinaa la seet."),
        3:  ("Il faut faire...", "War na def..."),
        4:  ("...quelques examens.", "...ay egzamen."),
        5:  ("Je vais vous envoyer chez un spécialiste.", "Dinaa la yónne ci benn spesiyalist."),
        6:  ("Vous allez devoir...", "Dinaa war..."),
        7:  ("Il faut vous faire des piqûres.", "War nañu la def ay pikir."),
        8:  ("Est-ce que vous êtes allergique à un médicament ?", "Ndax alersi nga ci benn garab?"),
        9:  ("Chez le dentiste.", "Ci dàntist bi."),
        10: ("J'ai un abcès.", "Am naa benn absee."),
        11: ("Je vais devoir vous arracher une dent.", "Dinaa war a raxas la benn bëñ."),
        12: ("Vous pouvez ouvrir la bouche.", "Mën nga ubbi sa gémmiñ."),
        13: ("Crachez.", "Tuufi."),
        14: ("Chez l'ophtalmologue.", "Ci oftalmolog bi."),
        15: ("J'ai cassé un verre.", "Dafa dagg benn weer."),
        16: ("J'ai quelque chose dans l'œil, ça me fait mal.", "Am naa dara ci sama bët, dafay metti."),
        17: ("Pourriez-vous...", "Mën ngeen a..."),
        18: ("...me montrer des montures ?", "...won ma ay moŋtir?"),
        19: ("Je voudrais des lunettes de soleil avec une bonne protection.", "Damaa bëgg lineti bu jant bu am proteksiyoŋ bu baax."),
    },
    'lecon52': {
        1:  ("À la pharmacie.", "Ci farmasi bi."),
        2:  ("Pouvez-vous m'indiquer une pharmacie ?", "Mën ngeen a won ma benn farmasi?"),
        3:  ("J'ai une ordonnance.", "Am naa benn ordoñaans."),
        4:  ("Est-ce que je peux prendre ce médicament sans ordonnance ?", "Ndax mën naa jël garab gii te ordoñaans amul?"),
        5:  ("Est-ce que je peux prendre ces médicaments ensemble ?", "Ndax mën naa jël garab yii ñaari yépp?"),
        6:  ("Pouvez-vous me donner quelque chose contre...", "Mën ngeen a may ma dara ngir..."),
        7:  ("...les brûlures.", "...tàng bi."),
        8:  ("...du coton.", "...kotoŋ."),
        9:  ("...quelque chose contre la fièvre.", "...dara ngir féebar bu tàng."),
        10: ("...des pansements.", "...ay pànsëmaŋ."),
    },
}

def escape_js(s):
    """Escape single quotes and backslashes for JS string literals."""
    return s.replace("\\", "\\\\").replace("'", "\\'")

def main():
    # Load all JSONs and build cards with translations
    lessons_order = [
        'ville','musees','poste','telephone','internet','administration','banque',
        'spectacles','coiffeur','campagne','camping','animaux','hebergement',
        'restaurant','mets','alcool','boissons','magasins','vetements','tabac',
        'photo','provisions','souvenirs','rdv-pro','sante','lecon51','lecon52'
    ]

    # Read mock.js
    with open(MOCK_JS, 'r') as f:
        content = f.read()

    total_cards = 0
    unsure = []

    for lesson_id in lessons_order:
        json_path = os.path.join(OUTPUT_DIR, f'lesson_{lesson_id}.json')
        with open(json_path, 'r') as f:
            data = json.load(f)

        cards = data['cards']
        trans = TRANSLATIONS.get(lesson_id, {})

        # Build JS card lines
        card_lines = []
        for c in cards:
            pos = c['position']
            if pos in trans:
                fr_text, wo_text = trans[pos]
            else:
                fr_text = c.get('fr', '...')
                wo_text = '...'
                unsure.append(f"{lesson_id}_{pos:02d}: no translation")

            audio_wo = c.get('audioWo', '')
            audio_fr = c.get('audioFr', '')

            fr_esc = escape_js(fr_text)
            wo_esc = escape_js(wo_text)
            cid = c['id']

            line = f"      {{ id: '{cid}', lessonId: '{lesson_id}', position: {pos}, wo: '{wo_esc}', fr: '{fr_esc}', audioWo: `${{BASE}}{audio_wo}`, audioFr: `${{BASE}}{audio_fr}` }},"
            card_lines.append(line)

        cards_block = '\n'.join(card_lines)
        total_cards += len(cards)

        # Find and replace the stub line in mock.js
        # Pattern: line starting with { id: 'lesson_id', ... cards: [] },
        # Some IDs have hyphens so we need to be careful
        escaped_id = re.escape(lesson_id)
        pattern = rf"  \{{ id: '{escaped_id}',\s+position: \d+, title: [^,]+,\s+description: '[^']*',\s*cards: \[\] \}},"

        # Build replacement
        # First, extract the existing line to get position, title, description
        match = re.search(pattern, content)
        if not match:
            # Try a simpler pattern
            pattern2 = rf"  \{{ id: '{escaped_id}',[^\n]*cards: \[\] \}},"
            match = re.search(pattern2, content)

        if match:
            old_text = match.group(0)
            # Extract position, title from old text
            pos_match = re.search(r"position: (\d+)", old_text)
            title_match = re.search(r"title: (['\"])(.*?)\1", old_text)
            pos_num = pos_match.group(1) if pos_match else '0'
            title = title_match.group(2) if title_match else lesson_id

            new_text = f"  {{ id: '{lesson_id}', position: {pos_num}, title: '{escape_js(title)}', description: '', cards: [\n{cards_block}\n    ] }},"
            content = content.replace(old_text, new_text)
            print(f"  OK: {lesson_id} — {len(cards)} cards injected")
        else:
            print(f"  WARN: {lesson_id} — stub not found in mock.js!")

    # Write back
    with open(MOCK_JS, 'w') as f:
        f.write(content)

    print(f"\nTotal: {total_cards} cards across {len(lessons_order)} lessons")
    if unsure:
        print(f"\nUnsure translations ({len(unsure)}):")
        for u in unsure:
            print(f"  - {u}")

    # Also update the JSON files with corrected FR and WO
    for lesson_id in lessons_order:
        json_path = os.path.join(OUTPUT_DIR, f'lesson_{lesson_id}.json')
        with open(json_path, 'r') as f:
            data = json.load(f)

        trans = TRANSLATIONS.get(lesson_id, {})
        for c in data['cards']:
            pos = c['position']
            if pos in trans:
                c['fr'] = trans[pos][0]
                c['wo'] = trans[pos][1]

        with open(json_path, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
