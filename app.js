/* ═══════════════════════════════════════════════════════════════════
   KikwetuConnect - Master Hub Engine (v2)
   Centralized Reactive State Controller with Optimistic UI,
   Offline Queue, and Live Audio Room Presence
   ═══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'kikwetu_session';
const DARK_KEY = 'kikwetu_dark';
let currentUser = null;
let subscriptions = [];
let offlineSub = null;

function kikwetuMasterHub() {
    return {

        // ═══════════════════════════════════════════
        // 1. CORE APP STATE
        // ═══════════════════════════════════════════
        darkMode: true,
        currentRoute: 'landing',
        previousRoute: null,
        isLoggedIn: false,
        scrolled: false,
        initialized: false,
        isOnline: navigator.onLine,
        pendingSyncCount: 0,
        realtimeAvailable: false,
        _pollingIntervals: [],

        // ═══════════════════════════════════════════
        // 2. USER DATA STORE
        // ═══════════════════════════════════════════
        userName: '',
        userHandle: '',
        userCounty: 'Trans-Nzoia',
        userPhone: '',
        userRole: 'user',
        userEmail: '',
        userAvatar: '',
        heshimaScore: 762,
        preferredLang: 'en',
        currentLang: 'en',
        userInterests: [],
        allInterests: [
            '#KilimoSmart', 'Tech Kenya', 'Education', 'Health',
            'Culture', 'Business', 'Sports', 'Politics'
        ],
        userBadges: ['Mwalimu', 'Top Contributor'],
        profileStats: {
            answers: 24,
            badges: 5,
            followers: 156,
            following: 43,
            posts: 18
        },

        // ═══════════════════════════════════════════
        // 3. AUTH & ONBOARDING STATE
        // ═══════════════════════════════════════════
        authMode: 'signup',
        userPassword: '',
        onboardStep: 1,

        // ═══════════════════════════════════════════
        // 4. FEED DATA STORE (threads)
        // ═══════════════════════════════════════════
        feedTab: 'all',
        feedTabs: [
            { id: 'all', label: 'Yote (All)' },
            { id: 'kilimo', label: '#KilimoSmart' },
            { id: 'tech', label: 'Tech & Biz' },
            { id: 'culture', label: 'Utamaduni' },
            { id: 'education', label: 'Elimu' },
            { id: 'health', label: 'Afya' }
        ],
        feedPosts: [
            {
                id: 1,
                type: 'qa',
                author: 'Mkulima Jane',
                authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                verified: true,
                county: 'Kitale',
                space: '#KilimoSmart',
                time: '2 hrs ago',
                title: 'How do I test soil pH at home without expensive laboratory equipment?',
                body: 'You can use the simple vinegar and baking soda home test method. Take two soil samples: mix vinegar with the first -- fizzing indicates alkaline soil. Mix water and baking soda with the second -- fizzing indicates acidic soil!',
                bodySw: 'Unaweza kutumia mbinu ya siki (vinegar) na kuoka soda (baking soda). Chukua sampuli mbili za udongo, weka siki kwenye moja; ikiwa itafanya povu, udongo una alkali.',
                votes: 783,
                answers: 34,
                translated: false,
                voted: false
            },
            {
                id: 2,
                type: 'quiz',
                title: 'Kikwetu Daily Quiz #42',
                subtitle: 'Earn +50 Karma Points',
                time: '1 hr ago',
                question: 'Which historical Kenyan coastal town was a major trading center with Arabia and India before the 15th century?',
                options: [
                    { label: 'A', text: 'Mombasa (Gedi/Old Town)', correct: true },
                    { label: 'B', text: 'Kisumu Port', correct: false },
                    { label: 'C', text: 'Nakuru CBD', correct: false }
                ],
                answered: null,
                points: 50
            },
            {
                id: 3,
                type: 'video',
                author: 'Yonas Boley',
                authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
                verified: false,
                county: 'Nairobi',
                space: '#TechKenya',
                time: '4 hrs ago',
                title: 'Building Full-Stack Flutter & Dart mobile applications tailored for local SACCOs.',
                thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
                duration: '1m 45s',
                votes: 156,
                answers: 12,
                voted: false
            },
            {
                id: 4,
                type: 'poll',
                title: 'What should be the next #KilimoSmart live baraza topic?',
                time: '1 day ago',
                totalVotes: 328,
                options: [
                    { text: 'Drip Irrigation Systems', pct: 62, color: 'bg-brand-green', voted: false },
                    { text: 'Poultry Farming', pct: 24, color: 'bg-brand-orange', voted: false },
                    { text: 'Dairy Farming', pct: 14, color: 'bg-blue-500', voted: false }
                ]
            }
        ],
        translatedPosts: {},

        // ═══════════════════════════════════════════
        // 5. THREAD DATA STORE (replies)
        // ═══════════════════════════════════════════
        threadPostId: null,
        threadSort: 'best',
        threadAnswers: [
            {
                id: 1,
                author: 'Prof. Omondi',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                verified: true,
                content: 'Consistent revision, past papers, and group discussions are key. Start with the most tested topics and create a study timetable that covers all subjects systematically.',
                votes: 124,
                time: '3 hrs ago',
                voted: false,
                replies: []
            },
            {
                id: 2,
                author: 'Mwalimu Wanjiku',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                verified: true,
                content: 'Focus on understanding concepts rather than memorizing. Use KNEC past papers from the last 10 years and practice under timed conditions.',
                votes: 89,
                time: '2 hrs ago',
                voted: false,
                replies: []
            },
            {
                id: 3,
                author: 'Student Kevo',
                avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
                verified: false,
                content: 'I improved from C+ to A- using just past papers and YouTube tutorials. The key is consistency -- 2 hours daily minimum.',
                votes: 45,
                time: '1 hr ago',
                voted: false,
                replies: []
            }
        ],

        // ═══════════════════════════════════════════
        // 6. SPACES DATA STORE
        // ═══════════════════════════════════════════
        spacesList: [
            { id: 'kilimo', name: 'Kilimo Smart (Rift Valley)', desc: 'Modern agronomy, soil health, and market access.', members: '14.2k', icon: '\uD83C\uDF3E', joined: true, category: 'agriculture' },
            { id: 'tech', name: 'Nairobi Tech & Startups', desc: 'Full-stack engineering, Flutter, and local software solutions.', members: '9.8k', icon: '\uD83D\uDCBB', joined: true, category: 'tech' },
            { id: 'swahili', name: 'Swahili & Folklore Hub', desc: 'Preserving Kenyan storytelling, poetry, and linguistic roots.', members: '6.4k', icon: '\uD83D\uDCD6', joined: false, category: 'culture' },
            { id: 'mombasa', name: 'Mombasa Business & Trade', desc: 'Coastal trade, logistics, and tourism networks.', members: '5.1k', icon: '\uD83D\uDEA2', joined: false, category: 'business' },
            { id: 'education', name: 'Elimu Yetu (Education)', desc: 'KCSE, university, TVET, and lifelong learning resources.', members: '11.3k', icon: '\uD83C\uDF93', joined: false, category: 'education' },
            { id: 'health', name: 'Afya Bora (Health)', desc: 'Community health, wellness tips, and medical Q&A.', members: '7.6k', icon: '\uD83C\uDFE5', joined: false, category: 'health' },
            { id: 'sports', name: 'Mchezo Bora (Sports)', desc: 'Football, athletics, and local sports community.', members: '8.9k', icon: '\u26BD', joined: false, category: 'sports' },
            { id: 'politics', name: 'Siasa Safi (Politics)', desc: 'Civic engagement, county governance, and fact-checked discourse.', members: '6.1k', icon: '\uD83C\uDFDB\uFE0F', joined: false, category: 'politics' }
        ],

        // ═══════════════════════════════════════════
        // 7. LEADERBOARD DATA STORE
        // ═══════════════════════════════════════════
        leaderboard: [
            { rank: 1, name: 'Mkulima Jane', county: 'Trans-Nzoia', pts: 4820, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', medal: 'bg-yellow-500' },
            { rank: 2, name: 'Yonas Boley', county: 'Nairobi', pts: 3950, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', medal: 'bg-gray-300 text-gray-800' },
            { rank: 3, name: 'Amina Hassan', county: 'Mombasa', pts: 3210, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', medal: 'bg-amber-600' },
            { rank: 4, name: 'Dr. Kipchoge', county: 'Uasin Gishu', pts: 2890, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', medal: 'bg-gray-400' },
            { rank: 5, name: 'Wanjiku Dev', county: 'Nairobi', pts: 2340, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', medal: 'bg-gray-400' }
        ],
        quizScore: 0,
        quizStats: { taken: 12, accuracy: 83 },

        // ═══════════════════════════════════════════
        // 8. NOTIFICATIONS DATA STORE
        // ═══════════════════════════════════════════
        unreadCount: 3,
        notifications: [
            { id: 1, icon: 'fa-arrow-up', iconBg: 'bg-brand-orange/20 text-brand-orange', text: '<strong>Mkulima Jane</strong> and 45 others upvoted your answer in #KilimoSmart.', time: '10 mins ago', read: false },
            { id: 2, icon: 'fa-award', iconBg: 'bg-green-100 text-green-700', text: 'You earned the <strong>Mwalimu Badge</strong> for completing 5 weekly quizzes!', time: '2 hours ago', read: false },
            { id: 3, icon: 'fa-comment', iconBg: 'bg-blue-100 text-blue-600', text: '<strong>Prof. Omondi</strong> replied to your question about KCSE preparation.', time: '5 hours ago', read: false },
            { id: 4, icon: 'fa-user-plus', iconBg: 'bg-purple-100 text-purple-600', text: '<strong>Dr. Kipchoge</strong> started following you.', time: '1 day ago', read: true },
            { id: 5, icon: 'fa-star', iconBg: 'bg-yellow-100 text-yellow-600', text: 'Your answer was pinned as <strong>Best Answer</strong> in #KilimoSmart!', time: '2 days ago', read: true }
        ],

        // ═══════════════════════════════════════════
        // 9. LIVE ROOMS DATA STORE
        // ═══════════════════════════════════════════
        liveRooms: [
            { id: null, title: 'The Future of TVET & Freelance Careers in East Africa', hosts: 'NairobiTechie & 4 others', listeners: 234, type: 'Audio', active: true, participants: [] },
            { id: null, title: 'Maize Prices Update: Rift Valley Market Analysis', hosts: 'Mkulima Jane & 2 others', listeners: 189, type: 'Audio', active: true, participants: [] }
        ],
        currentRoom: null,
        roomPresence: [],

        // ═══════════════════════════════════════════
        // 10. TRENDING & MISC DATA
        // ═══════════════════════════════════════════
        trendingTopics: [
            { tag: '#KilimoSmart', category: 'Agriculture', posts: '14.2k' },
            { tag: '#ShuleYetu', category: 'Education', posts: '8.9k' },
            { tag: '#NairobiTech', category: 'Tech & Startups', posts: '5.1k' },
            { tag: '#AfyaBora', category: 'Health', posts: '3.8k' },
            { tag: '#MchezoBora', category: 'Sports', posts: '2.4k' }
        ],

        howItWorksSteps: [
            { title: 'Create Your Profile & Join Local Spaces', desc: 'Sign up with your county details and instantly access specialized spaces.' },
            { title: 'Ask Questions & Earn Heshima', desc: 'Submit community inquiries, answer peer questions, and build your reputation.' },
            { title: 'Take Quizzes & Climb the Leaderboard', desc: 'Challenge yourself with timed county-level quizzes. Earn karma points and badges.' },
            { title: 'Engage in Live Audio Barazas', desc: 'Participate in live audio room sessions and toggle seamlessly between languages.' },
            { title: 'Share & Grow Your Network', desc: 'Share knowledge, connect with experts, and build your professional presence.' }
        ],

        // ═══════════════════════════════════════════
        // 11. MODAL & UI STATE
        // ═══════════════════════════════════════════
        activeModal: null,
        newPostContent: '',
        newAnswerContent: '',
        newPostSpace: 'general',
        newPostType: 'question',
        searchQuery: '',
        isListening: false,
        toastMessage: '',
        toastVisible: false,
        toastTimer: null,

        // ═══════════════════════════════════════════
        // 12. CONTACT FORM STATE
        // ═══════════════════════════════════════════
        contactName: '',
        contactEmail: '',
        contactMessage: '',


        // ═══════════════════════════════════════════════════════════
        // LIFECYCLE & WIRING ENGINE
        // ═══════════════════════════════════════════════════════════

        async init() {
            this.loadStoredState();
            this.loadDarkMode();
            this.handleHash();
            this.initScrollListener();
            this.initKeyboardShortcuts();
            this.initialized = true;

            // Initialize Supabase + Offline DB
            const sbReady = initSupabase();
            const offlineReady = initOfflineDB();

            // Online/offline listeners
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.showToast('Back online! Syncing...');
                this.syncPendingActions();
            });
            window.addEventListener('offline', () => {
                this.isOnline = false;
                this.showToast('You are offline. Changes will sync when reconnected.');
            });

            // Auth state change
            DB.onAuthStateChange(async (event, session) => {
                console.log('[Auth] Event:', event);
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    if (session && session.user) {
                        currentUser = session.user;
                        await this.loadUserProfile(session.user.id);
                        this.isLoggedIn = true;
                        this.saveState();
                        this.startRealtimeSubscriptions();
                        this.startOfflineSync();
                        if (this.currentRoute === 'landing' || this.currentRoute === 'onboarding') {
                            this.currentRoute = 'feed';
                            window.history.replaceState({ route: 'feed' }, '', '#feed');
                        }
                    } else {
                        currentUser = null;
                        this.isLoggedIn = false;
                        this.saveState();
                    }
                } else if (event === 'SIGNED_OUT') {
                    currentUser = null;
                    this.isLoggedIn = false;
                    this.stopRealtimeSubscriptions();
                    this.stopOfflineSync();
                    this.saveState();
                }
            });

            // Check existing session
            const { data: { session } } = await DB.getSession();
            if (session && session.user) {
                currentUser = session.user;
                await this.loadUserProfile(session.user.id);
                this.isLoggedIn = true;
                this.startRealtimeSubscriptions();
                this.startOfflineSync();
                // Redirect away from landing if logged in
                if (this.currentRoute === 'landing' || this.currentRoute === 'onboarding') {
                    this.currentRoute = 'feed';
                    window.history.replaceState({ route: 'feed' }, '', '#feed');
                }
            } else {
                // No valid session — clear stale localStorage
                currentUser = null;
                this.isLoggedIn = false;
                this.saveState();
            }

            window.addEventListener('hashchange', () => this.handleHash());
            window.addEventListener('popstate', (e) => {
                if (e.state && e.state.route) this.currentRoute = e.state.route;
            });

            // Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js').then(reg => {
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showToast('New version available. Refresh to update.');
                            }
                        });
                    });
                }).catch(() => {});
            }

            // Update pending sync count periodically
            setInterval(async () => {
                if (typeof Offline !== 'undefined') {
                    this.pendingSyncCount = await Offline.getPendingCount();
                }
            }, 10000);

            console.log('[KikwetuHub] Initialized');
        },

        loadStoredState() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const data = JSON.parse(saved);
                    this.isLoggedIn = data.isLoggedIn || false;
                    this.userName = data.userName || this.userName;
                    this.userHandle = data.userHandle || this.userHandle;
                    this.userCounty = data.userCounty || this.userCounty;
                    this.userEmail = data.userEmail || this.userEmail;
                    this.userPhone = data.userPhone || this.userPhone;
                    this.preferredLang = data.preferredLang || this.preferredLang;
                    this.heshimaScore = data.heshimaScore || this.heshimaScore;
                    this.userInterests = data.userInterests || [];
                    this.userBadges = data.userBadges || this.userBadges;
                    this.profileStats = data.profileStats || this.profileStats;
                    this.quizScore = data.quizScore || 0;
                    this.quizStats = data.quizStats || this.quizStats;
                    if (data.userAvatar) this.userAvatar = data.userAvatar;
                }
            } catch (e) {
                console.warn('Failed to load stored state:', e);
            }
        },

        saveState() {
            try {
                const data = {
                    isLoggedIn: this.isLoggedIn,
                    userName: this.userName,
                    userHandle: this.userHandle,
                    userCounty: this.userCounty,
                    userEmail: this.userEmail,
                    userPhone: this.userPhone,
                    userAvatar: this.userAvatar,
                    preferredLang: this.preferredLang,
                    heshimaScore: this.heshimaScore,
                    userInterests: this.userInterests,
                    userBadges: this.userBadges,
                    profileStats: this.profileStats,
                    quizScore: this.quizScore,
                    quizStats: this.quizStats
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to save state:', e);
            }
        },

        loadDarkMode() {
            const saved = localStorage.getItem(DARK_KEY);
            if (saved !== null) {
                this.darkMode = saved === 'true';
            } else {
                this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
        },

        initScrollListener() {
            let ticking = false;
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        this.scrolled = window.scrollY > 10;
                        ticking = false;
                    });
                    ticking = true;
                }
            });
        },

        initKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (this.activeModal) this.activeModal = null;
                    if (this.currentRoom) this.leaveLiveRoom();
                }
                if (e.ctrlKey && e.key === 'k') {
                    e.preventDefault();
                    if (this.isLoggedIn) {
                        const searchInput = document.querySelector('[data-search-input]');
                        if (searchInput) searchInput.focus();
                    }
                }
            });
        },


        // ═══════════════════════════════════════════════════════════
        // NAVIGATION & ROUTING
        // ═══════════════════════════════════════════════════════════

        go(newRoute) {
            if (newRoute === 'feed' && !this.isLoggedIn) newRoute = 'onboarding';
            if (newRoute === 'landing' && this.isLoggedIn) newRoute = 'feed';
            if (newRoute === 'onboarding') this.onboardStep = 1;
            // Stop thread subscription when leaving thread view
            if (this.currentRoute === 'thread' && newRoute !== 'thread') {
                this.stopThreadSubscription();
            }
            this.previousRoute = this.currentRoute;
            this.currentRoute = newRoute;
            window.history.pushState({ route: newRoute }, '', `#${newRoute}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        handleHash() {
            const hash = window.location.hash.slice(1);
            if (hash && hash !== this.currentRoute) this.currentRoute = hash;
        },

        goBack() {
            if (this.previousRoute) this.go(this.previousRoute);
            else window.history.back();
        },

        toggleDark() {
            this.darkMode = !this.darkMode;
            localStorage.setItem(DARK_KEY, this.darkMode);
        },


        // ═══════════════════════════════════════════════════════════
        // LANGUAGE ENGINE
        // ═══════════════════════════════════════════════════════════

        toggleLang() {
            this.currentLang = this.currentLang === 'en' ? 'sw' : 'en';
            this.showToast(this.currentLang === 'sw' ? 'Lugha: Kiswahili' : 'Language: English');
        },

        toggleTranslate(postId) {
            this.translatedPosts[postId] = !this.translatedPosts[postId];
        },

        getTranslatedText(post) {
            if (this.translatedPosts[post.id] && post.bodySw) return post.bodySw;
            return post.body;
        },

        getTranslatedTitle(post) {
            if (this.translatedPosts[post.id] && post.titleSw) return post.titleSw;
            return post.title;
        },


        // ═══════════════════════════════════════════════════════════
        // AUTHENTICATION ENGINE
        // ═══════════════════════════════════════════════════════════

        toggleInterest(interest) {
            const idx = this.userInterests.indexOf(interest);
            if (idx > -1) this.userInterests.splice(idx, 1);
            else this.userInterests.push(interest);
        },

        async loginWithEmail() {
            try {
                if (!this.userEmail || !this.userPassword) {
                    this.showToast('Please enter email and password.');
                    return;
                }
                const { data, error } = await DB.signInWithEmail(this.userEmail, this.userPassword);
                if (error) {
                    this.showToast(error.message || 'Login failed. Check your credentials.');
                    return;
                }
                if (data.user) {
                    currentUser = data.user;
                    await this.loadUserProfile(data.user.id);
                    this.isLoggedIn = true;
                    this.startRealtimeSubscriptions();
                    this.startOfflineSync();
                    this.saveState();
                    this.go('feed');
                    this.showToast('Karibu back! You are logged in.');
                }
            } catch (e) {
                console.error('[Auth] Login error:', e);
                this.showToast('Login failed. Please try again.');
            }
        },

        async completeOnboarding() {
            try {
                if (!this.userEmail || !this.userPassword) {
                    this.showToast('Email and password are required.');
                    return;
                }
                if (this.userPassword.length < 6) {
                    this.showToast('Password must be at least 6 characters.');
                    return;
                }
                const { data, error } = await DB.signUpWithEmail(
                    this.userEmail,
                    this.userPassword,
                    {
                        full_name: this.userName,
                        username: this.userHandle,
                        phone: this.userPhone,
                        county: this.userCounty,
                        preferred_lang: this.preferredLang,
                        interests: this.userInterests,
                        avatar_url: this.userAvatar
                    }
                );
                if (error) {
                    this.showToast(error.message || 'Signup failed. Try again.');
                    return;
                }
                if (data.session) {
                    currentUser = data.user;
                    this.isLoggedIn = true;
                    this.heshimaScore = 100;
                    // Update profile with complete data from form
                    const profileResult = await DB.createProfile(data.user.id, {
                        full_name: this.userName,
                        username: this.userHandle,
                        phone: this.userPhone,
                        county: this.userCounty,
                        preferred_lang: this.preferredLang,
                        interests: this.userInterests,
                        avatar_url: this.userAvatar
                    });
                    if (profileResult && !profileResult.error) {
                        this.userRole = profileResult.data.role || 'user';
                    }
                    this.onboardStep = 1;
                    this.userPassword = '';
                    this.startRealtimeSubscriptions();
                    this.startOfflineSync();
                    this.saveState();
                    this.go('feed');
                    this.showToast('Karibu KikwetuConnect! Your Heshima starts at 100.');
                } else if (data.user) {
                    this.showToast('Account created! Check your email to confirm and log in.');
                    this.go('landing');
                }
            } catch (e) {
                console.error('[Auth] Signup error:', e);
                this.showToast('Signup failed. Please try again.');
            }
        },

        async signInWithGoogle() {
            const { error } = await DB.signInWithGoogle();
            if (error) {
                this.showToast('Google sign-in failed. Please try again.');
            }
        },

        async logout() {
            await DB.signOut();
            currentUser = null;
            this.isLoggedIn = false;
            this.heshimaScore = 0;
            this.userName = '';
            this.userHandle = '';
            this.userEmail = '';
            this.userPassword = '';
            this.userPhone = '';
            this.userRole = 'user';
            this.preferredLang = 'en';
            this.userInterests = [];
            this.userBadges = [];
            this.userAvatar = '';
            this.notifications = [];
            this.unreadCount = 0;
            this.activeModal = null;
            this.authMode = 'signup';
            this.onboardStep = 1;
            this.stopRealtimeSubscriptions();
            this.stopOfflineSync();
            this.saveState();
            this.go('landing');
            this.showToast('You have been logged out. Kwaheri!');
        },

        confirmLogout() {
            this.activeModal = 'logoutConfirm';
        },


        // ═══════════════════════════════════════════════════════════
        // USER PROFILE LOADING
        // ═══════════════════════════════════════════════════════════

        async loadUserProfile(userId) {
            const { data, error } = await DB.getProfile(userId);
            if (data && !error) {
                this.userName = data.full_name || this.userName;
                this.userHandle = data.username || this.userHandle;
                this.userCounty = data.county || this.userCounty;
                this.userEmail = data.email || this.userEmail;
                this.userPhone = data.phone || this.userPhone;
                this.userRole = data.role || 'user';
                this.userAvatar = data.avatar_url || this.userAvatar;
                this.heshimaScore = data.heshima_score || 100;
                this.preferredLang = data.preferred_lang || 'en';
                this.userInterests = data.interests || [];
                this.userBadges = data.badges || ['Mwananchi'];
                this.profileStats.answers = data.answer_count || 0;
                this.profileStats.posts = data.post_count || 0;
                this.profileStats.followers = data.follower_count || 0;
                this.profileStats.following = data.following_count || 0;
                this.saveState();
                // Cache for offline
                if (typeof Offline !== 'undefined') await Offline.cacheProfile(data);
            }
        },

        async loadFeedPosts() {
            const { data, error } = await DB.getFeedThreads({ limit: 30 });
            if (data && !error) {
                this.feedPosts = data.map(p => ({
                    id: p.id,
                    type: p.type === 'educative' ? 'qa' : p.type,
                    author: p.author?.full_name || 'Anonymous',
                    authorId: p.author_id,
                    authorAvatar: p.author?.avatar_url || '',
                    verified: p.author?.verified || false,
                    county: p.author?.county || p.county || '',
                    space: p.space?.name || 'General',
                    time: this.timeAgo(new Date(p.created_at)),
                    title: p.title,
                    body: p.content,
                    votes: p.upvotes_count || 0,
                    answers: p.reply_count || 0,
                    voted: false,
                    translated: false
                }));
                // Cache for offline
                if (typeof Offline !== 'undefined') await Offline.cacheThreads(data);
            }
        },

        async loadLeaderboard() {
            const { data, error } = await DB.getLeaderboard(50);
            if (data && !error) {
                this.leaderboard = data.map((p, i) => ({
                    id: p.id,
                    rank: i + 1,
                    name: p.full_name || 'Anonymous',
                    county: p.county || 'Kenya',
                    pts: p.heshima_score || 0,
                    avatar: p.avatar_url || '',
                    medal: i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-300 text-gray-800' : i === 2 ? 'bg-amber-600' : 'bg-gray-400',
                    isUser: currentUser && p.id === currentUser.id
                }));
            }
        },

        async loadSpaces() {
            const { data, error } = await DB.getSpaces();
            if (data && !error) {
                this.spacesList = data.map(s => ({
                    id: s.slug,
                    name: s.name,
                    desc: s.description,
                    members: this.formatNumber(s.member_count),
                    icon: s.icon,
                    joined: false,
                    category: s.category
                }));
                if (currentUser) {
                    const { data: userSpaces } = await DB.getUserSpaces(currentUser.id);
                    if (userSpaces) {
                        this.spacesList.forEach(s => {
                            const match = userSpaces.find(us => us.spaces?.slug === s.id);
                            if (match) s.joined = true;
                        });
                    }
                }
            }
        },

        async loadNotifications() {
            if (!currentUser) return;
            const { data, error } = await DB.getNotifications(currentUser.id, 30);
            if (data && !error) {
                this.notifications = data.map(n => ({
                    id: n.id,
                    icon: this.getNotificationIcon(n.type),
                    iconBg: this.getNotificationBg(n.type),
                    text: n.content,
                    time: this.timeAgo(new Date(n.created_at)),
                    read: n.is_read
                }));
                this.unreadCount = this.notifications.filter(n => !n.read).length;
            }
        },

        getNotificationIcon(type) {
            const icons = { upvote: 'fa-arrow-up', answer: 'fa-comment', badge: 'fa-award', follow: 'fa-user-plus', mention: 'fa-at', accepted: 'fa-check-circle' };
            return icons[type] || 'fa-bell';
        },

        getNotificationBg(type) {
            const bgs = {
                upvote: 'bg-brand-orange/20 text-brand-orange', answer: 'bg-blue-100 text-blue-600',
                badge: 'bg-green-100 text-green-700', follow: 'bg-purple-100 text-purple-600',
                mention: 'bg-yellow-100 text-yellow-600', accepted: 'bg-green-100 text-green-700'
            };
            return bgs[type] || 'bg-gray-100 text-gray-600';
        },


        // ═══════════════════════════════════════════════════════════
        // FEED ACTIONS (Optimistic UI + Offline Queue)
        // ═══════════════════════════════════════════════════════════

        upvotePost(postId) {
            if (!this.isLoggedIn) { this.go('onboarding'); return; }
            const post = this.feedPosts.find(p => p.id === postId);
            if (post && !post.voted) {
                // Optimistic update
                post.votes += 1;
                post.voted = true;
                this.heshimaScore += 1;
                this.saveState();

                if (currentUser) {
                    DB.vote(currentUser.id, postId, 'thread', 'up').then(({ error }) => {
                        if (error) {
                            this.rollbackVote(post, -1, -1);
                        } else {
                            // Notify the thread author
                            DB.createNotification({
                                userId: post.authorId,
                                type: 'upvote',
                                actorId: currentUser.id,
                                entityType: 'thread',
                                entityId: postId,
                                content: `<strong>${this.userName}</strong> upvoted your post "${(post.title || '').substring(0, 50)}..."`
                            });
                        }
                    });
                } else if (typeof Offline !== 'undefined') {
                    Offline.queueAction({ type: 'vote', userId: 'anonymous', payload: { userId: 'anonymous', entityId: postId, entityType: 'thread', voteType: 'up' } });
                }
            }
        },

        rollbackVote(post, voteDelta, heshimaDelta) {
            post.votes += voteDelta;
            post.voted = false;
            this.heshimaScore += heshimaDelta;
            this.saveState();
            this.showToast('Vote failed. Will retry when online.');
            if (typeof Offline !== 'undefined') {
                Offline.queueAction({ type: 'vote', userId: currentUser?.id, payload: { userId: currentUser?.id, entityId: post.id, entityType: 'thread', voteType: 'up' } });
            }
        },

        answerQuiz(postId, option) {
            const post = this.feedPosts.find(p => p.id === postId);
            if (!post || post.answered) return;
            post.answered = option;
            const selected = post.options.find(o => o.label === option);
            if (selected && selected.correct) {
                this.quizScore += post.points;
                this.heshimaScore += post.points;
                this.quizStats.taken += 1;
                this.saveState();
                this.showToast(`+${post.points} Karma points! Sawa!`);
                if (currentUser) DB.submitQuizResult(currentUser.id, postId, true, post.points, 0);
            } else {
                this.quizStats.taken += 1;
                this.saveState();
                this.showToast('Not quite! The correct answer is A.');
                if (currentUser) DB.submitQuizResult(currentUser.id, postId, false, 0, 0);
            }
        },

        votePoll(postId, optionIndex) {
            if (!this.isLoggedIn) { this.go('onboarding'); return; }
            const post = this.feedPosts.find(p => p.id === postId);
            if (!post) return;
            if (post.options.some(o => o.voted)) return;
            post.options[optionIndex].voted = true;
            post.totalVotes += 1;
            this.showToast('Vote recorded! Asante!');
        },

        shareToWhatsApp(postId) {
            const post = this.feedPosts.find(p => p.id === postId);
            const text = post ? encodeURIComponent(`Check this out on KikwetuConnect: "${post.title}"`) : encodeURIComponent('Check out KikwetuConnect!');
            window.open(`https://wa.me/?text=${text}`, '_blank');
        },

        selectPostType(type) {
            this.newPostType = type;
        },

        async submitPost() {
            if (this.newPostContent.trim() === '') { this.showToast('Please write something before posting.'); return; }
            if (!currentUser) { this.go('onboarding'); return; }

            // Optimistic insert
            const optimisticPost = {
                id: `temp-${Date.now()}`,
                type: this.newPostType === 'question' ? 'qa' : this.newPostType,
                author: this.userName,
                authorId: currentUser.id,
                authorAvatar: this.userAvatar,
                verified: false,
                county: this.userCounty,
                space: this.newPostSpace,
                time: 'Just now',
                title: this.newPostContent.trim().substring(0, 100),
                body: this.newPostContent.trim(),
                votes: 0,
                answers: 0,
                voted: false
            };
            this.feedPosts.unshift(optimisticPost);

            // Resolve space slug to space ID
            let spaceId = null;
            if (this.newPostSpace && this.newPostSpace !== 'general') {
                const { data: spaceData } = await DB.getSpaceBySlug(this.newPostSpace);
                if (spaceData) spaceId = spaceData.id;
            }

            const { data, error } = await DB.createThread({
                authorId: currentUser.id,
                spaceId: spaceId,
                type: this.newPostType === 'question' ? 'question' : 'educative',
                title: this.newPostContent.trim().substring(0, 100),
                content: this.newPostContent.trim(),
                language: this.currentLang,
                county: this.userCounty,
                tags: [this.newPostSpace]
            });

            if (!error && data) {
                // Replace temp with real data
                const idx = this.feedPosts.findIndex(p => p.id === optimisticPost.id);
                if (idx > -1) {
                    this.feedPosts[idx].id = data.id;
                }
            } else {
                // Queue for offline sync
                if (typeof Offline !== 'undefined') {
                    await Offline.queueAction({
                        type: 'createThread',
                        userId: currentUser.id,
                        payload: {
                            authorId: currentUser.id,
                            type: this.newPostType === 'question' ? 'question' : 'educative',
                            title: this.newPostContent.trim().substring(0, 100),
                            content: this.newPostContent.trim(),
                            language: this.currentLang,
                            county: this.userCounty,
                            tags: [this.newPostSpace]
                        }
                    });
                }
                this.showToast('Saved to queue. Will sync when online.');
            }

            this.newPostContent = '';
            this.activeModal = null;
            this.heshimaScore += 10;
            this.profileStats.posts += 1;
            this.saveState();
        },


        // ═══════════════════════════════════════════════════════════
        // THREAD ACTIONS (Replies)
        // ═══════════════════════════════════════════════════════════

        openThread(postId) {
            this.threadPostId = postId;
            this.go('thread');
            // Subscribe to live replies for this thread
            this.$nextTick(() => this.startThreadSubscription(postId));
        },

        getThreadPost() {
            return this.feedPosts.find(p => p.id === this.threadPostId);
        },

        upvoteAnswer(answerId) {
            if (!this.isLoggedIn) { this.go('onboarding'); return; }
            const ans = this.threadAnswers.find(a => a.id === answerId);
            if (ans && !ans.voted) {
                ans.votes += 1;
                ans.voted = true;
                this.heshimaScore += 1;
                this.saveState();
                if (currentUser) {
                    DB.vote(currentUser.id, answerId, 'reply', 'up').then(() => {
                        DB.createNotification({
                            userId: ans.authorId,
                            type: 'upvote',
                            actorId: currentUser.id,
                            entityType: 'reply',
                            entityId: answerId,
                            content: `<strong>${this.userName}</strong> upvoted your answer.`
                        });
                    });
                }
            }
        },

        async postAnswer(content) {
            if (!content || content.trim() === '') { this.showToast('Please write an answer first.'); return; }
            if (!currentUser) { this.go('onboarding'); return; }

            // Optimistic insert
            const optimisticAnswer = {
                id: `temp-${Date.now()}`,
                author: this.userName,
                authorId: currentUser.id,
                avatar: this.userAvatar,
                verified: false,
                content: content.trim(),
                votes: 0,
                time: 'Just now',
                voted: false,
                replies: []
            };
            this.threadAnswers.unshift(optimisticAnswer);

            const { data, error } = await DB.createReply({
                threadId: this.threadPostId,
                authorId: currentUser.id,
                content: content.trim()
            });

            if (!error && data) {
                const idx = this.threadAnswers.findIndex(a => a.id === optimisticAnswer.id);
                if (idx > -1) this.threadAnswers[idx].id = data.id;
                // Notify the thread author
                const threadPost = this.getThreadPost();
                if (threadPost && threadPost.authorId !== currentUser.id) {
                    DB.createNotification({
                        userId: threadPost.authorId,
                        type: 'answer',
                        actorId: currentUser.id,
                        entityType: 'thread',
                        entityId: this.threadPostId,
                        content: `<strong>${this.userName}</strong> answered your question "${(threadPost.title || '').substring(0, 50)}..."`
                    });
                }
            } else {
                if (typeof Offline !== 'undefined') {
                    await Offline.queueAction({
                        type: 'createReply',
                        userId: currentUser.id,
                        payload: { threadId: this.threadPostId, authorId: currentUser.id, content: content.trim() }
                    });
                }
                this.showToast('Saved to queue. Will sync when online.');
            }

            this.heshimaScore += 15;
            this.profileStats.answers += 1;
            this.saveState();
        },

        sortThread(sortBy) {
            this.threadSort = sortBy;
            if (sortBy === 'best') this.threadAnswers.sort((a, b) => b.votes - a.votes);
            else if (sortBy === 'newest') this.threadAnswers.sort((a, b) => b.id - a.id);
            else if (sortBy === 'oldest') this.threadAnswers.sort((a, b) => a.id - b.id);
        },


        // ═══════════════════════════════════════════════════════════
        // SPACES ACTIONS
        // ═══════════════════════════════════════════════════════════

        async toggleJoinSpace(index) {
            if (!this.isLoggedIn) { this.go('onboarding'); return; }
            const space = this.spacesList[index];
            space.joined = !space.joined;
            this.saveState();

            if (space.joined) {
                this.showToast(`Joined ${space.name}!`);
                if (currentUser) {
                    const { data: spaceData } = await DB.getSpaceBySlug(space.id);
                    if (spaceData) DB.joinSpace(currentUser.id, spaceData.id);
                }
            } else {
                this.showToast(`Left ${space.name}`);
                if (currentUser) {
                    const { data: spaceData } = await DB.getSpaceBySlug(space.id);
                    if (spaceData) DB.leaveSpace(currentUser.id, spaceData.id);
                }
            }
        },

        getJoinedSpaces() { return this.spacesList.filter(s => s.joined); },

        getFilteredSpaces(category) {
            if (!category || category === 'all') return this.spacesList;
            return this.spacesList.filter(s => s.category === category);
        },


        // ═══════════════════════════════════════════════════════════
        // LIVE AUDIO ROOMS (Supabase Presence)
        // ═══════════════════════════════════════════════════════════

        async joinLiveRoom(roomIndex) {
            if (!this.isLoggedIn) { this.go('onboarding'); return; }
            const room = this.liveRooms[roomIndex];
            this.currentRoom = room;
            this.roomPresence = [];

            this.showToast('Joining Live Audio Baraza...');

            if (sb && room.id) {
                const presence = DB.subscribeToRoomPresence(room.id);
                presence.onSync(() => {});
                presence.onJoin((key, newPresences) => {});
                presence.onLeave((key, leftPresences) => {});
                presence.track({
                    user_id: currentUser?.id || 'anonymous',
                    name: this.userName,
                    avatar: this.userAvatar,
                    joined_at: new Date().toISOString()
                });
                this._roomPresence = presence;

                await DB.joinLiveRoom(room.id);
            }
        },

        leaveLiveRoom() {
            if (this._roomPresence) {
                this._roomPresence.unsubscribe();
                this._roomPresence = null;
            }
            if (this.currentRoom?.id) {
                DB.leaveLiveRoom(this.currentRoom.id);
            }
            this.currentRoom = null;
            this.roomPresence = [];
            this.showToast('Left the audio room.');
        },

        getActiveLiveRooms() { return this.liveRooms.filter(r => r.active); },


        // ═══════════════════════════════════════════════════════════
        // NOTIFICATIONS ENGINE
        // ═══════════════════════════════════════════════════════════

        async markAllRead() {
            if (currentUser) await DB.markNotificationsRead(currentUser.id);
            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.showToast('All notifications marked as read.');
        },

        getUnreadNotifications() { return this.notifications.filter(n => !n.read); },
        getReadNotifications() { return this.notifications.filter(n => n.read); },
        clearNotifications() { this.notifications = []; this.unreadCount = 0; this.showToast('Notifications cleared.'); },


        // ═══════════════════════════════════════════════════════════
        // SEARCH ENGINE
        // ═══════════════════════════════════════════════════════════

        toggleVoice() {
            if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                this.showToast('Voice search not supported in this browser.'); return;
            }
            this.isListening = true;
            try {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = this.currentLang === 'sw' ? 'sw-KE' : 'en-KE';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                recognition.onresult = (event) => {
                    this.searchQuery = event.results[0][0].transcript;
                    this.isListening = false;
                };
                recognition.onerror = () => { this.isListening = false; };
                recognition.onend = () => { this.isListening = false; };
                recognition.start();
            } catch (e) {
                this.isListening = false;
                this.showToast('Voice search unavailable.');
            }
        },

        searchPosts() {
            if (!this.searchQuery.trim()) return this.feedPosts;
            const q = this.searchQuery.toLowerCase();
            return this.feedPosts.filter(post => {
                const text = `${post.title || ''} ${post.body || ''} ${post.author || ''} ${post.space || ''}`.toLowerCase();
                return text.includes(q);
            });
        },

        getFilteredFeed() {
            if (this.feedTab === 'all') return this.feedPosts;
            const tabMap = { kilimo: '#kilimosmart', tech: 'tech', culture: 'utamaduni', education: 'elimu', health: 'afya' };
            const filter = tabMap[this.feedTab] || '';
            return this.feedPosts.filter(post => {
                const text = `${post.space || ''} ${post.title || ''} ${post.body || ''}`.toLowerCase();
                return text.includes(filter);
            });
        },


        // ═══════════════════════════════════════════════════════════
        // CONTACT FORM
        // ═══════════════════════════════════════════════════════════

        submitContact() {
            if (!this.contactName.trim() || !this.contactEmail.trim() || !this.contactMessage.trim()) {
                this.showToast('Please fill in all fields.'); return;
            }
            this.showToast('Thank you! Your message has been sent.');
            this.contactName = '';
            this.contactEmail = '';
            this.contactMessage = '';
        },


        // ═══════════════════════════════════════════════════════════
        // LEADERBOARD
        // ═══════════════════════════════════════════════════════════

        getUserLeaderboardRank() { return this.leaderboard.findIndex(e => e.isUser) + 1; },
        getTopLeaderboard(n) { return this.leaderboard.slice(0, n || 10); },


        // ═══════════════════════════════════════════════════════════
        // PROFILE
        // ═══════════════════════════════════════════════════════════

        async updateProfile(data) {
            if (data.userName) this.userName = data.userName;
            if (data.userHandle) this.userHandle = data.userHandle;
            if (data.userCounty) this.userCounty = data.userCounty;
            if (data.userEmail) this.userEmail = data.userEmail;
            if (data.userPhone) this.userPhone = data.userPhone;
            if (data.userAvatar) this.userAvatar = data.userAvatar;
            this.saveState();
            if (currentUser) {
                await DB.updateProfile(currentUser.id, {
                    full_name: this.userName, username: this.userHandle,
                    county: this.userCounty, email: this.userEmail,
                    phone: this.userPhone, avatar_url: this.userAvatar
                });
            }
            this.showToast('Profile updated successfully!');
        },

        getJoinedSpaceObjects() { return this.spacesList.filter(s => s.joined); },

        async followUser(targetUserId, targetUserName) {
            if (!this.isLoggedIn) { this.go('onboarding'); return; }
            if (!currentUser) return;
            const { error } = await DB.followUser(currentUser.id, targetUserId);
            if (!error) {
                DB.createNotification({
                    userId: targetUserId,
                    type: 'follow',
                    actorId: currentUser.id,
                    entityType: 'user',
                    entityId: currentUser.id,
                    content: `<strong>${this.userName}</strong> started following you.`
                });
                this.showToast(`You are now following ${targetUserName}`);
            }
        },

        async unfollowUser(targetUserId) {
            if (!currentUser) return;
            await DB.unfollowUser(currentUser.id, targetUserId);
            this.showToast('Unfollowed.');
        },


        // ═══════════════════════════════════════════════════════════
        // OFFLINE SYNC ENGINE
        // ═══════════════════════════════════════════════════════════

        startOfflineSync() {
            if (typeof Offline !== 'undefined') {
                Offline.startAutoSync(30000);
            }
            // Listen for sync events from service worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data?.type === 'SYNC_ACTION') {
                        this.handleSyncAction(event.data.action);
                    }
                });
            }
        },

        stopOfflineSync() {
            if (typeof Offline !== 'undefined') Offline.stopAutoSync();
        },

        async syncPendingActions() {
            if (typeof Offline !== 'undefined') {
                const result = await Offline.syncPendingActions();
                if (result.synced > 0) this.showToast(`Synced ${result.synced} actions.`);
                this.pendingSyncCount = await Offline.getPendingCount();
            }
        },

        async handleSyncAction(action) {
            if (!action || !action.payload) return;
            switch (action.type) {
                case 'createThread':
                    await DB.createThread(action.payload);
                    break;
                case 'createReply':
                    await DB.createReply(action.payload);
                    break;
                case 'vote':
                    await DB.vote(action.payload.userId, action.payload.entityId, action.payload.entityType, action.payload.voteType);
                    break;
            }
        },


        // ═══════════════════════════════════════════════════════════
        // POLLING ENGINE (Fallback when Realtime unavailable)
        // ═══════════════════════════════════════════════════════════

        startPolling() {
            this.stopPolling();
            console.log('[KikwetuHub] Starting polling fallback');

            // Poll feed every 8 seconds
            this._pollingIntervals.push(setInterval(async () => {
                if (!this.isOnline || !currentUser) return;
                const { data } = await DB.getFeedThreads({ limit: 30 });
                if (data) {
                    const newPosts = data.filter(d => !this.feedPosts.find(p => p.id === d.id));
                    newPosts.forEach(p => {
                        this.feedPosts.unshift({
                            id: p.id, type: p.type === 'educative' ? 'qa' : p.type,
                            author: p.author?.full_name || 'Anonymous',
                            authorId: p.author_id,
                            authorAvatar: p.author?.avatar_url || '',
                            verified: p.author?.verified || false,
                            county: p.author?.county || p.county || '',
                            space: p.space?.name || 'General',
                            time: this.timeAgo(new Date(p.created_at)),
                            title: p.title, body: p.content,
                            votes: p.upvotes_count || 0, answers: p.reply_count || 0,
                            voted: false, translated: false
                        });
                    });
                    // Update existing post counts
                    data.forEach(d => {
                        const existing = this.feedPosts.find(p => p.id === d.id);
                        if (existing) {
                            existing.votes = d.upvotes_count ?? existing.votes;
                            existing.answers = d.reply_count ?? existing.answers;
                        }
                    });
                }
            }, 8000));

            // Poll notifications every 10 seconds
            this._pollingIntervals.push(setInterval(async () => {
                if (!this.isOnline || !currentUser) return;
                const count = await DB.getUnreadCount(currentUser.id);
                if (count > this.unreadCount) {
                    this.unreadCount = count;
                    const { data } = await DB.getNotifications(currentUser.id, 5);
                    if (data) {
                        this.notifications = data.map(n => ({
                            id: n.id, icon: this.getNotificationIcon(n.type),
                            iconBg: this.getNotificationBg(n.type), text: n.content,
                            time: this.timeAgo(new Date(n.created_at)), read: n.is_read
                        }));
                    }
                }
            }, 10000));

            // Poll leaderboard every 30 seconds
            this._pollingIntervals.push(setInterval(async () => {
                if (!this.isOnline) return;
                const { data } = await DB.getLeaderboard(50);
                if (data) {
                    this.leaderboard = data.map((p, i) => ({
                        id: p.id, rank: i + 1, name: p.full_name || 'Anonymous',
                        county: p.county || 'Kenya', pts: p.heshima_score || 0,
                        avatar: p.avatar_url || '',
                        medal: i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-300 text-gray-800' : i === 2 ? 'bg-amber-600' : 'bg-gray-400',
                        isUser: currentUser && p.id === currentUser.id
                    }));
                }
            }, 30000));

            // Poll heshima every 15 seconds
            this._pollingIntervals.push(setInterval(async () => {
                if (!this.isOnline || !currentUser) return;
                const { data } = await DB.getProfile(currentUser.id);
                if (data && data.heshima_score !== this.heshimaScore) {
                    this.heshimaScore = data.heshima_score;
                    this.saveState();
                }
            }, 15000));
        },

        stopPolling() {
            this._pollingIntervals.forEach(id => clearInterval(id));
            this._pollingIntervals = [];
        },

        // ═══════════════════════════════════════════════════════════
        // REAL-TIME SUBSCRIPTIONS (Hybrid: Realtime + Polling Fallback)
        // ═══════════════════════════════════════════════════════════

        _threadReplySub: null,

        async startRealtimeSubscriptions() {
            if (!currentUser) return;

            // Check if Realtime is available
            this.realtimeAvailable = await DB.checkRealtimeHealth();
            console.log(`[KikwetuHub] Realtime available: ${this.realtimeAvailable}`);

            if (this.realtimeAvailable) {
                this.startRealtimeOnly();
            } else {
                console.log('[KikwetuHub] Realtime unavailable — using polling fallback');
            }

            // Always start polling as baseline (lightweight)
            // Realtime adds instant updates on top; polling catches anything missed
            this.startPolling();

            // Load initial data
            this.loadFeedPosts();
            this.loadLeaderboard();
            this.loadSpaces();
            this.loadNotifications();

            console.log(`[KikwetuHub] Subscriptions active (mode: ${this.realtimeAvailable ? 'realtime+polling' : 'polling-only'})`);
        },

        startRealtimeOnly() {

            // ── FEED: New threads appear live with full author data ──
            const feedSub = DB.subscribeToFeed(async (event, payload) => {
                if (event === 'NEW_THREAD' && payload.new) {
                    const p = payload.new;
                    if (p.author_id === currentUser.id) return;
                    // Hydrate with author profile
                    const { data: authorData } = await DB.getProfile(p.author_id);
                    const spaceName = p.space_id ? (await DB.getSpaceById(p.space_id)).data?.name : null;
                    this.feedPosts.unshift({
                        id: p.id,
                        type: p.type === 'educative' ? 'qa' : p.type,
                        author: authorData?.full_name || 'Community Member',
                        authorAvatar: authorData?.avatar_url || '',
                        verified: authorData?.verified || false,
                        county: authorData?.county || p.county || '',
                        space: spaceName || 'General',
                        time: 'Just now',
                        title: p.title,
                        body: p.content,
                        votes: p.upvotes_count || 0,
                        answers: p.reply_count || 0,
                        voted: false,
                        translated: false
                    });
                    this.showToast(`New post: "${p.title?.substring(0, 40)}..."`);
                }
                if (event === 'THREAD_UPDATED' && payload.new) {
                    const p = payload.new;
                    const post = this.feedPosts.find(x => x.id === p.id);
                    if (post) {
                        post.votes = p.upvotes_count ?? post.votes;
                        post.answers = p.reply_count ?? post.answers;
                    }
                }
            });
            subscriptions.push(feedSub);

            // ── FEED: Vote counts update live on all visible posts ──
            const voteSub = DB.subscribeToVotes('*', (event, payload) => {
                if (event === 'VOTE_CHANGE' && payload.new) {
                    const v = payload.new;
                    // Update feed posts
                    const feedPost = this.feedPosts.find(p => p.id === v.entity_id);
                    if (feedPost) {
                        if (v.vote_type === 'up') feedPost.votes += 1;
                        else if (v.vote_type === 'down') feedPost.votes = Math.max(0, feedPost.votes - 1);
                    }
                    // Update thread answers
                    const threadAns = this.threadAnswers.find(a => a.id === v.entity_id);
                    if (threadAns) {
                        if (v.vote_type === 'up') threadAns.votes += 1;
                        else if (v.vote_type === 'down') threadAns.votes = Math.max(0, threadAns.votes - 1);
                    }
                }
                // Handle DELETE (vote removed)
                if (event === 'VOTE_CHANGE' && payload.old && !payload.new) {
                    const v = payload.old;
                    const feedPost = this.feedPosts.find(p => p.id === v.entity_id);
                    if (feedPost) {
                        if (v.vote_type === 'up') feedPost.votes = Math.max(0, feedPost.votes - 1);
                        else feedPost.votes += 1;
                    }
                }
            });
            subscriptions.push(voteSub);

            // ── NOTIFICATIONS: Appear live with badge count ──
            const notifSub = DB.subscribeToNotifications(currentUser.id, (event, payload) => {
                if (event === 'NEW_NOTIFICATION' && payload.new) {
                    const n = payload.new;
                    this.notifications.unshift({
                        id: n.id,
                        icon: this.getNotificationIcon(n.type),
                        iconBg: this.getNotificationBg(n.type),
                        text: n.content,
                        time: 'Just now',
                        read: false
                    });
                    this.unreadCount += 1;
                    // Browser notification if permitted
                    if (Notification.permission === 'granted') {
                        new Notification('KikwetuConnect', { body: n.content.replace(/<[^>]*>/g, ''), icon: '/icon-192.png' });
                    }
                }
            });
            subscriptions.push(notifSub);

            // ── HESHIMA: Score updates live ──
            const heshimaSub = DB.subscribeToHeshima(currentUser.id, (event, payload) => {
                if (event === 'HESHIMA_UPDATE' && payload.new) {
                    this.heshimaScore = payload.new.heshima_score;
                    this.saveState();
                }
            });
            subscriptions.push(heshimaSub);

            // ── LIVE ROOMS: Room list updates live ──
            const roomSub = DB.subscribeToLiveRooms((event, payload) => {
                if (event === 'ROOM_CHANGE' && payload.new) {
                    const room = payload.new;
                    const existing = this.liveRooms.find(r => r.id === room.id);
                    if (existing) {
                        existing.listeners = room.listener_count;
                        existing.active = room.is_active;
                    } else if (room.is_active) {
                        this.liveRooms.unshift({
                            id: room.id, title: room.title,
                            hosts: room.host?.full_name || 'Host',
                            listeners: room.listener_count, type: room.room_type,
                            active: true, participants: []
                        });
                    }
                }
            });
            subscriptions.push(roomSub);

            // ── LEADERBOARD: Rankings update live when profiles change ──
            const lbSub = DB.subscribeToHeshima('*', (event, payload) => {
                if (event === 'HESHIMA_UPDATE' && payload.new) {
                    const updated = payload.new;
                    const entry = this.leaderboard.find(e => e.id === updated.id);
                    if (entry) {
                        entry.pts = updated.heshima_score;
                    } else {
                        // New high scorer — reload leaderboard
                        this.loadLeaderboard();
                    }
                }
            });
            subscriptions.push(lbSub);

            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        },

        // Subscribe to replies when viewing a specific thread
        startThreadSubscription(threadId) {
            this.stopThreadSubscription();
            if (!threadId) return;

            if (this.realtimeAvailable) {
                // Realtime subscription
                const sub = DB.subscribeToReplies(threadId, async (event, payload) => {
                    if (event === 'NEW_REPLY' && payload.new) {
                        const r = payload.new;
                        if (r.author_id === currentUser?.id) return;
                        const { data: authorData } = await DB.getProfile(r.author_id);
                        const newReply = {
                            id: r.id, author: authorData?.full_name || 'Community Member',
                            authorId: r.author_id, avatar: authorData?.avatar_url || '',
                            verified: authorData?.verified || false, content: r.content,
                            votes: r.upvotes_count || 0, time: 'Just now', voted: false, replies: []
                        };
                        this.threadAnswers.unshift(newReply);
                        this.showToast(`New reply from ${newReply.author}`);
                    }
                    if (event === 'REPLY_UPDATED' && payload.new) {
                        const r = payload.new;
                        const ans = this.threadAnswers.find(a => a.id === r.id);
                        if (ans) { ans.votes = r.upvotes_count ?? ans.votes; if (r.is_accepted) ans.accepted = true; }
                    }
                });
                this._threadReplySub = sub;
                subscriptions.push(sub);
            }

            // Polling fallback for thread replies (always runs, catches everything)
            this._threadReplyPoll = setInterval(async () => {
                if (!this.isOnline || this.currentRoute !== 'thread') return;
                const { data } = await DB.getReplies(threadId, 'newest');
                if (data) {
                    data.forEach(r => {
                        const exists = this.threadAnswers.find(a => a.id === r.id);
                        if (!exists) {
                            this.threadAnswers.unshift({
                                id: r.id, author: r.author?.full_name || 'Anonymous',
                                authorId: r.author_id, avatar: r.author?.avatar_url || '',
                                verified: r.author?.verified || false, content: r.content,
                                votes: r.upvotes_count || 0, time: this.timeAgo(new Date(r.created_at)),
                                voted: false, replies: []
                            });
                        } else {
                            exists.votes = r.upvotes_count ?? exists.votes;
                        }
                    });
                }
            }, 5000);
        },

        stopThreadSubscription() {
            if (this._threadReplySub?.unsubscribe) {
                this._threadReplySub.unsubscribe();
                subscriptions = subscriptions.filter(s => s !== this._threadReplySub);
                this._threadReplySub = null;
            }
            if (this._threadReplyPoll) {
                clearInterval(this._threadReplyPoll);
                this._threadReplyPoll = null;
            }
        },

        stopRealtimeSubscriptions() {
            this.stopThreadSubscription();
            this.stopPolling();
            subscriptions.forEach(sub => { if (sub?.unsubscribe) sub.unsubscribe(); });
            subscriptions = [];
        },

        broadcastAction(event, payload) {
            console.log(`[KikwetuHub] Action: ${event}`, payload);
        },


        // ═══════════════════════════════════════════════════════════
        // UTILITY METHODS
        // ═══════════════════════════════════════════════════════════

        showToast(msg, duration) {
            if (this.toastTimer) clearTimeout(this.toastTimer);
            this.toastMessage = msg;
            this.toastVisible = true;
            this.toastTimer = setTimeout(() => { this.toastVisible = false; }, duration || 3000);
        },

        formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num.toString();
        },

        timeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            const intervals = [
                { label: 'year', seconds: 31536000 }, { label: 'month', seconds: 2592000 },
                { label: 'week', seconds: 604800 }, { label: 'day', seconds: 86400 },
                { label: 'hr', seconds: 3600 }, { label: 'min', seconds: 60 }
            ];
            for (const interval of intervals) {
                const count = Math.floor(seconds / interval.seconds);
                if (count > 0) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
            return 'Just now';
        },

        getHeshimaLevel() {
            if (this.heshimaScore >= 5000) return { name: 'Mwalimu Mkuu', color: 'text-yellow-500', icon: '\uD83C\uDFC6' };
            if (this.heshimaScore >= 2000) return { name: 'Mtaalamu', color: 'text-brand-orange', icon: '\uD83C\uDF1F' };
            if (this.heshimaScore >= 500) return { name: 'Mwalimu', color: 'text-brand-green', icon: '\uD83C\uDF31' };
            if (this.heshimaScore >= 100) return { name: 'Mwananchi', color: 'text-blue-500', icon: '\uD83D\uDC4D' };
            return { name: 'Mgeni', color: 'text-gray-400', icon: '\uD83D\uDC4B' };
        },

        getHeshimaProgress() { return Math.min(this.heshimaScore / 10, 100); },
        isUserPost(post) { return post.author === this.userName; },
        isUserEntry(entry) { return entry.name === this.userName; }
    };
}
