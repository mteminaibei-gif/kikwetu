-- Seed real Kenyan communities (spaces)
-- These will be inserted only if they don't already exist

INSERT INTO spaces (name, description, icon, color, members_count, created_at) VALUES
-- Agriculture & Food
('KilimoSmart', 'Smart farming tips, crop prices, and agricultural innovation across Kenya', '🌾', 'oklch(65% .12 120)', 2847, NOW() - INTERVAL '6 months'),
('Fisheries KE', 'Fishing industry, aquaculture, and lake/coast fishing communities', '🐟', 'oklch(60% .1 210)', 892, NOW() - INTERVAL '5 months'),
('Dairy Farmers', 'Dairy farming best practices, milk prices, and cooperative info', '🥛', 'oklch(85% .03 94)', 1543, NOW() - INTERVAL '4 months'),

-- Tech & Innovation
('NairobiTech', 'Kenya tech scene: startups, coding, AI, and digital innovation', '💻', 'oklch(55% .12 241)', 3421, NOW() - INTERVAL '6 months'),
('Fintech KE', 'Mobile money, M-Pesa innovations, blockchain, and digital finance', '💳', 'oklch(50% .1 158)', 2156, NOW() - INTERVAL '5 months'),
('AI Kenya', 'Artificial intelligence, machine learning, and data science in Kenya', '🤖', 'oklch(45% .12 280)', 1234, NOW() - INTERVAL '3 months'),

-- Culture & Arts
('Swahili Folklore', 'East African stories, proverbs, traditional knowledge, and oral history', '📖', 'oklch(55% .1 42)', 1876, NOW() - INTERVAL '6 months'),
('Benga & Rhumba', 'Kenyan music: Benga, Rhumba, Gengetone, and traditional sounds', '🎵', 'oklch(60% .12 350)', 2345, NOW() - INTERVAL '5 months'),
('Kenyan Art', 'Visual arts, photography, sculpture, and creative expression', '🎨', 'oklch(55% .1 320)', 987, NOW() - INTERVAL '4 months'),

-- Trade & Business
('Mombasa Trade', 'Coast region trade, import/export, and business opportunities', '🏪', 'oklch(60% .1 42)', 1654, NOW() - INTERVAL '6 months'),
('Biashara and Hustles', 'Small business tips, side hustles, and entrepreneurship in Kenya', '💼', 'oklch(65% .12 78)', 4532, NOW() - INTERVAL '6 months'),
('Market Prices KE', 'Real-time market prices for produce, goods, and services across counties', '📊', 'oklch(55% .1 158)', 3211, NOW() - INTERVAL '5 months'),

-- Safety & Community
('Nyumba Kumi', 'Neighbourhood watch, community safety, and local security alerts', '🛡️', 'oklch(50% .12 31)', 5432, NOW() - INTERVAL '6 months'),
('County Politics', 'County governance, devolution, MCA updates, and civic participation', '🏛️', 'oklch(50% .1 241)', 2876, NOW() - INTERVAL '5 months'),

-- Education
('Learn Together', 'Study groups, exam prep, scholarship info, and learning resources', '📚', 'oklch(60% .12 158)', 3654, NOW() - INTERVAL '6 months'),
('University KE', 'Kenyan universities: admissions, courses, campus life, and research', '🎓', 'oklch(50% .1 200)', 2345, NOW() - INTERVAL '5 months'),
('TVET Kenya', 'Technical and vocational training, apprenticeships, and skills development', '🔧', 'oklch(55% .08 42)', 1432, NOW() - INTERVAL '4 months'),

-- Health & Wellness
('Health Kenya', 'Health tips, wellness, traditional medicine, and healthcare access', '🏥', 'oklch(55% .12 155)', 2876, NOW() - INTERVAL '5 months'),
('Mental Health KE', 'Mental health awareness, support, and community care', '🧠', 'oklch(60% .1 280)', 1543, NOW() - INTERVAL '4 months'),

-- Environment
('Green Kenya', 'Environmental conservation, climate action, and sustainability', '🌿', 'oklch(55% .15 145)', 1987, NOW() - INTERVAL '5 months'),
('Wildlife Kenya', 'Wildlife conservation, safaris, and human-wildlife coexistence', '🦁', 'oklch(60% .1 85)', 2345, NOW() - INTERVAL '5 months')

ON CONFLICT (name) DO NOTHING;
