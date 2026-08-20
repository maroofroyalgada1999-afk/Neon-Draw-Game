export interface LegalDocSection {
  id: string;
  title: string;
  content: string | string[];
  subsections?: { title: string; text: string }[];
  highlight?: string;
}

export interface LegalDoc {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  lastUpdated: string;
  category: 'Legal' | 'Rules' | 'Platform' | 'Support' | 'Safety';
  sections: LegalDocSection[];
}

// =============================================================================
// CENTRALIZED OFFICIAL BUSINESS & CONTACT CONFIGURATION (SINGLE SOURCE OF TRUTH)
// =============================================================================
export const BUSINESS_NAME = 'NEON DRAW-99';
export const SUPPORT_EMAIL = 'support.neondraw99@gmail.com';
export const BUSINESS_ADDRESS = 'Sector 18, Noida, Gautam Buddha Nagar, Uttar Pradesh – 201301, India';

export const LEGAL_CONFIG = {
  appName: BUSINESS_NAME,
  businessName: BUSINESS_NAME,
  operatorName: BUSINESS_NAME,
  supportEmail: SUPPORT_EMAIL,
  businessAddress: BUSINESS_ADDRESS,
  contactAddress: BUSINESS_ADDRESS,
  currencyName: 'Virtual Coins (Demo Currency)',
  lastUpdated: 'February 2026',
};

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  terms: {
    id: 'terms',
    title: 'Terms & Conditions',
    subtitle: 'Official User Agreement and Conditions of Participation',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Legal',
    sections: [
      {
        id: 'acceptance',
        title: '1. Acceptance of Terms',
        content: [
          `Welcome to ${BUSINESS_NAME}. By accessing, browsing, registering for an account, or participating in any rounds on ${BUSINESS_NAME} (the "Service" or "Platform"), operated by ${BUSINESS_NAME} ("we", "us", or "our"), you agree to be bound by these Terms & Conditions ("Terms").`,
          'If you do not agree to all terms and conditions contained herein, you must immediately discontinue use of the platform and terminate your session.',
        ],
      },
      {
        id: 'virtual-model',
        title: '2. Virtual Currency & Demo Entertainment Model',
        content: [
          `${BUSINESS_NAME} is an interactive mathematical game simulation designed strictly for amusement, strategic observation, and virtual entertainment purposes.`,
          'IMPORTANT NOTICE REGARDING VIRTUAL COINS: All "Coins", "Balances", "Stakes", "Turnovers", and "Payouts" displayed or utilized within NEON DRAW-99 represent purely virtual demo credits possessing ZERO ($0.00) real-world monetary value.',
          'Under no circumstances can virtual coins be converted, transferred, cashed out, redeemed for fiat currency, cryptocurrencies, prizes, goods, or services of any tangible value.',
          `${BUSINESS_NAME} is NOT a real-money gambling platform, lottery, or betting operator. No real money can be wagered or won.`,
        ],
        highlight: 'Virtual coins have zero real-world value and cannot be redeemed, sold, or cashed out under any circumstances.',
      },
      {
        id: 'eligibility',
        title: '3. Eligibility & Age Requirements',
        content: [
          'You must be at least eighteen (18) years of age, or the legal age of majority in your jurisdiction, to create an account or participate in the platform.',
          'Access to the platform is void where prohibited by applicable local laws. You are solely responsible for compliance with all laws applicable in your country or region of residence.',
        ],
      },
      {
        id: 'game-mechanics',
        title: '4. Game Rules & Participation Limitations',
        content: [
          '4.1 Number Matrix: Each round utilizes exactly twenty (20) distinct numbers, indexed from "01" through "20".',
          '4.2 Multiplier Allocation: In every round, numbers are allocated dynamic multipliers ranging from 2x to 20x, with high multipliers (11x to 20x) shifting dynamically across tiles each round.',
          '4.3 Selection Cap: Players are strictly limited to selecting and placing bets on a MAXIMUM OF TWENTY (20) DIFFERENT NUMBERS per single round.',
          '4.4 60-Second Authoritative Cycle: Each game round operates on an uninterrupted server-synchronized 60-second cycle divided into three sequential phases: (a) Phase 1: Result Display (15s); (b) Phase 2: Chart Observation (30s); (c) Phase 3: Live Betting (15s).',
          '4.5 Single Winning Draw: At the conclusion of Phase 3, the server executes an authoritative cryptographic random draw selecting exactly one (1) winning number from 01 to 20.',
          '4.6 Payout Formula: Settled winning bets receive an instant virtual payout equal to: Bet Amount × Number Multiplier.',
        ],
      },
      {
        id: 'accounts-security',
        title: '5. Account Obligations & Security',
        content: [
          'Users must provide accurate, current, and verifiable information during registration. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account.',
          'You agree to immediately notify our support desk of any unauthorized use of your account or security breach.',
          'We reserve the right to suspend, lock, or terminate any account associated with fraudulent, unauthorized, or suspicious activity.',
        ],
      },
      {
        id: 'prohibited-conduct',
        title: '6. Prohibited Activities',
        content: [
          'Users are strictly prohibited from: (a) using automated scripts, bots, spiders, or scrapers to access the service; (b) reverse-engineering, decompiling, or intercepting server communications; (c) exploiting latency, software glitches, or edge cases to manipulate round outcomes; (d) creating multiple accounts to circumvent platform limitations; and (e) harassing other users or support personnel.',
        ],
      },
      {
        id: 'intellectual-property',
        title: '7. Intellectual Property Rights',
        content: [
          `All software, UI designs, graphics, audio, animations, trademarks, logos, and algorithms comprising ${BUSINESS_NAME} are the proprietary property of ${BUSINESS_NAME} and are protected under copyright, trademark, and intellectual property laws.`,
        ],
      },
      {
        id: 'liability',
        title: '8. Disclaimer of Warranties & Limitation of Liability',
        content: [
          'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF LATENCY DELAYS.',
          'IN NO EVENT SHALL THE PLATFORM BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OR INABILITY TO USE THE PLATFORM.',
        ],
      },
      {
        id: 'contact-business',
        title: '9. Official Business & Contact Information',
        content: [
          `• Platform / Business Name: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Business / Contact Address: ${BUSINESS_ADDRESS}`,
        ],
      },
      {
        id: 'modifications',
        title: '10. Modifications & Amendments',
        content: [
          'We reserve the right to revise or replace these Terms at any time. Significant amendments will be announced on the platform. Your continued participation after modifications constitutes acceptance of the updated Terms.',
        ],
      },
    ],
  },

  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'Transparent Information Governance & Data Protection Protocols',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Legal',
    sections: [
      {
        id: 'data-collected',
        title: '1. Information We Collect',
        content: [
          'We collect minimal personal information strictly necessary to operate the game platform, preserve account security, and provide technical assistance:',
          '• Account Information: Name, chosen username, email address, password salt & cryptographic hash, and registration timestamp.',
          '• Authentication Data: Session tokens, device type (desktop, mobile, tablet), browser user-agent, and IP address for fraud mitigation and session continuity.',
          '• Gameplay & Transaction Data: Game rounds participated in, selected numbers, virtual stakes, draw outcomes, wallet ledger history, and multiplier statistics.',
          '• Support Inquiries: Subject, category, message content, and correspondence history submitted to our support help desk.',
          '• Third-Party OAuth Data: If signing in via Google or Facebook, we receive your public profile identifier, name, verified email, and avatar URL as permitted by your third-party account permissions.',
        ],
      },
      {
        id: 'data-use',
        title: '2. How We Use Your Data',
        content: [
          'We use the collected information exclusively to: (a) authenticate your account and manage active sessions; (b) calculate round settlement, virtual coin payouts, and wallet balance updates; (c) detect, prevent, and mitigate security threats, multi-accounting, and botting; (d) provide customer support and ticket resolution; and (e) maintain cryptographic audit records of game fairness.',
          'WE NEVER SELL, RENT, OR MONETIZE YOUR PERSONAL DATA TO THIRD PARTIES.',
        ],
        highlight: 'Your data is strictly used for game operations, account security, and customer service. We do not sell user data.',
      },
      {
        id: 'data-retention',
        title: '3. Data Retention & Security Measures',
        content: [
          'We implement industry-standard cryptographic protection, including PBKDF2 with SHA-512 password hashing, secure bearer tokens, and scoped authorization middlewares.',
          'Personal data is retained only as long as your account remains active or as required for security auditing and operational integrity.',
        ],
      },
      {
        id: 'user-rights',
        title: '4. Your Privacy & Account Controls',
        content: [
          'You have the right to:',
          '• Access: Review personal data and gameplay logs associated with your account in your History and Profile views.',
          '• Rectification: Update or correct account details through your profile dashboard.',
          '• Account Deletion (Right to Be Forgotten): Permanently delete your account, session logs, and personal data via the Security tab in your Account settings.',
          '• Revoke Sessions: Terminate active sessions on secondary or unfamiliar devices at any time.',
        ],
      },
      {
        id: 'cookies',
        title: '5. Cookies & Local Storage',
        content: [
          'We use local storage strictly for essential functional mechanisms (persisting your authentication token, audio settings, and active tab preferences). We do not deploy third-party advertising trackers.',
        ],
      },
      {
        id: 'contact-privacy',
        title: '6. Privacy Inquiries & Controller Details',
        content: [
          `If you have questions, data access requests, or privacy inquiries, please contact our team:`,
          `• Platform: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  about: {
    id: 'about',
    title: 'About NEON DRAW-99',
    subtitle: 'The Next-Generation 20-Number Cyber Arena',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Platform',
    sections: [
      {
        id: 'concept',
        title: '1. The Vision Behind NEON DRAW-99',
        content: [
          `${BUSINESS_NAME} was created to provide a high-frequency, mathematically balanced, and visually stunning number game built for the modern web.`,
          'Featuring a luminous cyberpunk aesthetic, the platform combines intuitive 20-number grid mechanics with dynamic multiplier distribution, provably fair server algorithms, and strict 60-second synchronized cycles.',
        ],
      },
      {
        id: 'architecture',
        title: '2. Core Mathematical Architecture',
        content: [
          '• 20 Distinct Numbers: Every round features tiles from 01 to 20 in a clean 5x4 matrix.',
          '• Dynamic 2x–20x Multipliers: Numbers receive dynamic multipliers with high multipliers (11x–20x) rotated across tiles every round.',
          '• 20-Number Selection Cap: Preserves strategic depth and healthy play by allowing players to select up to all 20 numbers per round.',
          '• Authoritative 60s Cycle: 15 seconds Result settlement, 30 seconds Chart observation, and 15 seconds live Betting window.',
        ],
      },
      {
        id: 'technology',
        title: '3. Technical Stack & Integrity',
        content: [
          `${BUSINESS_NAME} is powered by a high-performance Node.js / Express backend coupled with a responsive React frontend. All round generation, multiplier placement, and draw calculations are executed on the server using cryptographically secure pseudorandom number generators (CSPRNG).`,
        ],
      },
      {
        id: 'contact-details',
        title: '4. Official Contact & Location',
        content: [
          `• Platform Name: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Contact Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  'how-to-play': {
    id: 'how-to-play',
    title: 'How to Play',
    subtitle: 'Complete Walkthrough for Beginners and Strategy Observers',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Rules',
    sections: [
      {
        id: 'overview-steps',
        title: '1. Step-by-Step Gameplay Flow',
        content: [
          `Step 1: Join the Arena — Open the ${BUSINESS_NAME} arena on any desktop or mobile device.`,
          'Step 2: Observe the 60s Phase Cycle — Check the top phase indicator: Phase 1 (Result), Phase 2 (Observation), or Phase 3 (Betting).',
          'Step 3: Analyze the 01–20 Grid — Review tile multipliers. Numbers offer mixed 2x–20x multipliers (including glowing 11x–20x high multipliers).',
          'Step 4: Select Up to 20 Numbers — Click or tap numbers on the matrix. You can pick between 1 and 20 numbers.',
          'Step 5: Configure Stake Amount — Set your virtual coin wager per number or use quick stake buttons (e.g. 10, 50, 100, 500 Coins).',
          'Step 6: Confirm & Place Bet — Submit your wager during Phase 3 before the 15-second countdown hits 00s.',
          'Step 7: Watch the Draw Animation — The server draws a single winning number between 01 and 20.',
          'Step 8: Instant Settlement — If the winning number matches any of your selections, your balance is credited immediately (Stake × Multiplier).',
        ],
      },
      {
        id: 'phase-guide',
        title: '2. Understanding the 3 Phases',
        content: [
          '• Phase 1: Result Display (15 Seconds) — Review the previous winning number, multiplier, player winners list, and total round turnover.',
          '• Phase 2: Observation & Charting (30 Seconds) — Multipliers for the new round are displayed. Pre-select numbers and strategize before betting opens.',
          '• Phase 3: Live Betting Window (15 Seconds) — Place and confirm your wagers. Once the timer reaches 00s, betting locks automatically.',
        ],
      },
      {
        id: 'selection-tools',
        title: '3. Fast Selection Shortcuts',
        content: [
          '• High Multipliers Quick Select: Selects the top 11x–20x numbers in 1 click.',
          '• Random 5 / 10 / 20: Randomly picks non-duplicate numbers instantly.',
          '• Clear Board: Resets all active selections for a clean start.',
        ],
      },
    ],
  },

  'game-rules': {
    id: 'game-rules',
    title: 'Game Rules',
    subtitle: 'Comprehensive Mechanics, Probability & Settlement Specifications',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Rules',
    sections: [
      {
        id: 'number-universe',
        title: '1. The Number Matrix (01–20)',
        content: [
          'The game utilizes exactly 20 whole integers represented as two-digit strings from "01" through "20". Each number represents an equal 1/20 (5.00%) theoretical probability of being selected by the random draw engine in any given round.',
        ],
      },
      {
        id: 'multipliers-distribution',
        title: '2. Multiplier Distribution Formula',
        content: [
          'Every round allocates randomized multipliers between 2x and 20x distributed across the 20 numbers:',
          '• Standard Multipliers: Multipliers between 2.0x and 10.0x (integers).',
          '• High Multipliers: Multipliers between 11.0x and 20.0x (integers).',
          'The multipliers and high multiplier positions are generated cryptographically at round initiation and publicly displayed during Phase 2 (Observation) and Phase 3 (Betting).',
        ],
      },
      {
        id: 'selection-limit',
        title: '3. Selection Cap Rule',
        content: [
          'Each registered player is permitted to bet on a minimum of 1 and a maximum of 20 distinct numbers in a single round.',
          'Attempting to place wagers on more than 20 numbers in the same round is strictly rejected by the server validation engine.',
        ],
      },
      {
        id: 'payout-rules',
        title: '4. Winning Settlement & Calculation',
        content: [
          '• Winning Condition: A bet is WON if and only if the selected number exactly equals the winning number chosen by the server draw.',
          '• Payout Amount = (Bet Amount on Winning Number) × (Assigned Multiplier of Winning Number).',
          '• Non-matching selections are settled as LOST.',
          '• Payouts are credited atomically to the player\'s virtual balance immediately upon settlement.',
        ],
      },
    ],
  },

  'betting-rules': {
    id: 'betting-rules',
    title: 'Betting Rules',
    subtitle: 'Staking Limitations, Idempotency & Acceptance Protocol',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Rules',
    sections: [
      {
        id: 'timing-limits',
        title: '1. Betting Phase Exclusivity',
        content: [
          'Bets are strictly accepted ONLY during Phase 3 (the 15-second Betting Phase).',
          'Any bet request received by the server after the betting close timestamp (bettingEnd) is rejected with an authoritative "Betting is closed for this round" error.',
        ],
      },
      {
        id: 'stake-limits',
        title: '2. Staking Limits',
        content: [
          '• Minimum Bet: Configured at 10 Virtual Coins per number.',
          '• Maximum Bet: Configured at 10,000 Virtual Coins per number.',
          '• Total Round Stake: Cannot exceed the player\'s available virtual balance at the time of submission.',
        ],
      },
      {
        id: 'atomic-deductions',
        title: '3. Atomic Ledger Deductions',
        content: [
          'When a bet is submitted, the total stake amount is immediately deducted from the player\'s balance with an atomic lock to prevent overdrafts.',
          'Each bet is assigned a unique tracking ID and recorded in the permanent audit ledger.',
        ],
      },
      {
        id: 'cancellations',
        title: '4. Cancellation & Disrupted Rounds',
        content: [
          'Once placed and confirmed by the server, a bet cannot be manually cancelled by the player.',
          'In the event that an administrator cancels a round due to technical disruption, 100% of stakes placed by all players for that round are automatically refunded to their virtual balances.',
        ],
      },
    ],
  },

  'responsible-play': {
    id: 'responsible-play',
    title: 'Responsible Play / Safety',
    subtitle: 'Commitment to Safe, Mindful, and Balanced Entertainment',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Safety',
    sections: [
      {
        id: 'philosophy',
        title: '1. Our Responsible Gaming Philosophy',
        content: [
          `Although ${BUSINESS_NAME} uses exclusively virtual demo coins with zero monetary value, we are deeply committed to fostering healthy digital habits, transparent gaming mechanics, and player self-awareness.`,
        ],
      },
      {
        id: 'self-control-tools',
        title: '2. Player Protection & Limit Tools',
        content: [
          'We provide built-in tools within your Account & Security preferences:',
          '• Daily Stake Limits: Set a maximum total of virtual coins you can stake within a 24-hour window.',
          '• Single Bet Caps: Restrict the maximum amount placed on any individual number.',
          '• Self-Exclusion / Cool-Off: Temporarily pause your account for 24 hours, 7 days, or 30 days.',
          '• Permanent Account Deletion: Instantly purge your account, credentials, and data.',
        ],
      },
      {
        id: 'healthy-habits',
        title: '3. Healthy Play Guidelines',
        content: [
          '• Treat the game purely as a recreational mathematical simulation.',
          '• Take regular breaks and do not play for extended continuous durations.',
          '• Never let gaming interfere with work, family, or personal responsibilities.',
          '• Remember that all outcomes are determined by random algorithms without patterns or predictive secrets.',
        ],
      },
      {
        id: 'support-contact',
        title: '4. Contact for Assistance',
        content: [
          `For assistance regarding responsible play or self-exclusion options, contact our support desk:`,
          `• Platform: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  help: {
    id: 'help',
    title: 'Help & Support Hub',
    subtitle: 'Central Directory for Guides, FAQs, Technical Assistance & Support',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Support',
    sections: [
      {
        id: 'hub-overview',
        title: '1. How Can We Help You Today?',
        content: [
          `Welcome to the ${BUSINESS_NAME} Help & Support Hub. Whether you are learning how rounds work, investigating a previous bet in your history, or needing technical help, we are here to assist you 24/7.`,
        ],
      },
      {
        id: 'quick-links',
        title: '2. Quick Navigation Directory',
        content: [
          '• Game Rules & Multipliers: Discover how 80/20 multipliers and 20-number caps work.',
          '• How to Play: Step-by-step walkthrough for placing wagers and watching draws.',
          '• Interactive FAQ: Instant answers to frequently asked questions.',
          '• Wallet & Reload Faucet: Learn how to manage coins and use the free reload faucet.',
          '• Submit Support Ticket: Open an official inquiry with our support team.',
        ],
      },
      {
        id: 'contact-support',
        title: '3. Contact Support',
        content: [
          `• Platform Support: ${BUSINESS_NAME} Support`,
          `• Email: ${SUPPORT_EMAIL}`,
          `• Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  faq: {
    id: 'faq',
    title: 'Frequently Asked Questions (FAQ)',
    subtitle: 'Instant Answers to Common Player Inquiries',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Support',
    sections: [
      {
        id: 'faq-core',
        title: 'Frequently Asked Questions',
        content: 'Browse our comprehensive list of answered questions below.',
      },
    ],
  },

  contact: {
    id: 'contact',
    title: 'Contact Support',
    subtitle: 'Direct Ticket Submission & Customer Assistance Desk',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Support',
    sections: [
      {
        id: 'official-details',
        title: '1. Official Contact Information',
        content: [
          `• Platform / Business Name: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Business / Contact Address: ${BUSINESS_ADDRESS}`,
        ],
      },
      {
        id: 'ticket-desk',
        title: '2. Open a Support Ticket',
        content: [
          'Submit a support request directly to our moderation and technical operations team using the form below. Authenticated players will have their Account ID automatically linked for faster resolution.',
        ],
      },
    ],
  },

  cookies: {
    id: 'cookies',
    title: 'Cookie Policy',
    subtitle: 'Transparent Information on Local Storage & Session Data',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Legal',
    sections: [
      {
        id: 'what-are-cookies',
        title: '1. What Are Cookies & Local Storage?',
        content: [
          'Cookies and browser LocalStorage are small data files stored directly on your device by your web browser when visiting web applications.',
        ],
      },
      {
        id: 'how-we-use',
        title: '2. How NEON DRAW-99 Uses Storage',
        content: [
          'We use local storage exclusively for essential operational purposes:',
          '• Session Authentication (num99_auth_token): Keeps you securely logged in between page views.',
          '• UI Preferences: Preserves selected audio settings and active view tabs.',
          '• Performance Optimization: Caches static round configurations to minimize data loading.',
          'WE DO NOT USE THIRD-PARTY TRACKING COOKIES OR ADVERTISING NETWORKS.',
        ],
        highlight: 'Zero third-party advertising cookies. Only essential operational tokens are stored.',
      },
      {
        id: 'managing-cookies',
        title: '3. Managing Your Storage',
        content: [
          'You can clear your browser cookies and local storage at any time via your browser settings. Note that clearing storage will log you out of your current session.',
        ],
      },
      {
        id: 'cookie-contact',
        title: '4. Contact Details',
        content: [
          `• Business / Platform Name: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Business Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  refunds: {
    id: 'refunds',
    title: 'Refund & Cancellation Policy',
    subtitle: 'Rules Regarding Virtual Coin Ledgers & Disrupted Rounds',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Legal',
    sections: [
      {
        id: 'virtual-nature',
        title: '1. Virtual Currency Environment',
        content: [
          `Because ${BUSINESS_NAME} operates exclusively with virtual demo coins that have no real monetary value, cash refunds are neither applicable nor possible.`,
        ],
      },
      {
        id: 'round-cancellations',
        title: '2. Automatic Virtual Coin Refunds for Disrupted Rounds',
        content: [
          'In the event of an unexpected server restart, critical infrastructure failure, or administrator round cancellation:',
          '• All active wagers placed during Phase 3 of the affected round are immediately marked as REFUNDED.',
          '• 100% of the staked virtual coins are credited back to the player\'s wallet ledger.',
          '• An audit entry is recorded with the description "Round cancelled - refund full stake".',
        ],
        highlight: 'Any cancelled or disrupted round automatically refunds 100% of placed virtual stakes back to your wallet.',
      },
      {
        id: 'dispute-resolution',
        title: '3. Disputed Payouts & Support Contact',
        content: [
          `If you believe a bet was settled incorrectly due to a display lag, contact our support team with the Round ID and Bet ID:`,
          `• Platform: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  disclaimer: {
    id: 'disclaimer',
    title: 'Disclaimer & Legal Notice',
    subtitle: 'Entertainment Notice, Risk Warning & System Disclaimers',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Legal',
    sections: [
      {
        id: 'entertainment-notice',
        title: '1. Pure Entertainment & Simulation Notice',
        content: [
          `${BUSINESS_NAME} is an interactive game simulation created solely for amusement and strategic entertainment. It does not provide real-money gambling, sports betting, or monetary prize opportunities.`,
        ],
      },
      {
        id: 'no-guarantee',
        title: '2. No Guarantee of Winnings or Mathematical Certainty',
        content: [
          'Past round draw results, charts, or multiplier histories do not guarantee future outcomes. Every single round is generated independently using cryptographic random number generators.',
        ],
      },
      {
        id: 'uptime-disclaimer',
        title: '3. Network Latency & Service Availability',
        content: [
          'The platform relies on internet transmission. We are not liable for bet submission delays caused by client-side connectivity loss, device latency, or third-party internet service provider outages.',
        ],
      },
      {
        id: 'disclaimer-contact',
        title: '4. Contact Information',
        content: [
          `• Business / Platform Name: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Business Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  'account-security': {
    id: 'account-security',
    title: 'Account & Security',
    subtitle: 'Best Practices, Cryptographic Authentication & Account Management',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Safety',
    sections: [
      {
        id: 'password-hygiene',
        title: '1. Password Security & Best Practices',
        content: [
          '• Use a unique, strong password with a combination of uppercase letters, numbers, and symbols.',
          '• Never share your credentials or session tokens with anyone.',
          '• Update your password regularly using the Security tab in your Account modal.',
        ],
      },
      {
        id: 'session-management',
        title: '2. Multi-Device Session Management',
        content: [
          `${BUSINESS_NAME} allows you to review all active devices and sessions currently connected to your account. If you notice an unfamiliar device, you can click "Revoke Other Sessions" to immediately invalidate all other tokens.`,
        ],
      },
      {
        id: 'account-deletion-guide',
        title: '3. Permanent Account Deletion Protocol',
        content: [
          'You maintain the absolute right to delete your account at any time. Inside the Account Modal > Security Tab > Danger Zone, click "Delete Account". Once confirmed, your account is immediately deactivated, all active sessions are revoked, and personal data is anonymized.',
        ],
      },
      {
        id: 'security-contact',
        title: '4. Security & Account Assistance',
        content: [
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Platform: ${BUSINESS_NAME}`,
          `• Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  accessibility: {
    id: 'accessibility',
    title: 'Accessibility Statement',
    subtitle: 'Commitment to Inclusive Design & WCAG 2.1 AA Standards',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Platform',
    sections: [
      {
        id: 'accessibility-commitment',
        title: '1. Our Accessibility Commitment',
        content: [
          `${BUSINESS_NAME} is dedicated to providing an accessible, inclusive, and user-friendly experience for all individuals, including people with disabilities. We continuously optimize our interface to align with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.`,
        ],
      },
      {
        id: 'accessibility-features',
        title: '2. Implemented Accessibility Features',
        content: [
          '• High Contrast Typography: High-contrast text colors on dark backgrounds exceeding 4.5:1 contrast ratios.',
          '• Clear Semantic Hierarchy: Structured heading tags, ARIA labels, and explicit button roles.',
          '• Touch Target Sizing: Mobile interactive controls meet or exceed the 44px minimum touch target size.',
          '• Scalable Layouts: Seamless responsiveness across screen widths from 320px to 4K displays.',
        ],
      },
      {
        id: 'feedback',
        title: '3. Accessibility Feedback & Contact',
        content: [
          `If you encounter any accessibility barrier or require assistance, please contact our team:`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Platform Name: ${BUSINESS_NAME}`,
          `• Contact Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },

  legal: {
    id: 'legal',
    title: 'Legal / Compliance',
    subtitle: 'Platform Information, Operational Disclosures & Support Directory',
    version: '1.0',
    lastUpdated: 'February 2026',
    category: 'Legal',
    sections: [
      {
        id: 'business-details',
        title: '1. Business & Platform Details',
        content: [
          `• Business / Platform Name: ${BUSINESS_NAME}`,
          `• Contact Email: ${SUPPORT_EMAIL}`,
          `• Business / Contact Address: ${BUSINESS_ADDRESS}`,
        ],
      },
      {
        id: 'regulatory-classification',
        title: '2. Regulatory Classification & Fair Play',
        content: [
          `${BUSINESS_NAME} operates as a simulated digital game for personal entertainment and mathematical engagement. Because no real money or tangible prizes can be deposited, staked, or won, the service is classified under interactive digital entertainment and software simulation.`,
          'No state or national gambling license is required for non-monetary virtual demo simulations.',
        ],
      },
      {
        id: 'compliance-contact',
        title: '3. Inquiries & Correspondence',
        content: [
          `All legal, compliance, and support inquiries may be directed to:`,
          `• Platform: ${BUSINESS_NAME}`,
          `• Support Email: ${SUPPORT_EMAIL}`,
          `• Address: ${BUSINESS_ADDRESS}`,
        ],
      },
    ],
  },
};

export const FAQ_DATA = [
  {
    category: 'Gameplay',
    q: 'What is NEON DRAW-99?',
    a: 'NEON DRAW-99 is a fast-paced cyberpunk number game featuring a grid of 20 numbers (01 through 20). In each round, players select up to 20 numbers with assigned multipliers, followed by a cryptographically secured server draw that reveals a single winning number.',
  },
  {
    category: 'Gameplay',
    q: 'How long is one complete round?',
    a: 'Each round operates on a strict server-authoritative 60-second cycle divided into three distinct phases: Phase 1: 15s Result Display, Phase 2: 30s Observation, and Phase 3: 15s Betting.',
  },
  {
    category: 'Gameplay',
    q: 'How many numbers can I select in a single round?',
    a: 'A player can select and place wagers on a MAXIMUM of 20 different numbers (01 to 20) in any single round. The system strictly rejects attempts to pick more than 20 numbers.',
  },
  {
    category: 'Gameplay',
    q: 'When can I place my bets?',
    a: 'Bets can ONLY be placed during Phase 3 (the 15-second Betting phase). During Phase 2 (Observation), you can pre-select numbers on your matrix board, which will be ready for instant submission as soon as betting opens.',
  },
  {
    category: 'Multipliers',
    q: 'How are multipliers distributed across the 20 numbers?',
    a: 'Every round allocates dynamic multipliers across all 20 numbers: standard multipliers (2x–10x) and high multipliers (11x–20x). The positions of the high multipliers change dynamically every round.',
  },
  {
    category: 'Multipliers',
    q: 'How is the winning payout calculated?',
    a: 'If the winning number matches your bet, your virtual payout is calculated as: (Bet Amount on Winning Number) × (Assigned Multiplier). For example, 100 Coins staked on #14 with a 15x multiplier yields 1,500 Virtual Coins.',
  },
  {
    category: 'Wallet & Coins',
    q: 'Do Virtual Coins have real-world monetary value?',
    a: 'No. All coins, balances, and payouts in NEON DRAW-99 are 100% virtual demo tokens with zero real-world monetary value. They cannot be withdrawn, redeemed, or exchanged for real money.',
  },
  {
    category: 'Wallet & Coins',
    q: 'How do I reload my balance if I run out of coins?',
    a: 'You can instantly reload your virtual balance with +1,000 Coins at any time by clicking the reload faucet button in the top header, the Wallet Ledger tab, or your Account profile.',
  },
  {
    category: 'Fairness & Security',
    q: 'How does the game guarantee fair draws?',
    a: 'All draw numbers and multiplier positions are generated on the server using cryptographically secure random number generators (CSPRNG). The server seed hash is calculated before betting locks, guaranteeing that the winning number cannot be modified after bets are placed.',
  },
  {
    category: 'Account & Safety',
    q: 'How do I delete my account?',
    a: 'Open your Account Modal by clicking your avatar or username, select the "Security" tab, scroll down to "Danger Zone", and click "Delete Account". Confirm the prompt to immediately deactivate your account and revoke all active sessions.',
  },
  {
    category: 'Technical',
    q: 'What should I do if a bet doesn\'t appear in my history?',
    a: 'All confirmed bets are written directly to the server database ledger. Try clicking the "Refresh" button in the History tab. If an issue persists, submit a support ticket in the Help & Support or Contact section or email support.neondraw99@gmail.com.',
  },
];
