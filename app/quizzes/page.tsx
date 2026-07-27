const MOCK_QUIZZES = [
  {
    id: 'mock-1',
    title: 'Kenyan Crops 101',
    questions: 5,
    duration: '3 min',
    category: 'Agriculture',
    difficulty: 'Easy',
    xp: 50,
    description: 'Test your knowledge of Kenya\'s major crops and farming seasons.',
    quiz_data: [
      { question: 'Which is Kenya\'s most exported crop?', options: ['Maize', 'Tea', 'Sorghum', 'Cassava'], answer: 1 },
      { question: 'When is the long rains season in Kenya?', options: ['Oct-Dec', 'Mar-May', 'Jun-Aug', 'Jan-Feb'], answer: 1 },
      { question: 'Which county is known as Kenya\'s breadbasket?', options: ['Nakuru', 'Uasin Gishu', 'Narok', 'Laikipia'], answer: 1 },
      { question: 'What is the main cash crop in Western Kenya?', options: ['Coffee', 'Sugarcane', 'Cotton', 'Tobacco'], answer: 1 },
      { question: 'Which crop is best for semi-arid areas?', options: ['Wheat', 'Cotton', 'Sorghum', 'Rice'], answer: 2 },
    ],
  },
  {
    id: 'mock-2',
    title: 'Swahili Proverbs',
    questions: 8,
    duration: '5 min',
    category: 'Culture',
    difficulty: 'Medium',
    xp: 80,
    description: 'How well do you know traditional Swahili sayings and their meanings?',
    quiz_data: [
      { question: '"Haraka haraka haina baraka" means?', options: ['Haste makes waste', 'Knowledge is power', 'Unity is strength', 'Patience pays'], answer: 0 },
      { question: '"Mti haukui kivuli chake" means?', options: ['Trees provide shade', 'A person cannot outgrow their origin', 'Nature is beautiful', 'Roots are important'], answer: 1 },
      { question: '"Asiyesikia la mkuu huvunjika guu" means?', options: ['Respect authority', 'Bones are fragile', 'Leaders are wise', 'Listen carefully'], answer: 0 },
      { question: '"Penye nia pana njia" means?', options: ['Where there is wealth, there is a way', 'Where there is will, there is a way', 'Where there is a path, there is a goal', 'Where there is courage, there is victory'], answer: 1 },
      { question: '"Dawa ya moto ni moto" means?', options: ['Fire is dangerous', 'Fight fire with fire', 'Heat cures heat', 'Medicine is hot'], answer: 1 },
      { question: '"Maji yakimwagika hayazoleki" means?', options: ['Water is precious', 'Spilt water cannot be gathered', 'Rivers are important', 'Water flows downhill'], answer: 1 },
      { question: '"Kidole kimoja hakivunji chawa" means?', options: ['Fingers are weak', 'One finger cannot crush a louse', 'Insects are tough', 'Teamwork is necessary'], answer: 1 },
      { question: '"Haba na haba hujaza kibaba" means?', options: ['Small things are useless', 'Little by little fills the measure', 'Measuring is important', 'Patience is key'], answer: 1 },
    ],
  },
  {
    id: 'mock-3',
    title: 'Basic Rights',
    questions: 6,
    duration: '4 min',
    category: 'Rights',
    difficulty: 'Easy',
    xp: 60,
    description: 'Know your constitutional rights as a Kenyan citizen.',
    quiz_data: [
      { question: 'How many chapters does the Constitution of Kenya have?', options: ['10', '12', '18', '20'], answer: 2 },
      { question: 'Which article guarantees the right to life?', options: ['Article 24', 'Article 26', 'Article 28', 'Article 30'], answer: 1 },
      { question: 'Which chapter contains the Bill of Rights?', options: ['Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'], answer: 1 },
      { question: 'Who protects the Constitution?', options: ['Parliament', 'The President', 'The Judiciary', 'The Judiciary and Parliament'], answer: 2 },
      { question: 'What is the right to equality called?', options: ['Article 27', 'Article 28', 'Article 29', 'Article 30'], answer: 0 },
      { question: 'Which right allows freedom of expression?', options: ['Article 31', 'Article 32', 'Article 33', 'Article 34'], answer: 2 },
    ],
  },
  {
    id: 'mock-4',
    title: 'Kenyan Wildlife Quiz',
    questions: 10,
    duration: '5 min',
    category: 'Environment',
    difficulty: 'Hard',
    xp: 100,
    description: 'Test your knowledge of Kenya\'s national parks and wildlife.',
    quiz_data: [
      { question: 'Which is Kenya\'s largest national park?', options: ['Maasai Mara', 'Lake Nakuru', 'Tsavo East', 'Amboseli'], answer: 2 },
      { question: 'What is the main threat to giraffe populations in Kenya?', options: ['Poaching', 'Habitat loss', 'Drought', 'Disease'], answer: 1 },
      { question: 'Which bird is Kenya\'s national symbol?', options: ['Flamingo', 'Grey Crowned Crane', 'Spoonbill', 'Pelican'], answer: 1 },
      { question: 'Where can you find the Great Rift Valley lake system in Kenya?', options: ['Northern Kenya', 'Central Kenya', 'Western Kenya', 'Coastal Kenya'], answer: 1 },
      { question: 'Which Big Five animal has horns in both males and females in Kenya?', options: ['Elephant', 'Buffalo', 'Lion', 'Leopard'], answer: 1 },
      { question: 'What year was Nairobi National Park established?', options: ['1945', '1950', '1960', '1970'], answer: 1 },
      { question: 'Which Kenyan park is known for the "Big Crocodile Committee"?', options: ['Lake Turkana', 'Lake Baringo', 'Lake Kamwangi', 'Lake Olbouli'], answer: 1 },
      { question: 'How many buffaloes were introduced to Buffalo Springs National Park in 1964?', options: ['10', '20', '50', '100'], answer: 2 },
      { question: 'Which endangered antelope is found only in Laikipia County?', options: ['Gerenuk', 'Beira', 'Warthog', 'Impala'], answer: 1 },
      { question: 'What is the name of the famous Maasai lioness photographed by Prof.', options: ['Simbor', 'Ngaitaye', 'Maraika', 'Kijana'], answer: 1 },
    ],
  },
];

const leaderboard = [
  { name: 'Amina Hassan', score: 2840, avatar: 'AH', badge: '🥇' },
  { name: 'Brian Kiprop', score: 2650, avatar: 'BK', badge: '🥈' },
  { name: 'Wanjiku Mwangi', score: 2510, avatar: 'WM', badge: '🥉' },
  { name: 'Otieno Ouma', score: 2380, avatar: 'OO', badge: '' },
  { name: 'Fatuma Osman', score: 2210, avatar: 'FO', badge: '' },
];

const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

const stats = [
  { label: 'Quizzes taken', value: '12', icon: '🧠', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'Average score', value: '78%', icon: '🎯', color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  { label: 'Day streak', value: '3 days', icon: '⚡', color: 'var(--earthSoft)', textColor: 'var(--earth)' },
];

const recentResults = [
  { title: 'Kenyan Crops 101', score: 5, total: 5, correct: true },
  { title: 'Swahili Proverbs', score: 6, total: 8, correct: true },
  { title: 'Basic Rights', score: 4, total: 6, correct: false },
];

export interface RecentResult {
  title: string;
  score: number;
  total: number;
  correct: boolean;
}

const WARNING_BORDER = '1px solid var(--red)';

export default function QuizzesPage() {
  return null;
}


export { MOCK_QUIZZES, leaderboard, difficulties, stats, recentResults, WARNING_BORDER };
