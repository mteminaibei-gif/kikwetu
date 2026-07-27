/* ================================================================
   KikwetuConnect AI Quiz Engine
   
   Client-side algorithm that generates quizzes dynamically per
   subject category. Awards Heshima points per subject upon quiz
   completion. Uses seeded randomization so the same seed yields
   the same quiz (for retries / sharing).
   ================================================================ */

// ---------- types ----------

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // 0-based index of correct option
  explanation?: string;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
  xpReward: number;
  heshimaReward: number;
  timeLimitSeconds: number;
  createdAt: number;
}

export interface SubjectHeshima {
  subject: string;
  heshima: number;
  quizzesTaken: number;
  bestScore: number;
  streak: number;
  lastPlayed: number;
}

export interface QuizResult {
  quizId: string;
  score: number;
  total: number;
  timeTaken: number;
  heshimaEarned: number;
  xpEarned: number;
  subject: string;
  completedAt: number;
}

// ---------- question banks ----------

const QUESTION_BANKS: Record<string, QuizQuestion[]> = {
  Agriculture: [
    { question: 'Which is Kenya\'s most exported crop?', options: ['Maize', 'Tea', 'Sorghum', 'Cassava'], answer: 1, explanation: 'Tea is Kenya\'s top export crop, earning over $1B annually.' },
    { question: 'When is the long rains season in Kenya?', options: ['Oct-Dec', 'Mar-May', 'Jun-Aug', 'Jan-Feb'], answer: 1, explanation: 'The long rains (Masika) fall from March to May.' },
    { question: 'Which county is known as Kenya\'s breadbasket?', options: ['Nakuru', 'Uasin Gishu', 'Narok', 'Laikipia'], answer: 1, explanation: 'Uasin Gishu produces the most wheat and maize in Kenya.' },
    { question: 'What is the main cash crop in Western Kenya?', options: ['Coffee', 'Sugarcane', 'Cotton', 'Tobacco'], answer: 1, explanation: 'Sugarcane dominates Western Kenya\'s economy.' },
    { question: 'Which crop is best for semi-arid areas?', options: ['Wheat', 'Cotton', 'Sorghum', 'Rice'], answer: 2, explanation: 'Sorghum is drought-tolerant and thrives in semi-arid zones.' },
    { question: 'What percentage of Kenyans depend on agriculture?', options: ['50%', '65%', '75%', '85%'], answer: 2, explanation: 'About 75% of Kenya\'s population depends on agriculture.' },
    { question: 'Which drip irrigation method is most common in Kenya?', options: ['Flood irrigation', 'Netafim drip', 'Sprinkler', 'Centre pivot'], answer: 1, explanation: 'Netafim drip systems are widely used by smallholder farmers.' },
    { question: 'What is "shamba" in English?', options: ['Market', 'Farm/Garden', 'Warehouse', 'Fence'], answer: 1, explanation: 'Shamba is the Swahili word for a small farm or garden.' },
    { question: 'Which fertilizer is most commonly used for maize in Kenya?', options: ['DAP', 'CAN', 'Urea', 'NPK'], answer: 0, explanation: 'DAP (Di-ammonium Phosphate) is the standard basal fertilizer for maize.' },
    { question: 'What is the recommended spacing for maize plants?', options: ['10cm', '25cm', '50cm', '75cm'], answer: 1, explanation: 'Maize is typically spaced 25cm apart within rows.' },
    { question: 'Which county leads in avocado production?', options: ['Meru', 'Murang\'a', 'Kiambu', 'Nyeri'], answer: 0, explanation: 'Meru County is Kenya\'s largest avocado producer.' },
    { question: 'What is Integrated Pest Management (IPM)?', options: ['Using only chemicals', 'Biological + cultural pest control', 'Ignoring pests', 'Burning crops'], answer: 1, explanation: 'IPM combines biological, cultural, and minimal chemical methods.' },
    { question: 'Which milk processing cooperative is the largest in Kenya?', options: ['New KCC', 'Brookside', 'Gapco', 'Molo Milk'], answer: 0, explanation: 'New KCC (Kenya Co-operative Creameries) is the largest.' },
    { question: 'What is the ideal pH range for most Kenyan crops?', options: ['4.0-5.0', '5.5-7.0', '7.5-8.5', '9.0-10.0'], answer: 1, explanation: 'Most crops thrive in slightly acidic to neutral soil (pH 5.5-7.0).' },
    { question: 'Which indigenous vegetable is called "saga" in Kiswahili?', options: ['Spinach', 'Amaranth', 'Nightshade', 'Pumpkin leaves'], answer: 1, explanation: 'Saga (Amaranth) is a popular indigenous leafy vegetable.' },
  ],
  Culture: [
    { question: '"Haraka haraka haina baraka" means?', options: ['Haste makes waste', 'Knowledge is power', 'Unity is strength', 'Patience pays'], answer: 0, explanation: 'Literally "hurry hurry has no blessing" — rushing leads to mistakes.' },
    { question: '"Mti haukui kivuli chake" means?', options: ['Trees provide shade', 'A person cannot outgrow their origin', 'Nature is beautiful', 'Roots are important'], answer: 1, explanation: 'You can never surpass where you came from.' },
    { question: '"Penye nia pana njia" means?', options: ['Where there is wealth', 'Where there is will, there is a way', 'Where there is a path', 'Where there is courage'], answer: 1, explanation: 'Determination finds a way forward.' },
    { question: '"Dawa ya moto ni moto" means?', options: ['Fire is dangerous', 'Fight fire with fire', 'Heat cures heat', 'Medicine is hot'], answer: 1, explanation: 'Sometimes you must confront a problem head-on.' },
    { question: '"Haba na haba hujaza kibaba" means?', options: ['Small things are useless', 'Little by little fills the measure', 'Measuring is important', 'Patience is key'], answer: 1, explanation: 'Small efforts accumulate into big results.' },
    { question: 'Which Kenyan community is known for the "Adumu" jumping dance?', options: ['Kikuyu', 'Maasai', 'Luo', 'Kalenjin'], answer: 1, explanation: 'The Maasai Adumu (jumping dance) is performed during ceremonies.' },
    { question: 'What is a "Boma" in Maasai culture?', options: ['A spear', 'A homestead enclosure', 'A bead necklace', 'A cattle brand'], answer: 1, explanation: 'A boma is a traditional Maasai homestead made of thorn bushes.' },
    { question: 'Which festival celebrates Kenya\'s cultural diversity annually?', options: ['Madaraka Day', 'Mazingira Day', 'Utamaduni Day', 'Jamhuri Day'], answer: 2, explanation: 'Utamaduni Day (formerly Moi Day) celebrates cultural heritage.' },
    { question: 'What does "Harambee" mean?', options: ['All together', 'Pull together', 'Work hard', 'Be strong'], answer: 1, explanation: 'Harambee means "all pull together" — Kenya\'s founding philosophy.' },
    { question: 'Which instrument is a traditional Kikuyu stringed lyre?', options: ['Nyatiti', 'Orutu', 'Obokano', 'Kayamba'], answer: 2, explanation: 'The Obokano is a large 8-string lyre from the Kikuyu community.' },
    { question: 'What is "Ngumi" in Swahili?', options: ['Dance', 'Fist/Boxing', 'Song', 'Story'], answer: 1, explanation: 'Ngumi means fist or boxing in Swahili.' },
    { question: 'Which community practices the "Samburu" age-set system?', options: ['Luo', 'Samburu', 'Kamba', 'Kisii'], answer: 1, explanation: 'The Samburu have a strict age-set (moran) system for warriors.' },
    { question: 'What is "Ugali" made from?', options: ['Rice', 'Wheat flour', 'Maize flour', 'Cassava flour'], answer: 2, explanation: 'Ugali is Kenya\'s staple food made from maize flour and water.' },
    { question: 'Which bird is Kenya\'s national symbol?', options: ['Flamingo', 'Crowned crane', 'Eagle', 'Ostrich'], answer: 1, explanation: 'The Grey Crowned Crane appears on Kenya\'s coat of arms.' },
    { question: 'What is the significance of "Kanga" fabric?', options: ['Just decoration', 'Carries messages and proverbs', 'Wedding only', 'Mourning only'], answer: 1, explanation: 'Kangas often carry hidden messages or proverbs in their borders.' },
  ],
  'Rights & Law': [
    { question: 'How many chapters does the Constitution of Kenya have?', options: ['10', '12', '18', '20'], answer: 2, explanation: 'The 2010 Constitution has 18 chapters.' },
    { question: 'Which article guarantees the right to life?', options: ['Article 24', 'Article 26', 'Article 28', 'Article 30'], answer: 1, explanation: 'Article 26(1) states every person has the right to life.' },
    { question: 'Which chapter contains the Bill of Rights?', options: ['Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'], answer: 1, explanation: 'The Bill of Rights is in Chapter 4 (Articles 19-59).' },
    { question: 'Who protects the Constitution?', options: ['Parliament', 'The President', 'The Judiciary', 'IEBC'], answer: 2, explanation: 'The Judiciary is the guardian of the Constitution.' },
    { question: 'Which right allows freedom of expression?', options: ['Article 31', 'Article 32', 'Article 33', 'Article 34'], answer: 2, explanation: 'Article 33 guarantees freedom of expression.' },
    { question: 'What is the minimum voting age in Kenya?', options: ['16', '18', '21', '25'], answer: 1, explanation: 'Article 38(3)(a) gives every citizen the right to vote at 18.' },
    { question: 'Which body conducts elections in Kenya?', options: ['Parliament', 'IEBC', 'Judiciary', 'Senate'], answer: 1, explanation: 'The Independent Electoral and Boundaries Commission (IEBC) manages elections.' },
    { question: 'Can police detain you without charge for more than 24 hours?', options: ['Yes, always', 'No, never', 'Only with court order', 'Only for serious crimes'], answer: 2, explanation: 'Article 49(1)(f) requires presenting in court within 24 hours unless court orders otherwise.' },
    { question: 'What does "Habeas Corpus" protect against?', options: ['Tax evasion', 'Unlawful detention', 'Defamation', 'Property theft'], answer: 1, explanation: 'Habeas Corpus protects against unlawful imprisonment.' },
    { question: 'Which article guarantees freedom of worship?', options: ['Article 30', 'Article 32', 'Article 35', 'Article 37'], answer: 1, explanation: 'Article 32 guarantees freedom of conscience, religion, belief, and opinion.' },
    { question: 'What is the role of the Director of Public Prosecutions?', options: ['Make laws', 'Prosecute criminal cases', 'Judge cases', 'Arrest suspects'], answer: 1, explanation: 'The DPP directs and prosecutes criminal cases on behalf of the state.' },
    { question: 'Can a Kenyan citizen be deported from Kenya?', options: ['Yes, always', 'No, never', 'Only dual citizens', 'Only convicts'], answer: 2, explanation: 'Article 16(1) states citizens cannot be deprived of citizenship except as provided.' },
    { question: 'What is "Public Interest Litigation"?', options: ['Suing the government only', 'Court cases for social good', 'Private disputes', 'Criminal trials'], answer: 1, explanation: 'PIL is litigation filed in court for the benefit of the public interest.' },
    { question: 'Which article guarantees the right to health?', options: ['Article 40', 'Article 43', 'Article 45', 'Article 47'], answer: 1, explanation: 'Article 43(1)(a) guarantees the highest attainable standard of health.' },
    { question: 'What is the maximum number of counties in Kenya?', options: ['47', '48', '50', '52'], answer: 0, explanation: 'Kenya has 47 counties as per the 2010 Constitution.' },
  ],
  Health: [
    { question: 'What is the main symptom of malaria?', options: ['Headache', 'Fever and chills', 'Cough', 'Joint pain'], answer: 1, explanation: 'Malaria primarily causes fever, chills, and sweating.' },
    { question: 'How many glasses of water should you drink daily?', options: ['4', '6', '8', '10'], answer: 2, explanation: 'The general guideline is 8 glasses (about 2 litres) per day.' },
    { question: 'Which disease is caused by vitamin A deficiency?', options: ['Goitre', 'Night blindness', 'Scurvy', 'Rickets'], answer: 1, explanation: 'Night blindness (nyctalopia) is a classic sign of vitamin A deficiency.' },
    { question: 'What does BMI stand for?', options: ['Body Mass Index', 'Basic Metabolic Input', 'Blood Mass Indicator', 'Brain Metabolism Index'], answer: 0, explanation: 'BMI = weight (kg) / height² (m²). Normal range is 18.5-24.9.' },
    { question: 'Which vaccine prevents tuberculosis?', options: ['MMR', 'BCG', 'OPV', 'Hepatitis B'], answer: 1, explanation: 'BCG (Bacillus Calmette-Guérin) vaccine prevents TB.' },
    { question: 'What is the most common cause of death in Kenya?', options: ['Malaria', 'HIV/AIDS', 'Heart disease', 'Road accidents'], answer: 2, explanation: 'Non-communicable diseases like heart disease are now the leading cause.' },
    { question: 'How long should you wash your hands to prevent disease?', options: ['5 seconds', '10 seconds', '20 seconds', '60 seconds'], answer: 2, explanation: 'WHO recommends at least 20 seconds of handwashing with soap.' },
    { question: 'What does ORS treat?', options: ['Malaria', 'Diarrhea dehydration', 'Skin infections', 'Headaches'], answer: 1, explanation: 'Oral Rehydration Salts replace fluids lost from diarrhea.' },
    { question: 'Which food group is the body\'s main energy source?', options: ['Proteins', 'Carbohydrates', 'Fats', 'Vitamins'], answer: 1, explanation: 'Carbohydrates (ugali, rice, bread) are the body\'s primary energy source.' },
    { question: 'What is the normal body temperature in Celsius?', options: ['35.5°C', '36.5°C', '37.5°C', '38.5°C'], answer: 1, explanation: 'Normal body temperature is approximately 36.5°C (97.7°F).' },
    { question: 'Which organ filters blood in the body?', options: ['Heart', 'Liver', 'Kidneys', 'Lungs'], answer: 2, explanation: 'The kidneys filter about 180 litres of blood daily.' },
    { question: 'What is "jua kali" health risk?', options: ['Sunstroke from outdoor work', 'Cold weather illness', 'Waterborne disease', 'Food poisoning'], answer: 0, explanation: 'Jua kali workers face sunstroke and heat-related illnesses.' },
    { question: 'How often should adults exercise per WHO guidelines?', options: ['1 day/week', '2 days/week', '3-5 days/week', 'Every day'], answer: 2, explanation: 'WHO recommends 150 minutes of moderate activity per week (3-5 days).' },
    { question: 'Which mineral is essential for strong bones?', options: ['Iron', 'Calcium', 'Zinc', 'Sodium'], answer: 1, explanation: 'Calcium is essential for bone and teeth formation.' },
    { question: 'What is the best way to prevent cholera?', options: ['Vaccination only', 'Boiling water + handwashing', 'Avoiding all water', 'Eating raw food'], answer: 1, explanation: 'Clean water and proper hygiene are the best cholera prevention methods.' },
  ],
  Tech: [
    { question: 'What does "CPU" stand for?', options: ['Central Process Unit', 'Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility'], answer: 1, explanation: 'The CPU (Central Processing Unit) is the brain of a computer.' },
    { question: 'What does "WWW" stand for?', options: ['World Wide Web', 'Wide World Web', 'Web World Wide', 'World Web Wide'], answer: 0, explanation: 'WWW = World Wide Web, invented by Tim Berners-Lee in 1989.' },
    { question: 'Which programming language is most used in Kenya?', options: ['Java', 'Python', 'JavaScript', 'C++'], answer: 2, explanation: 'JavaScript (React/Node) is most popular among Kenyan developers.' },
    { question: 'What is M-Pesa?', options: ['A bank', 'Mobile money service', 'A cryptocurrency', 'Social media'], answer: 1, explanation: 'M-Pesa is Safaricom\'s mobile money transfer service launched in 2007.' },
    { question: 'What does "AI" stand for?', options: ['Automated Intelligence', 'Artificial Intelligence', 'Advanced Internet', 'Auto Integration'], answer: 1, explanation: 'AI = Artificial Intelligence — machines that mimic human cognition.' },
    { question: 'Which company owns the most used mobile OS in Kenya?', options: ['Apple', 'Microsoft', 'Google (Android)', 'Samsung'], answer: 2, explanation: 'Android (Google) dominates Kenya\'s mobile market with ~85% share.' },
    { question: 'What is "Fibre Optic" technology?', options: ['Wireless internet', 'Light-based data transmission', 'Satellite communication', 'Bluetooth'], answer: 1, explanation: 'Fibre optic cables transmit data as pulses of light through glass strands.' },
    { question: 'What does "USSD" mean in mobile money context?', options: ['Universal System for Secure Deposits', 'Unstructured Supplementary Service Data', 'Unified SMS Service Dashboard', 'User Secure Service Division'], answer: 1, explanation: 'USSD codes like *334# are used for M-Pesa and banking on feature phones.' },
    { question: 'Which Kenyan tech hub is called "Silicon Savannah"?', options: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'], answer: 0, explanation: 'Nairobi\'s tech ecosystem is nicknamed "Silicon Savannah".' },
    { question: 'What is a "VPN" used for?', options: ['Faster internet only', 'Online privacy and security', 'Making calls', 'Storing files'], answer: 1, explanation: 'A VPN encrypts your internet connection for privacy and security.' },
    { question: 'What does "API" stand for?', options: ['Application Programming Interface', 'Advanced Program Integration', 'Auto Process Input', 'App Protocol Interconnect'], answer: 0, explanation: 'An API allows different software systems to communicate with each other.' },
    { question: 'Which Kenyan startup was valued at $1B+ (unicorn)?', options: ['M-Kopa', 'Twiga Foods', 'Cellulant', 'Sendy'], answer: 1, explanation: 'Twiga Foods became East Africa\'s first tech unicorn.' },
    { question: 'What is "cloud computing"?', options: ['Weather forecasting', 'Storing/accessing data over the internet', 'Cloud-shaped chips', 'Satellite TV'], answer: 1, explanation: 'Cloud computing stores data and runs apps on remote servers accessed via the internet.' },
    { question: 'What does "IoT" stand for?', options: ['Internet of Things', 'Input/Output Terminal', 'Internal Operating Technology', 'Integrated Online Tools'], answer: 0, explanation: 'IoT connects everyday devices (fridges, sensors) to the internet.' },
    { question: 'Which Safaricom product offers free basic internet?', options: ['Klipa', 'Tunukiwa', 'Endless', 'Biashara'], answer: 1, explanation: 'Tunukiwa gives free data for specific apps and services.' },
  ],
  Environment: [
    { question: 'What is Kenya\'s largest national park?', options: ['Tsavo East', 'Amboseli', 'Nairobi', 'Meru'], answer: 0, explanation: 'Tsavo East covers about 13,747 km² — the largest in Kenya.' },
    { question: 'What is the main cause of deforestation in Kenya?', options: ['Logging', 'Charcoal burning', 'Farming expansion', 'All of the above'], answer: 3, explanation: 'All three contribute to Kenya\'s forest loss.' },
    { question: 'Which lake is the largest in Kenya?', options: ['Lake Naivasha', 'Lake Victoria', 'Lake Turkana', 'Lake Baringo'], answer: 2, explanation: 'Lake Turkana is the world\'s largest permanent desert lake.' },
    { question: 'What is "reforestation"?', options: ['Cutting trees', 'Planting new trees in deforested areas', 'Burning forests', 'Watering plants'], answer: 1, explanation: 'Reforestation is planting trees to restore deforested areas.' },
    { question: 'Which Kenyan city has the most air pollution?', options: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'], answer: 0, explanation: 'Nairobi has the highest levels of vehicular and industrial air pollution.' },
    { question: 'What is the "Green Belt Movement" founded by Wangari Maathai?', options: ['A tree planting initiative', 'A political party', 'A tech company', 'A school'], answer: 0, explanation: 'The Green Belt Movement has planted over 51 million trees since 1977.' },
    { question: 'Which gas is the main contributor to global warming?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide (CO₂)', 'Helium'], answer: 2, explanation: 'CO₂ from fossil fuels is the primary greenhouse gas driving climate change.' },
    { question: 'What percentage of Kenya is arid/semi-arid land?', options: ['50%', '65%', '80%', '90%'], answer: 2, explanation: 'About 80% of Kenya is classified as arid or semi-arid.' },
    { question: 'What is "sustainable development"?', options: ['Fast economic growth', 'Meeting present needs without compromising the future', 'Building more cities', 'Exporting more goods'], answer: 1, explanation: 'Sustainable development balances economic growth, social equity, and environmental protection.' },
    { question: 'Which Kenyan river is the longest?', options: ['Tana River', 'Ewaso Nyiro', 'Galana', 'Athi'], answer: 0, explanation: 'The Tana River stretches about 1,014 km through central Kenya.' },
    { question: 'What is the main threat to Kenya\'s coral reefs?', options: ['Overfishing', 'Climate change & coral bleaching', 'Tourism', 'Shipping'], answer: 1, explanation: 'Rising ocean temperatures cause coral bleaching, threatening reef ecosystems.' },
    { question: 'Which bird species migrates to Kenya annually?', options: ['Eagles', 'Flamingos', 'European swallows', 'All of the above'], answer: 3, explanation: 'Kenya hosts millions of migratory birds including flamingos and European swallows.' },
    { question: 'What is "ecotourism"?', options: ['Any tourism', 'Tourism that conserves the environment', 'Online tourism', 'Luxury tourism'], answer: 1, explanation: 'Ecotourism is responsible travel that conserves nature and benefits local communities.' },
    { question: 'Which Kenyan mountain is a UNESCO World Heritage Site?', options: ['Mt. Kenya', 'Mt. Elgon', 'Mt. Longonot', 'Chyulu Hills'], answer: 0, explanation: 'Mt. Kenya is a UNESCO site for its unique biodiversity and glacial peaks.' },
    { question: 'What is "biomass energy" in Kenya?', options: ['Solar power', 'Energy from organic materials like wood and crop waste', 'Wind power', 'Nuclear power'], answer: 1, explanation: 'Biomass (charcoal, firewood, crop residues) provides ~70% of Kenya\'s energy.' },
  ],
  'Kenya History': [
    { question: 'In what year did Kenya gain independence?', options: ['1960', '1963', '1965', '1970'], answer: 1, explanation: 'Kenya gained independence on 12 December 1963.' },
    { question: 'Who was Kenya\'s first President?', options: ['Jomo Kenyatta', 'Daniel arap Moi', 'Mwai Kibaki', 'Raila Odinga'], answer: 0, explanation: 'Jomo Kenyatta served as Kenya\'s first President from 1964 to 1978.' },
    { question: 'What was the "Mau Mau" movement?', options: ['A dance troupe', 'An anti-colonial armed resistance', 'A farming cooperative', 'A political party'], answer: 1, explanation: 'The Mau Mau rebellion (1952-1960) fought against British colonial rule.' },
    { question: 'Which event is celebrated on June 1st?', options: ['Independence Day', 'Madaraka Day', 'Mashujaa Day', 'Jamhuri Day'], answer: 1, explanation: 'Madaraka Day marks the day Kenya attained self-rule in 1963.' },
    { question: 'When was the current Constitution adopted?', options: ['1963', '1992', '2003', '2010'], answer: 3, explanation: 'The 2010 Constitution replaced the independence constitution after a referendum.' },
    { question: 'Who led the Wanyuanda resistance in Western Kenya?', options: ['Wangari Maathai', 'Koitalel arap Samoei', 'Mekatilili wa Menza', 'Dedan Kimathi'], answer: 1, explanation: 'Koitalel arap Samoei led the Nandi resistance against British annexation.' },
    { question: 'What was "Kenyatta Plan"?', options: ['An economic blueprint', 'A farming method', 'A military strategy', 'A housing project'], answer: 0, explanation: 'Sessional Paper No. 10 of 1965 (Kenyatta Plan) outlined Kenya\'s economic development.' },
    { question: 'Which year was multiparty democracy restored in Kenya?', options: ['1988', '1991', '1997', '2002'], answer: 1, explanation: 'Multiparty politics was restored through a constitutional amendment in December 1991.' },
    { question: 'What was the 2007-2008 crisis about?', options: ['Drought', 'Post-election violence', 'Economic collapse', 'Floods'], answer: 1, explanation: 'Disputed 2007 election results led to widespread violence; resolved by the National Accord.' },
    { question: 'Who won the Nobel Peace Prize from Kenya?', options: ['Uhuru Kenyatta', 'Wangari Maathai', 'Raila Odinga', 'Kofi Annan'], answer: 1, explanation: 'Wangari Maathai won in 2004 for her contribution to sustainable development and democracy.' },
    { question: 'What was the KANU party?', options: ['Opposition party', 'Ruling party from 1963-2002', 'Student union', 'Trade union'], answer: 1, explanation: 'Kenya African National Union (KANU) governed Kenya from independence until 2002.' },
    { question: 'When was the first general election held?', options: ['1963', '1969', '1974', '1979'], answer: 1, explanation: 'Kenya\'s first general election (one-party) was in 1969.' },
    { question: 'Who was the first female member of Parliament in Kenya?', options: ['Martha Karua', 'Grace Onyango', 'Wangari Maathai', 'Charity Ngilu'], answer: 1, explanation: 'Grace Onyango was elected to Parliament in 1964.' },
    { question: 'What was "Nyayoism"?', options: ['An ethnic philosophy', 'President Moi\'s governing philosophy', 'A university movement', 'An economic policy'], answer: 1, explanation: 'Nyayoism was Daniel arap Moi\'s philosophy of peace, love, and unity.' },
    { question: 'Which year was Nairobi founded?', options: ['1890', '1899', '1905', '1920'], answer: 1, explanation: 'Nairobi was founded in 1899 as a rail depot on the Uganda Railway.' },
  ],
};

