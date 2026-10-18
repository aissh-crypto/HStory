import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testFirestoreConnection, signOutUser, getSavedAuthSession, saveActiveAuthSession } from './services/firebase';
import { firestoreSync } from './services/firestoreSync';
import { Navbar } from './components/Navbar';
import { BurgerDrawer } from './components/BurgerDrawer';
import { HowItWorksModal } from './components/HowItWorksModal';
import { HomeSearchScreen } from './components/HomeSearchScreen';
import { SearchResultsScreen } from './components/SearchResultsScreen';
import { PropertyDetailScreen } from './components/PropertyDetailScreen';
import { CaseFileDashboard } from './components/CaseFileDashboard';
import { CaseFilesListView } from './components/CaseFilesListView';
import { SavedScreen } from './components/SavedScreen';
import { AccountScreen } from './components/AccountScreen';
import { SightViewScreen } from './components/SightViewScreen';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { MOCK_PROPERTIES } from './data/mockProperties';
import { COUNTRY_PACKS } from './data/countryPacks';
import { Property, CaseFile, UserProfile, NavTab, PurchasePurpose } from './types';
import { detectLocationCurrency, convertCurrency } from './utils/currency';
import { computeCaseFileProgress } from './utils/caseStatus';

const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'guest',
  name: '',
  displayName: '',
  email: '',
  residencyStatus: 'Citizen',
  buyerRole: 'First-time Homebuyer',
  countryPreference: 'Malaysia',
  monthlyGrossIncome: 0,
  existingMonthlyDebts: 0,
  defaultCurrency: detectLocationCurrency(),
  currencyPreference: 'AUTO',
};

// Create a new Case File for a property
const createNewCaseFile = (property: Property, profile: UserProfile): CaseFile => {
  const countryPack = COUNTRY_PACKS[property.country];
  const price = property.price;
  const downPaymentPercent = 20;
  const interestRate = 4.2;
  const loanTenureYears = 30;
  const loanAmount = Math.round(price * (1 - downPaymentPercent / 100));
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTenureYears * 12;

  const monthlyInstallment = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
  );

  const stressedRate = (interestRate + 2.0) / 100 / 12;
  const stressedInstallment = Math.round(
    (loanAmount * stressedRate * Math.pow(1 + stressedRate, totalPayments)) /
      (Math.pow(1 + stressedRate, totalPayments) - 1)
  );

  const hasIncome = Boolean(profile.monthlyGrossIncome && profile.monthlyGrossIncome > 0);
  const dsrPercent = hasIncome
    ? Number((((monthlyInstallment + (profile.existingMonthlyDebts || 0)) / profile.monthlyGrossIncome!) * 100).toFixed(1))
    : 0;
  const stressedDsrPercent = hasIncome
    ? Number((((stressedInstallment + (profile.existingMonthlyDebts || 0)) / profile.monthlyGrossIncome!) * 100).toFixed(1))
    : 0;

  return {
    caseId: `case-${property.id}-${Date.now().toString().slice(-4)}`,
    propertyId: property.id,
    createdDate: new Date().toLocaleDateString(),
    status: 'Not Started',
    progressPercent: 0, // Starts at min value (0%) for newly initiated files
    modules: {
      priceAnalysis: {
        completed: false,
        notes: `Asking price compared against ${property.city} fair valuation corridor.`,
        customValuation: property.valuation,
      },
      stressTest: {
        completed: false,
        downPaymentPercent,
        interestRate,
        loanTenureYears,
        monthlyIncome: profile.monthlyGrossIncome,
        otherDebtCommitments: profile.existingMonthlyDebts,
        loanAmount,
        monthlyInstallment,
        stressedInstallment,
        dsrPercent,
        stressedDsrPercent,
        totalInterestPaid: monthlyInstallment * totalPayments - loanAmount,
        approvalVerdict: stressedDsrPercent > countryPack.maxStandardDsr ? 'Moderate Risk' : 'Safe',
        notes: 'Underwriting within standard debt service limits.',
      },
      developerAudit: {
        completed: false,
        notes: `${property.developer} public signal check.`,
        customSignals: property.developerSignals,
      },
      siteVisit: {
        completed: false,
        notes: '',
        checklist: [
          {
            id: 'sv-1',
            category: 'Structure & Ceilings',
            item: 'Check for water stains, hairline structural cracks, and slab deflection',
            status: 'pending',
            notes: '',
          },
          {
            id: 'sv-2',
            category: 'Plumbing & Fixtures',
            item: 'Test water pressure, under-sink moisture, and drain trap flow rates',
            status: 'pending',
            notes: '',
          },
          {
            id: 'sv-3',
            category: 'Electrical & Breakers',
            item: 'Inspect distribution board (DB box) compliance and grounded outlets',
            status: 'pending',
            notes: '',
          },
          {
            id: 'sv-4',
            category: 'Noise & Orientation',
            item: 'Gauge highway acoustic levels during peak hours and afternoon sun glare',
            status: 'pending',
            notes: '',
          },
          {
            id: 'sv-5',
            category: 'Common Facilities',
            item: 'Examine lift service logs, pool pump room maintenance, and refuse chute hygiene',
            status: 'pending',
            notes: '',
          },
        ],
      },
      countryCompliance: {
        completed: false,
        country: property.country,
        notes: `Statutory verification for ${countryPack.name}`,
        checklist: countryPack.defaultChecklist.map((item) => ({
          ...item,
          status: 'action_needed',
          notes: '',
        })),
      },
    },
    decisionProfile: {
      affordability: `Estimated DSR: ${dsrPercent}% under standard mortgage terms.`,
      marketPosition: property.valuation.marketPosition,
      riskSignals: 'Verify strata sinking fund reserves and management corporation audit.',
      downsideResilience: 'Defensive rental yield supports tenant occupancy.',
      strengths: [
        `Prime connectivity within walking distance of key transit nodes in ${property.city}.`,
        `Established reputable master developer (${property.developer}) with low defect track record.`,
        `Resilient rental demand profile (${property.currency} ${property.estimatedRentalValue}/mo estimated).`,
      ],
      risks: [
        `Potential noise from upcoming high-density projects in adjacent plots.`,
        `Upcoming maintenance fee or sinking fund adjustments upon management handover.`,
        `Interest rate volatility risk over initial loan tenure lock-in period.`,
      ],
      verdictRecommendation: `Verify management corporation audited accounts and sinking fund balance. Request official defect inspection report before executing Letter of Offer.`,
      negotiationAdvice: `Leverage current market inventory to negotiate an inclusion of fixtures or a 3-5% price buffer.`,
      lastSynthesizedAt: 'Initial Seed',
    },
  };
};

