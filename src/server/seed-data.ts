import type { TopicId } from "@/lib/topics";

export const DEMO_EMAIL = "demo@newsinmail.ng";
export const DEMO_PASSWORD = "demo1234";

export type SeedUser = {
  name: string;
  email: string;
  password: string;
  topics: TopicId[];
  onboarded: boolean;
  paused?: boolean;
  morningTime?: string;
  eveningTime?: string;
};

export const SEED_USERS: SeedUser[] = [
  { name: "Chiamaka Okafor", email: DEMO_EMAIL, password: DEMO_PASSWORD, topics: ["nigeria", "technology", "business", "sports"], onboarded: true },
  { name: "Tunde Bakare", email: "tunde.bakare@example.ng", password: "tunde1234", topics: ["world", "science", "health"], onboarded: true, paused: true, morningTime: "06:30", eveningTime: "19:00" },
  { name: "Aisha Bello", email: "aisha.bello@example.ng", password: "aisha1234", topics: [], onboarded: false },
];

export type SeedArticle = {
  topic: TopicId;
  source: string;
  title: string;
  excerpt: string;
  summary: string | null;
  hoursAgo: number;
};

/**
 * Sample stories so the app has content before the first live feed refresh
 * (and in tests, which run offline). Sources are fictional and every row is
 * flagged as a sample in the UI.
 */