// ---------- constants ----------

const HESHIMA_PER_CORRECT = 5;
const HESHIMA_BONUS_HARD = 3;
const HESHIMA_BONUS_STREAK = 2;
const XP_BASE = 50;
const QUESTIONS_PER_QUIZ = 8;
const STORAGE_KEY = 'kikwetu-quiz-heshima';
const HISTORY_KEY = 'kikwetu-quiz-history';

// ---------- helpers ----------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateQuizId(): string {
  return `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- core API ----------

export function getCategories(): { name: string; emoji: string; questionCount: number; color: string; textColor: string }[] {
  return [
    { name: 'Agriculture', emoji: '🌾', questionCount: QUESTION_BANKS['Agriculture'].length, color: 'var(--greenSoft)', textColor: 'var(--green)' },
    { name: 'Culture', emoji: '🎭', questionCount: QUESTION_BANKS['Culture'].length, color: 'var(--goldSoft)', textColor: 'var(--earth)' },
    { name: 'Rights & Law', emoji: '⚖️', questionCount: QUESTION_BANKS['Rights & Law'].length, color: 'var(--earthSoft)', textColor: 'var(--earth)' },
    { name: 'Health', emoji: '🏥', questionCount: QUESTION_BANKS['Health'].length, color: 'var(--redSoft)', textColor: 'var(--red)' },
    { name: 'Tech', emoji: '💻', questionCount: QUESTION_BANKS['Tech'].length, color: 'var(--blueSoft)', textColor: 'var(--blue)' },
    { name: 'Environment', emoji: '🌿', questionCount: QUESTION_BANKS['Environment'].length, color: 'var(--greenSoft)', textColor: 'var(--green)' },
    { name: 'Kenya History', emoji: '📜', questionCount: QUESTION_BANKS['Kenya History'].length, color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  ];
}

export function generateQuiz(
  category: string,
  difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy',
  seed?: number
): GeneratedQuiz {
  const bank = QUESTION_BANKS[category] || QUESTION_BANKS['Agriculture'];
  const rng = seededRandom(seed ?? Date.now());

  const diffMultiplier = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 1.5 : 2.5;
  const heshimaReward = Math.round((HESHIMA_PER_CORRECT * QUESTIONS_PER_QUIZ) * diffMultiplier);
  const xpReward = Math.round(XP_BASE * diffMultiplier);

  const timePerQuestion = difficulty === 'Easy' ? 45 : difficulty === 'Medium' ? 30 : 20;
  const timeLimitSeconds = QUESTIONS_PER_QUIZ * timePerQuestion;

  const selected = shuffleArray(bank, rng).slice(0, QUESTIONS_PER_QUIZ);

  return {
    id: generateQuizId(),
    title: `${category} ${difficulty}`,
    category,
    difficulty,
    questions: selected,
    xpReward,
    heshimaReward,
    timeLimitSeconds,
    createdAt: Date.now(),
  };
}

export function generateQuizFromCategory(category: string, seed?: number): GeneratedQuiz {
  const rng = seededRandom(seed ?? Date.now());
  const diffRoll = rng();
  const difficulty = diffRoll < 0.5 ? 'Easy' : diffRoll < 0.85 ? 'Medium' : 'Hard';
  return generateQuiz(category, difficulty, seed);
}

export function calculateResult(quiz: GeneratedQuiz, answers: number[]): QuizResult {
  let score = 0;
  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });

  const accuracy = score / quiz.questions.length;
  const streakBonus = accuracy >= 0.8 ? HESHIMA_BONUS_STREAK : 0;
  const hardBonus = quiz.difficulty === 'Hard' ? HESHIMA_BONUS_HARD : 0;
  const heshimaEarned = Math.round((score * HESHIMA_PER_CORRECT) + streakBonus + hardBonus);
  const xpEarned = Math.round(quiz.xpReward * accuracy);

  return {
    quizId: quiz.id,
    score,
    total: quiz.questions.length,
    timeTaken: 0,
    heshimaEarned,
    xpEarned,
    subject: quiz.category,
    completedAt: Date.now(),
  };
}

// ---------- subject heshima tracking ----------

export function getSubjectHeshima(): Record<string, SubjectHeshima> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getSubjectHeshimaFor(subject: string): SubjectHeshima {
  const all = getSubjectHeshima();
  return all[subject] || {
    subject,
    heshima: 0,
    quizzesTaken: 0,
    bestScore: 0,
    streak: 0,
    lastPlayed: 0,
  };
}

export function updateSubjectHeshima(subject: string, score: number, total: number): SubjectHeshima {
  const all = getSubjectHeshima();
  const existing = all[subject] || {
    subject,
    heshima: 0,
    quizzesTaken: 0,
    bestScore: 0,
    streak: 0,
    lastPlayed: 0,
  };

  const accuracy = score / total;
  const streakBonus = accuracy >= 0.8 ? 1 : 0;
  const heshimaGain = Math.round(score * HESHIMA_PER_CORRECT + streakBonus * HESHIMA_BONUS_STREAK);

  const updated: SubjectHeshima = {
    ...existing,
    heshima: existing.heshima + heshimaGain,
    quizzesTaken: existing.quizzesTaken + 1,
    bestScore: Math.max(existing.bestScore, accuracy * 100),
    streak: accuracy >= 0.8 ? existing.streak + 1 : 0,
    lastPlayed: Date.now(),
  };

  all[subject] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return updated;
}

export function getTotalHeshima(): number {
  const all = getSubjectHeshima();
  return Object.values(all).reduce((sum, s) => sum + s.heshima, 0);
}

export function getSubjectLeaderboard(): SubjectHeshima[] {
  const all = getSubjectHeshima();
  return Object.values(all).sort((a, b) => b.heshima - a.heshima);
}

// ---------- quiz history ----------

export function getQuizHistory(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuizResult(result: QuizResult): void {
  const history = getQuizHistory();
  history.unshift(result);
  if (history.length > 50) history.length = 50;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getRecentResults(limit: number = 5): QuizResult[] {
  return getQuizHistory().slice(0, limit);
}

export function getOverallStats() {
  const history = getQuizHistory();
  const totalQuizzes = history.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(history.reduce((sum, r) => sum + (r.score / r.total), 0) / totalQuizzes * 100)
    : 0;
  const totalHeshima = getTotalHeshima();
  const streak = calculateStreak();

  return { totalQuizzes, avgScore, totalHeshima, streak };
}

function calculateStreak(): number {
  const history = getQuizHistory();
  if (history.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < 30; i++) {
    const dayStr = checkDate.toDateString();
    const played = history.some(r => new Date(r.completedAt).toDateString() === dayStr);
    if (played) {
      streak++;
    } else if (i > 0) {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

// ---------- daily challenge ----------

export function getDailyChallenge(): GeneratedQuiz {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const categories = Object.keys(QUESTION_BANKS);
  const categoryIdx = seed % categories.length;
  return generateQuiz(categories[categoryIdx], 'Medium', seed);
}
