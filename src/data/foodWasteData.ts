export interface CountryData {
  country: string;
  totalWaste: number;
  perCapita: number;
  region: string;
  lat: number;
  lng: number;
}

export interface SectorData {
  sector: string;
  waste: number;
  percentage: number;
  color: string;
}

export interface TimelineData {
  year: number;
  totalWaste: number;
  household: number;
  foodService: number;
  retail: number;
  foodLoss: number;
}

export interface ImpactData {
  metric: string;
  value: string;
  description: string;
  icon: string;
  color: string;
}

export interface FoodTypeData {
  type: string;
  waste: number;
  percentage: number;
  color: string;
}

export const globalStats = {
  totalWaste: 1050,
  totalFoodLoss: 1320,
  percentageOfFood: 19,
  economicCost: 940,
  ghgEmissions: "8-10%",
  mealsWastedDaily: "1 billion+",
  peopleHunger: "300 million",
  foodInsecurity: "28%",
  agriculturalLand: "30%",
};

export const sectorData: SectorData[] = [
  { sector: "Households", waste: 631, percentage: 60, color: "#E63946" },
  { sector: "Food Service", waste: 290, percentage: 28, color: "#F4A261" },
  { sector: "Retail", waste: 131, percentage: 12, color: "#2A9D8F" },
];

export const foodLossData: SectorData[] = [
  { sector: "Post-Harvest Loss", waste: 1320, percentage: 13.2, color: "#E76F51" },
  { sector: "Consumer Waste", waste: 1050, percentage: 19, color: "#264653" },
];

export const countryData: CountryData[] = [
  { country: "China", totalWaste: 109, perCapita: 78, region: "Asia", lat: 35.0, lng: 104.0 },
  { country: "India", totalWaste: 78, perCapita: 55, region: "Asia", lat: 20.6, lng: 78.9 },
  { country: "USA", totalWaste: 63, perCapita: 189, region: "North America", lat: 37.1, lng: -95.7 },
  { country: "Indonesia", totalWaste: 28, perCapita: 102, region: "Asia", lat: -0.8, lng: 113.9 },
  { country: "Pakistan", totalWaste: 24, perCapita: 105, region: "Asia", lat: 30.4, lng: 69.3 },
  { country: "Brazil", totalWaste: 22, perCapita: 103, region: "South America", lat: -14.2, lng: -51.9 },
  { country: "Nigeria", totalWaste: 21, perCapita: 96, region: "Africa", lat: 9.1, lng: 8.7 },
  { country: "Russia", totalWaste: 18, perCapita: 123, region: "Europe", lat: 61.5, lng: 105.3 },
  { country: "Japan", totalWaste: 16, perCapita: 128, region: "Asia", lat: 36.2, lng: 138.3 },
  { country: "Germany", totalWaste: 12, perCapita: 143, region: "Europe", lat: 51.2, lng: 10.4 },
  { country: "UK", totalWaste: 10.2, perCapita: 152, region: "Europe", lat: 55.4, lng: -3.4 },
  { country: "France", totalWaste: 9.5, perCapita: 145, region: "Europe", lat: 46.2, lng: 2.2 },
  { country: "Maldives", totalWaste: 0.07, perCapita: 207, region: "Asia", lat: 3.2, lng: 73.2 },
  { country: "Seychelles", totalWaste: 0.02, perCapita: 183, region: "Africa", lat: -4.7, lng: 55.5 },
  { country: "Mongolia", totalWaste: 0.06, perCapita: 18, region: "Asia", lat: 46.9, lng: 103.8 },
];

export const timelineData: TimelineData[] = [
  { year: 2011, totalWaste: 1300, household: 780, foodService: 360, retail: 160, foodLoss: 1500 },
  { year: 2015, totalWaste: 1250, household: 750, foodService: 350, retail: 150, foodLoss: 1450 },
  { year: 2018, totalWaste: 1180, household: 708, foodService: 330, retail: 142, foodLoss: 1400 },
  { year: 2020, totalWaste: 1100, household: 660, foodService: 308, retail: 132, foodLoss: 1350 },
  { year: 2022, totalWaste: 1050, household: 631, foodService: 290, retail: 131, foodLoss: 1320 },
];

export const impactData: ImpactData[] = [
  {
    metric: "GHG Emissions",
    value: "8-10%",
    description: "of annual global greenhouse gas emissions",
    icon: "Cloud",
    color: "#E63946",
  },
  {
    metric: "Economic Cost",
    value: "$940B",
    description: "lost annually from food loss and waste",
    icon: "DollarSign",
    color: "#F4A261",
  },
  {
    metric: "Agricultural Land",
    value: "30%",
    description: "of world's farmland used for wasted food",
    icon: "MapPin",
    color: "#2A9D8F",
  },
  {
    metric: "Water Consumption",
    value: "342B m\u00b3",
    description: "cubic meters consumed for EU food waste alone",
    icon: "Droplets",
    color: "#457B9D",
  },
  {
    metric: "Meals Wasted",
    value: "1B+",
    description: "meals wasted daily by households worldwide",
    icon: "UtensilsCrossed",
    color: "#E76F51",
  },
  {
    metric: "People Hungry",
    value: "300M",
    description: "people affected by hunger globally",
    icon: "Heart",
    color: "#264653",
  },
];

export const foodTypeData: FoodTypeData[] = [
  { type: "Fruits & Vegetables", waste: 350, percentage: 33.3, color: "#E63946" },
  { type: "Cereals & Grains", waste: 280, percentage: 26.7, color: "#F4A261" },
  { type: "Roots & Tubers", waste: 180, percentage: 17.1, color: "#2A9D8F" },
  { type: "Dairy & Eggs", waste: 105, percentage: 10.0, color: "#457B9D" },
  { type: "Meat & Fish", waste: 70, percentage: 6.7, color: "#E76F51" },
  { type: "Oilseeds & Pulses", waste: 35, percentage: 3.3, color: "#264653" },
  { type: "Other", waste: 30, percentage: 2.9, color: "#A8DADC" },
];

export const reductionTargets = [
  { country: "EU", target: "30% per capita by 2030", status: "Legally binding" },
  { country: "France", target: "50% by 2025 (retail/catering)", status: "In law" },
  { country: "Japan", target: "31% reduction achieved", status: "Achieved (2008-2020)" },
  { country: "UK", target: "50% by 2030", status: "SDG commitment" },
  { country: "USA", target: "50% by 2030", status: "National goal" },
  { country: "Spain", target: "50% by 2030", status: "Legally binding" },
];