export const SEED_ARTICLES: SeedArticle[] = [
  { topic: "nigeria", source: "Lagos Ledger", hoursAgo: 1, title: "Lagos adds two BRT routes linking Ikorodu, Ojota and CMS", excerpt: "The Lagos Metropolitan Area Transport Authority said the new routes start on Monday with 60 buses. Fares stay at the current rate for the first month while the agency studies demand.", summary: "Lagos is adding two bus rapid transit routes between Ikorodu, Ojota and CMS from Monday, with 60 buses. Fares will not change for the first month." },
  { topic: "nigeria", source: "Abuja Wire", hoursAgo: 5, title: "Senate committee begins review of 2027 budget proposal", excerpt: "Members of the appropriations committee met with ministry officials in Abuja to begin line-by-line review. Hearings continue through next week, with education and health first.", summary: "A Senate committee has started a line-by-line review of the 2027 budget proposal. Education and health ministries appear first in hearings that run through next week." },
  { topic: "nigeria", source: "Kano Courier", hoursAgo: 9, title: "Kano farmers expect bigger maize harvest after steady rains", excerpt: "Farmer groups in Kano say steady rainfall since July has improved yields. Prices at Dawanau market have already eased slightly ahead of harvest.", summary: null },
  { topic: "nigeria", source: "Port Harcourt Post", hoursAgo: 20, title: "Rivers State opens 14 renovated primary health centres", excerpt: "The centres in Obio-Akpor and Eleme will offer antenatal care, immunisation and basic laboratory tests. Officials said staffing has been increased at each site.", summary: "Rivers State has reopened 14 renovated primary health centres in Obio-Akpor and Eleme, offering antenatal care, immunisation and basic lab tests." },
  { topic: "technology", source: "Naija Tech Weekly", hoursAgo: 2, title: "Yaba startup raises $4m to expand pay-later checkout across West Africa", excerpt: "The company, which works with online stores in Lagos and Accra, plans to enter Abidjan and Dakar next year. The round was led by a regional venture fund.", summary: "A Yaba-based pay-later startup raised $4 million to expand from Lagos and Accra into Abidjan and Dakar next year." },
  { topic: "technology", source: "Byte Africa", hoursAgo: 7, title: "Telecom operators test 5G in Ibadan and Enugu", excerpt: "Two operators began limited trials covering business districts in both cities. Commercial launch depends on results and spectrum approvals.", summary: "Two telecom operators are testing 5G in the business districts of Ibadan and Enugu. A commercial launch depends on the trial results and spectrum approvals." },
  { topic: "technology", source: "Naija Tech Weekly", hoursAgo: 14, title: "Universities team up on free coding bootcamp for 10,000 students", excerpt: "Six federal universities will run the 12-week programme online, covering web development, data analysis and cloud basics. Applications open next month.", summary: null },
  { topic: "business", source: "Market Pulse NG", hoursAgo: 3, title: "Naira steadies as central bank sells dollars to banks", excerpt: "The naira traded within a narrow band on Tuesday after the central bank's weekly sale to authorised dealers. Analysts expect stability through the end of the month.", summary: "The naira held within a narrow band after the central bank's weekly dollar sale to banks. Analysts expect it to stay stable through month end." },
  { topic: "business", source: "Market Pulse NG", hoursAgo: 8, title: "Stock market closes higher on banking and telecom gains", excerpt: "The all-share index rose 0.8 percent, led by tier-one banks and a telecom stock that reported higher quarterly revenue.", summary: "Nigerian stocks rose 0.8 percent, led by large banks and a telecom company that reported higher quarterly revenue." },
  { topic: "business", source: "Lagos Ledger", hoursAgo: 26, title: "Food prices ease in Lagos markets for second straight month", excerpt: "Traders at Mile 12 and Oyingbo report lower prices for tomatoes, pepper and onions. Rice and beans prices remain high.", summary: null },
  { topic: "sports", source: "Sports Desk NG", hoursAgo: 4, title: "Super Eagles name 25-man squad for World Cup qualifiers", excerpt: "The coach recalled two defenders and named three uncapped players. The team meets in Uyo next week ahead of two qualifiers.", summary: "The Super Eagles coach named a 25-man squad with two recalled defenders and three uncapped players. Camp opens in Uyo next week." },
  { topic: "sports", source: "Sports Desk NG", hoursAgo: 11, title: "Enyimba beat Rangers 2-1 in Oriental derby", excerpt: "A late header settled the derby in Aba in front of a full stadium. Enyimba move to third in the league table.", summary: "Enyimba beat Rangers 2-1 in Aba with a late header, moving up to third in the league." },
  { topic: "sports", source: "Pitchside Africa", hoursAgo: 30, title: "D'Tigress begin preparations for Afrobasket title defence", excerpt: "The women's basketball team opened camp with 18 players. The final squad of 12 will be named in two weeks.", summary: null },
  { topic: "world", source: "World Brief", hoursAgo: 2, title: "UN climate talks open with focus on adaptation funding", excerpt: "Delegates from nearly 200 countries met for the opening session. Developing nations are pushing for clearer targets on money for adaptation.", summary: "UN climate talks opened with developing countries pressing for clearer targets on adaptation funding." },
  { topic: "world", source: "World Brief", hoursAgo: 10, title: "Trade ministers agree to cut tariffs on medical supplies", excerpt: "The agreement covers gloves, syringes and diagnostic kits and takes effect in January.", summary: null },
  { topic: "africa", source: "Africa Report Desk", hoursAgo: 6, title: "Ghana and Nigeria sign deal to speed up cross-border payments", excerpt: "Customers will be able to send money between the two countries in local currency, with settlement in under a minute.", summary: "Ghana and Nigeria signed a deal allowing near-instant cross-border payments in local currency." },
  { topic: "africa", source: "Africa Report Desk", hoursAgo: 18, title: "Kenya opens new wind farm in the north", excerpt: "The 100 megawatt plant will supply power to the national grid and is expected to cut diesel use.", summary: null },
  { topic: "science", source: "Science Today", hoursAgo: 5, title: "Nigerian researchers map soil health across 12 states", excerpt: "The open dataset covers organic carbon, pH and nutrient levels and is free for farmers and extension workers.", summary: "Researchers released a free soil health map for 12 Nigerian states covering carbon, pH and nutrients." },
  { topic: "science", source: "Science Today", hoursAgo: 22, title: "Satellite data shows Lake Chad shoreline steady this year", excerpt: "Scientists say rainfall and reduced irrigation draw-down kept the shoreline stable compared with last year.", summary: null },
  { topic: "health", source: "Health Watch", hoursAgo: 3, title: "Malaria vaccine rollout reaches 10 more states", excerpt: "Health officials said children under two will receive the vaccine at primary health centres. Parents should bring immunisation cards.", summary: "The malaria vaccine rollout now covers 10 more states, for children under two at primary health centres." },
  { topic: "health", source: "Health Watch", hoursAgo: 16, title: "Doctors advise more water and shade as temperatures rise", excerpt: "Hospitals in the north report more heat-related visits. Doctors recommend avoiding direct sun between noon and 4pm.", summary: null },
  { topic: "entertainment", source: "Showbiz NG", hoursAgo: 4, title: "Nollywood drama tops weekend box office in Lagos and Abuja", excerpt: "The family drama earned more than N80 million in its first three days, according to cinema operators.", summary: "A Nollywood family drama led the weekend box office, earning over N80 million in three days." },
  { topic: "entertainment", source: "Showbiz NG", hoursAgo: 19, title: "Afrobeats stars announce December concert at Eko Atlantic", excerpt: "Organisers say tickets go on sale next week, with a student discount for the first 2,000 buyers.", summary: null },
];
