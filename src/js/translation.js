const translations = {
  en: {
    _main01_title: "Visual Content",
    _main02_title: "Services",
    _main02_1_included: "Services included",
    _main02_1_included_list: `- Set assistant<br>- Breakfast [10 people]<br>- Racks, hangers & steamer<br>- Changing cabin<br>- Makeup table<br>- Polyboards<br>- High electric tension [96 KW]<br>- High speed Wi-Fi: 500Mbps<br>- Air conditioning<br>- Sound system<br>- Heavy vehicle access<br>- Large goods elevator<br>- Private parking spot<br>- Equipment rental management<br>- Kitchen with fridges<br>- Catering reheating system<br>- Daylight<br>- Full blackout possible<br>- Alarm system, cameras<br>- 24h Security Agent on site<br>- Safe available`,
    _main02_2_demand: "Services on demand",
    _main02_2_demand_list: `- Catering<br>- Production coordination<br>- Digital capturing<br>- Lighting assistance<br>- Retouching<br>- Post-production`,
    _main03_title: "Technical Specifications",
    _main03_1_StudioMeasurements: "Studio Measurements",
    _main03_1_StudioMeasurements_list: `- Surface area: 2200 ft&sup2;/205 m&sup2;<br>- Ceiling height: 14 ft/4.5 m<br>- Cyclorama: 22 ft × 29 ft / W 6.8m × L 9 m<br>- Entry door: H 203 cm × W 110 cm`,
    _main03_2_Electricity: "Electricity",
    _main03_2_Electricity_list: `- High voltage, up to 96 kW<br>- High-speed Wi-Fi: 500 Mbps`,
    _main03_3_Elevators: "Elevators",
    _main03_3_Elevators_list: `- Elevator 1: H 2.1 m × W 1.8 m × L 2.55 m<br>- Elevator 2: H 2.4 m × W 1.87 m × L 2.8 m`,  
    _main04_1_address: `Maria Studio<br>100 ave. du Général Leclerc<br>93500 Pantin [FR]<br>2nd floor, Unit 215`,
    _main04_4_arrival: `Subway 5 - Hoche<br>RER E - Pantin<br>Tramway 3B - Delphine Seyrig` 
  },
  fr: {
    _main01_title: "Contenu visuel",
    _main02_title: "Services",
    _main02_1_included: "Services inclus",
    _main02_1_included_list: `- Assistant plateau<br>- Petit-déjeuner [10 personnes]<br>- PORTANTS, CINTRES & STEAMER<br>- CABINE D'ESSAYAGE<br>- Table de maquillage<br>- Polyboards<br>- HAUTE TENSION ÉLECTRIQUE [96KW]<br>- Wi-Fi: 500Mbps<br>- Air Conditionné<br>- Système de Sonorisation<br>- Accès pour Véhicules Lourd<br>- Monte Charge<br>- Parking Privé<br>- Gestion location de Matériel<br>- Cuisine avec FRIGIDAIRES<br>- MAINTIEN-CHAUD PROFESSIONNEL<br>- LUMIÈRE NATURELLE<br>- BLACKOUT COMPLÈTE POSSIBLE<br>- SYSTÈME D'ALARME, CAMÉRAS<br>- AGENT DE SÉCURITÉ 24H SUR PLACE<br>- COFFRE-FORT DISPONIBLE`,
    _main02_2_demand: "Services sur demande",
    _main02_2_demand_list: `- CATERING<br>- Coordination de production<br>- Capture numérique<br>- Assistance LUMIÈRE<br>- RETOUCHING<br>- Post-production`,
    _main03_title: "Spécifications techniques",
    _main03_1_StudioMeasurements: "Mesures en studio",
    _main03_1_StudioMeasurements_list: `- Surface : 205 m&sup2;<br>- Hauteur sous plafond : 4.5 m<br>- Cyclorama : L 6.8 m × L 9 m<br>- Porte d'entrée : H 203 cm × L 110 cm`,
    _main03_2_Electricity: "Électricité",
    _main03_2_Electricity_list: `- Haute tension, jusqu'à 96 kW<br>- Wi-Fi haut débit : 500 Mbps`,
    _main03_3_Elevators: "Ascenseurs",
    _main03_3_Elevators_list: `- Ascenseur 1 : H 2.1 m × L 1.8 m × L 2.55 m<br>- Ascenseur 2 : H 2.4 m × L 1.87 m × L 2.8 m`,  
    _main04_1_address: `Maria Studio<br>100 ave. du Général Leclerc<br>93500 Pantin [FR]<br>2ème étage, Unité 215`,
    _main04_4_arrival: `Métro 5 - Hoche<br>RER E - Pantin<br>Tramway 3B - Delphine Seyrig` 
  }
};

let currentLanguage = 'en';

function switchLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'fr' : 'en';
  applyTranslations();
}

function applyTranslations() {
  const translatableIds = Object.keys(translations[currentLanguage]);
  translatableIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = translations[currentLanguage][id];
    } else {
      console.warn(`Element with id '${id}' not found.`);
    }
  });
}

document.getElementById('toggleLanguageBtn').addEventListener('click', switchLanguage);
document.addEventListener('DOMContentLoaded', applyTranslations);
