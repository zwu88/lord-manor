window.MANOR_DEPARTMENTS = Object.freeze([
  {
    id: "research-institute",
    name: "The Research Institute",
    shortName: "Research Institute",
    icon: "⚗",
    focus:
      "Research projects, new ideas, experiments, papers, and technical research work.",
    mandate:
      "Develop and record the manor's scientific and scholarly research.",
    financeTracked: true
  },
  {
    id: "academy",
    name: "The Academy",
    shortName: "Academy",
    icon: "📚",
    focus:
      "Courses, reading, independent study, examinations, and school requirements.",
    mandate:
      "Organize formal education, academic training, and personal study.",
    financeTracked: true
  },
  {
    id: "health-commission",
    name: "The Health Commission",
    shortName: "Health Commission",
    icon: "⚕",
    focus:
      "Medical care, preventive health, exercise, physical condition, and health records.",
    mandate:
      "Maintain the lord's health, physical training, and medical records.",
    financeTracked: true
  },
  {
    id: "household-affairs",
    name: "The Household Affairs Office",
    shortName: "Household Affairs",
    icon: "⌂",
    focus:
      "Daily living, commuting, food, housing, purchases, and household items.",
    mandate:
      "Administer the practical affairs of everyday life.",
    financeTracked: true
  },
  {
    id: "music-department",
    name: "The Music Department",
    shortName: "Music Department",
    icon: "🎼",
    focus:
      "Piano practice, musical study, listening, concerts, and performances.",
    mandate:
      "Record and cultivate the musical life of the manor.",
    financeTracked: true
  },
  {
    id: "external-relations",
    name: "The External Relations Office",
    shortName: "External Relations",
    icon: "🤝",
    focus:
      "Meetings, networking, correspondence, collaboration, and visitors.",
    mandate:
      "Maintain the manor's academic, professional, and personal relations.",
    financeTracked: true
  },
  {
    id: "travel-department",
    name: "The Travel Department",
    shortName: "Travel Department",
    icon: "🧭",
    focus:
      "Travel planning, journeys, destinations, visits, and discoveries.",
    mandate:
      "Organize and chronicle journeys beyond the manor.",
    financeTracked: true
  },
  {
    id: "council-chamber",
    name: "The Council Chamber",
    shortName: "Council Chamber",
    icon: "📜",
    focus:
      "Projects, campaigns, milestones, priorities, and future plans.",
    mandate:
      "Govern the manor's long-term projects and strategic decisions.",
    financeTracked: false
  },
  {
    id: "chronicle-department",
    name: "The Chronicle Department",
    shortName: "Chronicle Department",
    icon: "📰",
    focus:
      "Morning briefings and daily, weekly, monthly, and annual reports.",
    mandate:
      "Publish the manor's periodic summaries and morning orders.",
    financeTracked: false
  },
  {
    id: "treasury-office",
    name: "The Treasury and Resources Office",
    shortName: "Treasury and Resources",
    icon: "⚖",
    focus:
      "Money expenditure, time expenditure, and departmental resource accounting.",
    mandate:
      "Measure and report how the manor's money and time are distributed.",
    financeTracked: true
  }
]);

window.MANOR_DEPARTMENT_MAP = Object.freeze(
  Object.fromEntries(
    window.MANOR_DEPARTMENTS.map(
      department => [department.id, department]
    )
  )
);

window.MANOR_LEGACY_DEPARTMENT_MAP = Object.freeze({
  laboratory: "research-institute",
  academy: "academy",
  "training-ground": "health-commission",
  gallery: "music-department",
  "great-hall": "external-relations",
  "map-room": "travel-department",
  "council-chamber": "council-chamber"
});

window.MANOR_SETTINGS = Object.freeze({
  currencyCode: "USD",
  locale: "en-US"
});

window.MANOR_DEPARTMENT_PAGE_TYPES = Object.freeze({
  "research-institute": "operational",
  academy: "operational",
  "health-commission": "operational",
  "household-affairs": "operational",
  "music-department": "operational",
  "external-relations": "operational",
  "travel-department": "operational",

  "council-chamber": "council",
  "chronicle-department": "chronicle",
  "treasury-office": "treasury"
});