// Helper to robustly sanitize and patch Case Files against schema updates
const sanitizeCaseFile = (c: any, fallbackProfile: UserProfile = DEFAULT_USER_PROFILE): CaseFile => {
  const prop = MOCK_PROPERTIES.find((p) => p.id === c?.propertyId) || MOCK_PROPERTIES[0];
  const defaultCase = createNewCaseFile(prop, fallbackProfile);
  const rawDP = c?.decisionProfile || c?.verdict || {};

  const mergedModules = {
    ...defaultCase.modules,
    ...(c?.modules || {}),
    stressTest: {
      ...defaultCase.modules.stressTest,
      ...(c?.modules?.stressTest || {}),
    },
    countryCompliance: {
      ...defaultCase.modules.countryCompliance,
      ...(c?.modules?.countryCompliance || {}),
    },
    developerAudit: {
      ...defaultCase.modules.developerAudit,
      ...(c?.modules?.developerAudit || {}),
      customSignals: c?.modules?.developerAudit?.customSignals || defaultCase.modules.developerAudit.customSignals,
      groundedNews: c?.modules?.developerAudit?.groundedNews,
      searchQueries: c?.modules?.developerAudit?.searchQueries,
    },
    priceAnalysis: {
      ...defaultCase.modules.priceAnalysis,
      ...(c?.modules?.priceAnalysis || {}),
    },
    siteVisit: {
      ...defaultCase.modules.siteVisit,
      ...(c?.modules?.siteVisit || {}),
      inspectionVideos: c?.modules?.siteVisit?.inspectionVideos || [],
      photos: c?.modules?.siteVisit?.photos || [],
      transcripts: c?.modules?.siteVisit?.transcripts || [],
    },
  };

  const calculated = computeCaseFileProgress({ modules: mergedModules });
  const effectiveProgressPercent = calculated.progressPercent;
  const effectiveStatus = c?.status === 'Archived' ? 'Archived' : (calculated.status || c?.status);

  return {
    ...defaultCase,
    ...c,
    propertyId: prop.id,
    status: effectiveStatus,
    progressPercent: effectiveProgressPercent,
    decisionProfile: {
      ...defaultCase.decisionProfile,
      ...rawDP,
      risks: Array.isArray(rawDP.risks) && rawDP.risks.length > 0
        ? rawDP.risks
        : (defaultCase.decisionProfile?.risks || [
            'Upcoming maintenance fee or sinking fund adjustments upon management handover.',
            'Interest rate volatility risk over initial loan tenure lock-in period.',
            'Potential noise from upcoming high-density projects in adjacent plots.',
          ]),
      strengths: Array.isArray(rawDP.strengths) && rawDP.strengths.length > 0
        ? rawDP.strengths
        : (defaultCase.decisionProfile?.strengths || [
            `Prime connectivity within walking distance of key transit nodes in ${prop.city}.`,
            `Established reputable master developer (${prop.developer}) with solid track record.`,
            `Resilient rental demand profile (${prop.currency} ${prop.estimatedRentalValue}/mo estimated).`,
          ]),
      verdictRecommendation: rawDP.verdictRecommendation || defaultCase.decisionProfile?.verdictRecommendation || '',
      negotiationAdvice: rawDP.negotiationAdvice || defaultCase.decisionProfile?.negotiationAdvice || '',
      marketPosition: rawDP.marketPosition || defaultCase.decisionProfile?.marketPosition || prop.valuation?.marketPosition || 'Fairly Valued',
    },
    modules: mergedModules,
  };
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSavedAuthSession());

  // Restore active tab across reloads (pageA stays on pageA)
  const getInitialTab = (): NavTab => {
    try {
      const hash = window.location.hash.replace('#', '') as NavTab;
      if (['search', 'saved', 'cases', 'sightview', 'account'].includes(hash)) {
        return hash;
      }
      const savedTab = (sessionStorage.getItem('homestory_active_tab') || localStorage.getItem('homestory_active_tab')) as NavTab;
      if (['search', 'saved', 'cases', 'sightview', 'account'].includes(savedTab)) {
        return savedTab;
      }
    } catch {}
    return 'search';
  };

  const [activeTab, setActiveTab] = useState<NavTab>(getInitialTab);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(() => {
    try {
      const id = sessionStorage.getItem('homestory_selected_prop_id') || localStorage.getItem('homestory_selected_prop_id');
      return id ? (MOCK_PROPERTIES.find((p) => p.id === id) || null) : null;
    } catch {
      return null;
    }
  });

  const [activeSightViewCaseId, setActiveSightViewCaseId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string>(
    'Sign in or register to access verified property listings, financial stress testing, and due diligence dossiers.'
  );
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);

  const executeWithAuth = (reason: string, action: () => void) => {
    if (currentUser) {
      action();
    } else {
      setAuthModalReason(reason);
      setPendingAuthAction(() => action);
      setIsAuthModalOpen(true);
    }
  };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Synchronize User Session & Firestore Subcollections (Saved Properties & Case Files)
  const syncUserSession = async (user: User) => {
    try {
      const userKey = `homestory_user_${user.uid}`;
      saveActiveAuthSession(user);

      const cachedProfileStr = localStorage.getItem(userKey) || localStorage.getItem('homestory_user_profile');

      // Check remote Firestore first
      const remoteProfile = await firestoreSync.getUserProfile(user.uid);
      const userCachedProfile = localStorage.getItem(`homestory_user_${user.uid}`);
      const cachedProfile = userCachedProfile ? JSON.parse(userCachedProfile) : null;
      const existingProfile = remoteProfile || (cachedProfile?.id === user.uid ? cachedProfile : null);

      const isSameUser = Boolean(
        existingProfile && (
          existingProfile.id === user.uid ||
          (user.email && existingProfile.email && existingProfile.email.toLowerCase() === user.email.toLowerCase())
        )
      );

      if (isSameUser && existingProfile) {
        // Returning user: restore personal profile and dossier data.
        setUserProfile(existingProfile);
        const savedIds = await firestoreSync.getSavedPropertyIds(user.uid);
        const localSaved = JSON.parse(localStorage.getItem(`homestory_saved_${user.uid}`) || '[]');
        const finalSaved = savedIds.length > 0 ? savedIds : localSaved;
        setSavedPropertyIds(finalSaved);

        const cases = await firestoreSync.getCaseFiles(user.uid);
        const localCases = JSON.parse(localStorage.getItem(`homestory_cases_${user.uid}`) || '[]');
        const finalCases = cases.length > 0 ? cases : localCases;
        const sanitizedCases = finalCases.map((c: any) => sanitizeCaseFile(c, existingProfile));
        setCaseFiles(sanitizedCases);

        // Ensure subcollections are populated in Firestore
        for (const c of sanitizedCases) {
          firestoreSync.saveCaseFile(user.uid, c).catch(() => {});
        }
        for (const pId of finalSaved) {
          firestoreSync.saveProperty(user.uid, pId).catch(() => {});
        }

        setAuthWelcomeToast(`Welcome back, ${existingProfile.displayName || existingProfile.name}!`);
        setIsProfileModalOpen(false);
      } else {
        // Brand-new registered user: start with clean 0-item saved & cases
        const cleanName = user.displayName || (user.email ? user.email.split('@')[0] : 'Property Buyer');
        const isSingapore = detectLocationCurrency() === 'SGD';
        const freshProfile: UserProfile = {
          id: user.uid,
          name: cleanName,
          displayName: cleanName,
          email: user.email || '',
          residencyStatus: 'Citizen',
          buyerRole: 'First-time Homebuyer',
          countryPreference: isSingapore ? 'Singapore' : 'Malaysia',
          monthlyGrossIncome: 0,
          existingMonthlyDebts: 0,
          defaultCurrency: detectLocationCurrency(),
          currencyPreference: 'AUTO',
        };

        const initialSaved: string[] = [];
        const initialCases: CaseFile[] = [];

        setUserProfile(freshProfile);
        setSavedPropertyIds(initialSaved);
        setCaseFiles(initialCases);

        localStorage.setItem(userKey, JSON.stringify(freshProfile));
        localStorage.setItem(`homestory_saved_${user.uid}`, JSON.stringify(initialSaved));
        localStorage.setItem(`homestory_cases_${user.uid}`, JSON.stringify(initialCases));
        localStorage.setItem('homestory_user_profile', JSON.stringify(freshProfile));
        localStorage.setItem('homestory_saved_ids', JSON.stringify(initialSaved));
        localStorage.setItem('homestory_case_files', JSON.stringify(initialCases));

        // Save profile directly to Firestore
        await firestoreSync.saveUserProfile(user.uid, freshProfile).catch(console.warn);

        setAuthWelcomeToast(`Welcome to Homestory, ${cleanName}! Please verify your buyer presets.`);
        setIsProfileModalOpen(true);
      }
    } catch (err) {
      console.error('User session sync error:', err);
    }
  };

  // Full reset account action: Wipes records and signs out when explicitly triggered by the user in settings
  const handleResetUserAccount = async () => {
    if (currentUser) {
      await firestoreSync.deleteUserProfile(currentUser.uid).catch(() => {});
      await signOutUser().catch(() => {});
    }
    localStorage.clear();
    sessionStorage.clear();

    const isSingapore = detectLocationCurrency() === 'SGD';
    const freshProfile: UserProfile = {
      id: 'buyer-fresh',
      name: 'Property Buyer',
      displayName: 'Property Buyer',
      email: '',
      residencyStatus: 'Citizen',
      buyerRole: 'First-time Homebuyer',
      countryPreference: isSingapore ? 'Singapore' : 'Malaysia',
      monthlyGrossIncome: 0,
      existingMonthlyDebts: 0,
      defaultCurrency: detectLocationCurrency(),
      currencyPreference: 'AUTO',
    };

    setCurrentUser(null);
    setUserProfile(freshProfile);
    setSavedPropertyIds([]);
    setCaseFiles([]);
    setActiveCaseFile(null);
    setSelectedProperty(null);
    setActiveTab('search');
    window.location.hash = 'search';
    setAuthWelcomeToast('Account details wiped. You are now logged out.');
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    saveActiveAuthSession(user);
    setIsAuthModalOpen(false);
    syncUserSession(user);
    if (pendingAuthAction) {
      pendingAuthAction();
      setPendingAuthAction(null);
    }
  };

  const isSigningOutRef = React.useRef(false);

  // Complete Sign Out: Clears user info, resets guest state, and navigates immediately to homepage
  const handleSignOut = async () => {
    isSigningOutRef.current = true;
    try {
      await signOutUser();
      setCurrentUser(null);
      localStorage.removeItem('homestory_auth_session');
      localStorage.removeItem('homestory_user_profile');
      localStorage.removeItem('homestory_saved_ids');
      localStorage.removeItem('homestory_case_files');
      sessionStorage.removeItem('homestory_active_tab');
      localStorage.removeItem('homestory_active_tab');
      sessionStorage.removeItem('homestory_selected_prop_id');
      localStorage.removeItem('homestory_selected_prop_id');
      sessionStorage.removeItem('homestory_active_case_id');
      localStorage.removeItem('homestory_active_case_id');

      setUserProfile(DEFAULT_USER_PROFILE);
      setSavedPropertyIds([]);
      setCaseFiles([]);
      setActiveCaseFile(null);
      setSelectedProperty(null);
      setSearchResults(null);

      // Move directly to homepage upon sign out
      setActiveTab('search');
      window.location.hash = 'search';
      scrollToTop();
      setAuthWelcomeToast('You have signed out. Welcome to guest mode.');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setTimeout(() => {
        isSigningOutRef.current = false;
      }, 1200);
    }
  };

  // Push browser history state so user can use the browser's native Back button everywhere except Home
  const pushNavHistory = () => {
    try {
      window.history.pushState({ timestamp: Date.now() }, '');
    } catch {}
  };

  // Guaranteed scroll-to-top on every page navigation, tab redirection, or drilldown transition
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 40);
  };

  const handleSelectPropertyInternal = (prop: Property | null) => {
    scrollToTop();
    if (prop) pushNavHistory();
    setSelectedProperty(prop);
  };

  const handleSelectProperty = (prop: Property | null) => {
    if (!prop) {
      handleSelectPropertyInternal(null);
      return;
    }
    executeWithAuth(
      `Sign in or register to inspect ${prop.title}'s valuation corridor, developer audit, and due diligence.`,
      () => {
        handleSelectPropertyInternal(prop);
      }
    );
  };
  const [activeCaseFile, setActiveCaseFile] = useState<CaseFile | null>(() => {
    try {
      const caseId = sessionStorage.getItem('homestory_active_case_id') || localStorage.getItem('homestory_active_case_id');
      if (caseId) {
        const session = getSavedAuthSession();
        const stored = session?.uid
          ? localStorage.getItem(`homestory_cases_${session.uid}`) || localStorage.getItem('homestory_case_files')
          : localStorage.getItem('homestory_case_files');
        if (stored) {
          const list = JSON.parse(stored);
          const found = list.find((c: any) => c.caseId === caseId);
          if (found) return sanitizeCaseFile(found, DEFAULT_USER_PROFILE);
        }
      }
    } catch {}
    return null;
  });
  const [searchResults, setSearchResults] = useState<Property[] | null>(null);
  const [searchCriteriaText, setSearchCriteriaText] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);

  // Keep active tab and route persistent across reloads (page stays on page upon refresh)
  useEffect(() => {
    try {
      sessionStorage.setItem('homestory_active_tab', activeTab);
      localStorage.setItem('homestory_active_tab', activeTab);
      window.location.hash = activeTab;
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (selectedProperty) {
        sessionStorage.setItem('homestory_selected_prop_id', selectedProperty.id);
        localStorage.setItem('homestory_selected_prop_id', selectedProperty.id);
      } else {
        sessionStorage.removeItem('homestory_selected_prop_id');
        localStorage.removeItem('homestory_selected_prop_id');
      }
    } catch {}
  }, [selectedProperty]);

  useEffect(() => {
    try {
      if (activeCaseFile) {
        sessionStorage.setItem('homestory_active_case_id', activeCaseFile.caseId);
        localStorage.setItem('homestory_active_case_id', activeCaseFile.caseId);
      } else {
        sessionStorage.removeItem('homestory_active_case_id');
        localStorage.removeItem('homestory_active_case_id');
      }
    } catch {}
  }, [activeCaseFile]);

  // Browser History and Popstate support for native & browser back button navigation everywhere except Home
  useEffect(() => {
    const handlePopState = () => {
      if (activeCaseFile) {
        setActiveCaseFile(null);
      } else if (selectedProperty) {
        setSelectedProperty(null);
      } else if (searchResults !== null) {
        setSearchResults(null);
      } else if (activeTab !== 'search') {
        setActiveTab('search');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeCaseFile, selectedProperty, searchResults, activeTab]);

  // Apple-style scroll reveal IntersectionObserver for smooth upward animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -30px 0px',
        threshold: 0.05,
      }
    );

    const observeElements = () => {
      const elements = document.querySelectorAll('.apple-reveal:not(.is-revealed)');
      elements.forEach((el) => observer.observe(el));
    };

    observeElements();
    const interval = setInterval(observeElements, 400);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [activeTab, selectedProperty, activeCaseFile, searchResults]);

  // Scroll to top only when switching tabs, opening a new property or opening a different case file
  const activeCaseId = activeCaseFile?.caseId;
  const selectedPropertyId = selectedProperty?.id;
  const isSearchActive = searchResults !== null;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    scrollToTop();
  }, [activeTab, selectedPropertyId, activeCaseId, isSearchActive]);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('homestory_user_profile');
      return stored ? JSON.parse(stored) : DEFAULT_USER_PROFILE;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  });

  // Saved Properties - start empty for guests, restore per authenticated user
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>(() => {
    try {
      const session = getSavedAuthSession();
      if (session?.uid) {
        const stored = localStorage.getItem(`homestory_saved_${session.uid}`) || localStorage.getItem('homestory_saved_ids');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
    return [];
  });

  // Case Files - start empty for guests, restore per authenticated user
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>(() => {
    try {
      const session = getSavedAuthSession();
      if (session?.uid) {
        const stored = localStorage.getItem(`homestory_cases_${session.uid}`) || localStorage.getItem('homestory_case_files');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed.map((c: any) => sanitizeCaseFile(c, DEFAULT_USER_PROFILE));
          }
        }
      }
    } catch {}
    return [];
  });

  const [authWelcomeToast, setAuthWelcomeToast] = useState<string | null>(null);

  // Test Firestore on boot and listen to Auth
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isSigningOutRef.current) return;
      if (user) {
        setCurrentUser(user);
        saveActiveAuthSession(user);
        await syncUserSession(user);
      } else {
        const savedSession = getSavedAuthSession();
        if (savedSession) {
          setCurrentUser(savedSession);
          await syncUserSession(savedSession);
        } else {
          setCurrentUser(null);
          setUserProfile(DEFAULT_USER_PROFILE);
          setSavedPropertyIds([]);
          setCaseFiles([]);
          setActiveCaseFile(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync state changes to localStorage and Firestore
  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('homestory_user_profile', JSON.stringify(newProfile));

    if (currentUser) {
      try {
        await firestoreSync.saveUserProfile(currentUser.uid, newProfile);
      } catch (err) {
        console.error('Error saving profile to Firestore:', err);
      }
    }
  };

  const handleToggleSave = async (propertyId: string) => {
    const isSaved = savedPropertyIds.includes(propertyId);
    const updated = isSaved
      ? savedPropertyIds.filter((id) => id !== propertyId)
      : [...savedPropertyIds, propertyId];

    setSavedPropertyIds(updated);
    localStorage.setItem('homestory_saved_ids', JSON.stringify(updated));

    if (currentUser) {
      localStorage.setItem(`homestory_saved_${currentUser.uid}`, JSON.stringify(updated));
      try {
        if (isSaved) {
          await firestoreSync.removeSavedProperty(currentUser.uid, propertyId);
        } else {
          await firestoreSync.saveProperty(currentUser.uid, propertyId);
        }
      } catch (err) {
        console.error('Error syncing saved property to Firestore:', err);
      }
    }
  };

  const handleUpdateCaseFile = async (updated: CaseFile) => {
    const updatedCases = caseFiles.some((c) => c.caseId === updated.caseId)
      ? caseFiles.map((c) => (c.caseId === updated.caseId ? updated : c))
      : [updated, ...caseFiles];
    setCaseFiles(updatedCases);
    setActiveCaseFile(updated);
    localStorage.setItem('homestory_case_files', JSON.stringify(updatedCases));

    if (currentUser) {
      localStorage.setItem(`homestory_cases_${currentUser.uid}`, JSON.stringify(updatedCases));
      try {
        await firestoreSync.saveCaseFile(currentUser.uid, updated);
      } catch (err) {
        console.error('Error syncing case file to Firestore:', err);
      }
    }
  };

  const handleToggleCountry = () => {
    const nextCountry = userProfile.countryPreference === 'Malaysia' ? 'Singapore' : 'Malaysia';
    const nextCurrency = nextCountry === 'Malaysia' ? 'MYR' : 'SGD';
    handleUpdateProfile({
      ...userProfile,
      countryPreference: nextCountry,
      defaultCurrency: nextCurrency,
    });
  };

  // Start Due Diligence on a property
  const handleStartDueDiligenceInternal = (prop: Property) => {
    const existing = caseFiles.find((c) => c.propertyId === prop.id);
    if (existing) {
      setActiveCaseFile(existing);
    } else {
      const newCase = createNewCaseFile(prop, userProfile);
      const updated = [newCase, ...caseFiles];
      setCaseFiles(updated);
      setActiveCaseFile(newCase);
      localStorage.setItem('homestory_case_files', JSON.stringify(updated));

      if (currentUser) {
        localStorage.setItem(`homestory_cases_${currentUser.uid}`, JSON.stringify(updated));
        firestoreSync.saveCaseFile(currentUser.uid, newCase).catch(console.error);
      }
    }

    setSelectedProperty(null);
    setActiveTab('cases');
  };

  const handleStartDueDiligence = (prop: Property) => {
    executeWithAuth(
      `Sign in or register to launch a comprehensive due diligence dossier for ${prop.title}.`,
      () => {
        handleStartDueDiligenceInternal(prop);
      }
    );
  };

  // Park Case File under History Tab (Archived so user can still refer to it anytime)
  const handleDismissCase = async (caseId: string) => {
    const updated = caseFiles.map((c) => {
      if (c.caseId === caseId) {
        return {
          ...c,
          isArchived: true,
          status: 'Archived' as any,
        };
      }
      return c;
    });
    setCaseFiles(updated);
    if (activeCaseFile?.caseId === caseId) {
      setActiveCaseFile(null);
    }
    localStorage.setItem('homestory_case_files', JSON.stringify(updated));
    if (currentUser) {
      localStorage.setItem(`homestory_cases_${currentUser.uid}`, JSON.stringify(updated));
      const targetCase = updated.find((c) => c.caseId === caseId);
      if (targetCase) {
        firestoreSync.saveCaseFile(currentUser.uid, targetCase).catch(console.warn);
      }
    }
  };

  // Restore Case File from History back to Active Dossiers
  const handleRestoreCase = async (caseId: string) => {
    const updated = caseFiles.map((c) => {
      if (c.caseId === caseId) {
        const computed = computeCaseFileProgress(c);
        return {
          ...c,
          isArchived: false,
          status: computed.status,
        };
      }
      return c;
    });
    setCaseFiles(updated);
    localStorage.setItem('homestory_case_files', JSON.stringify(updated));
    if (currentUser) {
      localStorage.setItem(`homestory_cases_${currentUser.uid}`, JSON.stringify(updated));
      const targetCase = updated.find((c) => c.caseId === caseId);
      if (targetCase) {
        firestoreSync.saveCaseFile(currentUser.uid, targetCase).catch(console.warn);
      }
    }
  };

  // Permanently delete a case file only when user clicks permanent delete inside History tab
  const handlePermanentDeleteCase = async (caseId: string) => {
    const updated = caseFiles.filter((c) => c.caseId !== caseId);
    setCaseFiles(updated);
    if (activeCaseFile?.caseId === caseId) {
      setActiveCaseFile(null);
    }
    localStorage.setItem('homestory_case_files', JSON.stringify(updated));
    if (currentUser) {
      localStorage.setItem(`homestory_cases_${currentUser.uid}`, JSON.stringify(updated));
      try {
        await firestoreSync.removeCaseFile(currentUser.uid, caseId);
      } catch (err) {
        console.warn('Firestore dismiss case sync:', err);
      }
    }
  };

  // Handle Search Filtering
  const handlePerformSearchInternal = (filters: {
    purpose: PurchasePurpose | 'All';
    propertyType: string;
    location: string;
    maxPrice: number;
    searchQuery?: string;
  }) => {
    const rawQuery = (filters.searchQuery || '').trim().toLowerCase();
    // Filter out common filler words
    const queryTokens = rawQuery
      ? rawQuery
          .replace(/[?,.:;!]/g, '')
          .split(/\s+/)
          .filter((t) => t.length > 1 && !['the', 'and', 'for', 'with', 'in', 'near', 'under', 'below'].includes(t))
      : [];

    const filtered = MOCK_PROPERTIES.filter((p) => {
      // 1. Purpose filter
      if (filters.purpose !== 'All' && p.purpose !== filters.purpose) return false;

      // 2. Property type filter
      if (filters.propertyType !== 'All' && p.propertyType !== filters.propertyType) {
        if (!p.propertyType.toLowerCase().includes(filters.propertyType.toLowerCase())) {
          return false;
        }
      }

      // 3. Location filter - flexible matching across Singapore and Malaysian regions
      if (filters.location !== 'All') {
        const queryLoc = filters.location.toLowerCase();
        const matchesLoc =
          p.city.toLowerCase().includes(queryLoc) ||
          p.country.toLowerCase().includes(queryLoc) ||
          p.address.toLowerCase().includes(queryLoc) ||
          (p.stateDistrict && p.stateDistrict.toLowerCase().includes(queryLoc)) ||
          (queryLoc.includes('singapore') && p.country.toLowerCase().includes('singapore')) ||
          (queryLoc.includes('selangor') && (p.city.toLowerCase().includes('petaling jaya') || p.city.toLowerCase().includes('subang jaya') || p.city.toLowerCase().includes('selangor'))) ||
          (queryLoc.includes('kuala lumpur') && (p.city.toLowerCase().includes('kuala lumpur') || p.stateDistrict?.toLowerCase().includes('klcc') || p.stateDistrict?.toLowerCase().includes('mont kiara') || p.stateDistrict?.toLowerCase().includes('sentul'))) ||
          (queryLoc.includes('penang') && (p.city.toLowerCase().includes('penang') || p.address.toLowerCase().includes('penang'))) ||
          (queryLoc.includes('johor') && (p.city.toLowerCase().includes('johor') || p.address.toLowerCase().includes('johor')));
        if (!matchesLoc) return false;
      }

      // 4. Free-Text Search Query matching across title, developer, city, district, country, address, tenure, amenities
      if (queryTokens.length > 0) {
        const searchableText = [
          p.title,
          p.developer,
          p.city,
          p.country,
          p.stateDistrict,
          p.address,
          p.propertyType,
          p.tenure,
          p.description,
          ...(p.amenities || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesQuery = queryTokens.some((token) => {
          if (token === 'sg' || token === 'singapore') return p.country.toLowerCase() === 'singapore';
          if (token === 'my' || token === 'malaysia' || token === 'kl') return p.country.toLowerCase() === 'malaysia';
          if (token.includes('bed') || token.includes('br')) {
            const num = parseInt(token);
            if (!isNaN(num)) return p.bedrooms === num;
          }
          return searchableText.includes(token);
        });

        if (!matchesQuery) return false;
      }

      // 5. Budget filter (Starts from 0, or user types in the amount box with cross-border conversion):
      if (filters.maxPrice > 0 && filters.maxPrice < 50000000) {
        const isSingaporeFilter = filters.location === 'Singapore' || rawQuery.includes('singapore') || rawQuery.includes('s$');
        const filterCurrency = isSingaporeFilter ? 'SGD' : 'MYR';
        const comparePrice = p.currency === filterCurrency ? p.price : convertCurrency(p.price, p.currency, filterCurrency);
        if (comparePrice > filters.maxPrice) {
          return false;
        }
      }
      return true;
    });

    const criteriaSummary = [
      filters.purpose === 'Rent' ? 'Rent' : 'Buy',
      filters.propertyType !== 'All' ? filters.propertyType : null,
      filters.location !== 'All' ? filters.location : null,
      filters.maxPrice > 0 && filters.maxPrice < 50000000
        ? `Up to ${filters.location === 'Singapore' ? 'S$' : 'RM'} ${filters.maxPrice.toLocaleString()} ${filters.purpose === 'Rent' ? '/mo' : ''}`
        : 'Any Budget',
      filters.searchQuery ? `"${filters.searchQuery}"` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    setSearchResults(filtered);
    setSearchCriteriaText(filters.searchQuery ? `Query: "${filters.searchQuery}" (${criteriaSummary})` : criteriaSummary);
    setSelectedProperty(null);
  };

  const handlePerformSearch = (filters: {
    purpose: PurchasePurpose | 'All';
    propertyType: string;
    location: string;
    maxPrice: number;
    searchQuery?: string;
  }) => {
    executeWithAuth(
      'Sign in or register to search verified property listings and run AI inquiries.',
      () => {
        handlePerformSearchInternal(filters);
      }
    );
  };

  // Save SightView Session into Case Dossier
  const handleSaveSightViewToCase = (session: any) => {
    const targetProp = selectedProperty || session.property || MOCK_PROPERTIES[0];
    let targetCase = caseFiles.find(
      (c) => (activeSightViewCaseId && c.caseId === activeSightViewCaseId) || c.propertyId === targetProp.id
    );
    if (!targetCase) {
      targetCase = createNewCaseFile(targetProp, userProfile);
    }

    const existingTranscripts = targetCase.modules?.siteVisit?.transcripts || [];
    const existingPhotos = targetCase.modules?.siteVisit?.photos || [];

    const newTranscripts = session.transcripts || [
      {
        speaker: 'SightView AI',
        text: session.defectObservation || 'Defect inspection observation logged',
        timestamp: new Date().toLocaleTimeString(),
      },
    ];

    const newPhotos = session.photos || (session.photoUrl ? [session.photoUrl] : []);
    const existingVideos = targetCase.modules?.siteVisit?.inspectionVideos || [];
    const newVideos = session.recordedVideos || (session.video ? [session.video] : []);

    const updatedModules = {
      ...targetCase.modules,
      siteVisit: {
        ...targetCase.modules.siteVisit,
        completed: false,
        status: 'in progress',
        transcripts: [...existingTranscripts, ...newTranscripts],
        photos: Array.from(new Set([...existingPhotos, ...newPhotos])),
        inspectionVideos: [...existingVideos, ...newVideos],
      },
    };

    const calculated = computeCaseFileProgress({ modules: updatedModules });

    const updatedCase: CaseFile = {
      ...targetCase,
      status: calculated.status,
      progressPercent: calculated.progressPercent,
      modules: updatedModules,
    };

    handleUpdateCaseFile(updatedCase);
    setSelectedProperty(null);
    setActiveCaseFile(updatedCase);
    setActiveTab('cases');
    sessionStorage.setItem('homestory_active_tab', 'cases');
    localStorage.setItem('homestory_active_tab', 'cases');
    sessionStorage.setItem('homestory_active_case_id', updatedCase.caseId);
    localStorage.setItem('homestory_active_case_id', updatedCase.caseId);
    window.location.hash = 'cases';
    setAuthWelcomeToast(`SightView AI findings & inspection evidence successfully saved to Dossier #${updatedCase.caseId.slice(-6)}.`);
  };

  // Resolve effective user currency based on preference
  const effectiveUserCurrency = useMemo(() => {
    if (userProfile.currencyPreference === 'MYR') return 'MYR';
    if (userProfile.currencyPreference === 'SGD') return 'SGD';
    return userProfile.defaultCurrency || detectLocationCurrency();
  }, [userProfile.currencyPreference, userProfile.defaultCurrency]);

  // Resolve saved properties list
  const savedPropertiesList = useMemo(() => {
    return MOCK_PROPERTIES.filter((p) => savedPropertyIds.includes(p.id));
  }, [savedPropertyIds]);

  // Render current screen content
  const renderScreenContent = () => {
    // 1. SightView AI Live Camera Inspection (High Priority Tool Screen)
    if (activeTab === 'sightview') {
      return (
        <SightViewScreen
          userProfile={userProfile}
          initialProperty={selectedProperty}
          allProperties={MOCK_PROPERTIES}
          onSaveToCaseFile={handleSaveSightViewToCase}
          onBack={() => {
            if (selectedProperty) {
              // Return to the property detail
              setActiveTab('search');
            } else {
              setActiveTab('search');
            }
          }}
          onNavigateToProperty={(prop) => {
            handleSelectPropertyInternal(prop);
            setActiveTab('search');
          }}
        />
      );
    }

    // 2. Active Case File Dashboard Drilldown (when a specific case is open in cases tab)
    if (activeTab === 'cases' && activeCaseFile) {
      const sanitizedActiveCase = sanitizeCaseFile(activeCaseFile, userProfile);
      const prop = MOCK_PROPERTIES.find((p) => p.id === sanitizedActiveCase.propertyId) || MOCK_PROPERTIES[0];
      return (
        <CaseFileDashboard
          caseFile={sanitizedActiveCase}
          property={prop}
          userProfile={userProfile}
          onBack={() => setActiveCaseFile(null)}
          onUpdateCaseFile={handleUpdateCaseFile}
          onDismissCase={handleDismissCase}
          onOpenSightView={(targetProp, caseId) => {
            handleSelectPropertyInternal(targetProp);
            setActiveSightViewCaseId(caseId || sanitizedActiveCase.caseId);
            setActiveTab('sightview');
          }}
        />
      );
    }

    // 3. Property Detail Screen (Overlay / Drilldown from Search or Saved)
    if (selectedProperty) {
      return (
        <PropertyDetailScreen
          property={selectedProperty}
          onBack={() => setSelectedProperty(null)}
          onStartDueDiligence={handleStartDueDiligence}
          isSaved={savedPropertyIds.includes(selectedProperty.id)}
          onToggleSave={handleToggleSave}
          userProfile={userProfile}
          onOpenSightView={(prop) => {
            setSelectedProperty(prop);
            setActiveTab('sightview');
          }}
        />
      );
    }

    // 3. Main Navigation Tabs
    switch (activeTab) {
      case 'search':
        if (searchResults !== null) {
          return (
            <SearchResultsScreen
              properties={searchResults}
              searchCriteriaText={searchCriteriaText}
              onBackToSearch={() => setSearchResults(null)}
              onSelectProperty={(prop) => handleSelectProperty(prop)}
              savedPropertyIds={savedPropertyIds}
              onToggleSave={handleToggleSave}
              userCurrency={effectiveUserCurrency}
              onStartDueDiligence={handleStartDueDiligence}
            />
          );
        }
        return (
          <HomeSearchScreen
            userProfile={userProfile}
            properties={MOCK_PROPERTIES}
            onSelectProperty={(prop) => handleSelectProperty(prop)}
            onPerformSearch={handlePerformSearch}
            savedPropertyIds={savedPropertyIds}
            onToggleSave={handleToggleSave}
            userCurrency={effectiveUserCurrency}
            currentUser={currentUser}
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            onStartDueDiligence={handleStartDueDiligence}
            onOpenSightView={() => {
              executeWithAuth('Sign in to launch SightView AI™ live camera inspection.', () => {
                setActiveTab('sightview');
              });
            }}
          />
        );

      case 'saved':
        return (
          <SavedScreen
            savedProperties={savedPropertiesList}
            caseFiles={caseFiles}
            onSelectProperty={(prop) => handleSelectProperty(prop)}
            onOpenCaseFile={(c) => {
              setActiveCaseFile(sanitizeCaseFile(c, userProfile));
              setActiveTab('cases');
            }}
            onStartDueDiligence={handleStartDueDiligence}
            onRemoveBookmark={handleToggleSave}
            onNavigateToSearch={() => {
              setSearchResults(null);
              setActiveTab('search');
            }}
            onOpenSightView={(prop) => {
              handleSelectPropertyInternal(prop);
              setActiveTab('sightview');
            }}
          />
        );

      case 'cases':
        return (
          <CaseFilesListView
            caseFiles={caseFiles}
            properties={MOCK_PROPERTIES}
            onOpenCaseFile={(c) => {
              setSelectedProperty(null);
              setActiveCaseFile(sanitizeCaseFile(c, userProfile));
            }}
            onNavigateToSearch={() => {
              setSearchResults(null);
              setActiveTab('search');
            }}
            onDismissCase={handleDismissCase}
            onRestoreCase={handleRestoreCase}
            onPermanentDeleteCase={handlePermanentDeleteCase}
          />
        );

      case 'account':
        return (
          <AccountScreen
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            currentUser={currentUser}
            onResetAccount={handleResetUserAccount}
            onBack={() => setActiveTab('search')}
            onSignOut={handleSignOut}
          />
        );

      default:
        return null;
    }
  };

  const handleTabNavigation = (tab: NavTab) => {
    scrollToTop();
    handleSelectPropertyInternal(null);
    setActiveCaseFile(null); // Always open the full list of case files when navigating to case files
    sessionStorage.removeItem('homestory_selected_prop_id');
    sessionStorage.removeItem('homestory_active_case_id');
    sessionStorage.setItem('homestory_active_tab', tab);
    window.location.hash = tab;
    if (tab === 'search') {
      setSearchResults(null);
      setActiveTab('search');
      return;
    }
    if (tab === 'saved') {
      executeWithAuth('Sign in or register to view your saved properties collection.', () => {
        pushNavHistory();
        scrollToTop();
        setActiveTab('saved');
      });
      return;
    }
    if (tab === 'cases') {
      executeWithAuth('Sign in or register to access due diligence case dossiers and stress tests.', () => {
        pushNavHistory();
        scrollToTop();
        setActiveTab('cases');
      });
      return;
    }
    if (tab === 'sightview') {
      executeWithAuth('Sign in or register to launch SightView AI™ live inspection camera.', () => {
        pushNavHistory();
        scrollToTop();
        setActiveTab('sightview');
      });
      return;
    }
    if (tab === 'account') {
      executeWithAuth('Sign in or register to configure your personal buyer underwriting profile.', () => {
        pushNavHistory();
        scrollToTop();
        setActiveTab('account');
      });
      return;
    }
    pushNavHistory();
    scrollToTop();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1E2A44] font-sans antialiased selection:bg-[#C98A3E]/20 flex flex-col">
      {/* Editorial Desktop & Mobile Navbar with Wordmark, Links, Country Chip & Burger Trigger */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={handleTabNavigation}
        savedCount={currentUser ? savedPropertyIds.length : 0}
        caseCount={currentUser ? caseFiles.length : 0}
        userProfile={userProfile}
        currentUser={currentUser}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenAuthModal={() => {
          setAuthModalReason('Sign in or register to access verified property listings, financial stress testing, and due diligence dossiers.');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Dynamic Screen View */}
      <main className="flex-1">
        {renderScreenContent()}
      </main>

      {/* Burger Slide-over Drawer */}
      <BurgerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onChangeTab={handleTabNavigation}
        savedCount={currentUser ? savedPropertyIds.length : 0}
        caseCount={currentUser ? caseFiles.length : 0}
        userProfile={userProfile}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenHowItWorks={() => {
          setIsDrawerOpen(false);
          setIsHowItWorksOpen(true);
        }}
        onSwitchCountry={(country) => {
          handleUpdateProfile({
            ...userProfile,
            countryPreference: country,
            defaultCurrency: country === 'Malaysia' ? 'MYR' : 'SGD',
          });
        }}
        onOpenAuthModal={() => {
          setAuthModalReason('Sign in or register to access verified property listings, financial stress testing, and due diligence dossiers.');
          setIsAuthModalOpen(true);
        }}
        onResetAccount={handleResetUserAccount}
      />

      {/* Editorial How It Works Walkthrough Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onStartExploring={() => {
          setSelectedProperty(null);
          setSearchResults(null);
          setActiveTab('search');
        }}
      />

      {/* Sign-In / Register Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        actionReason={authModalReason}
      />

      {/* First-Time User Profile Setup Onboarding Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onSaveProfile={handleUpdateProfile}
      />
    </div>
  );
};

export default App;
