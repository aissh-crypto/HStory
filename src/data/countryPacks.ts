import { CountryCode, CountryChecklistItem } from '../types';

export interface CountryPack {
  code: CountryCode;
  name: string;
  currency: string;
  currencySymbol: string;
  regulators: string[];
  titleTypes: string[];
  maxStandardDsr: number; // e.g. 60%
  stampDutySummary: string;
  foreignBuyerRules: string;
  defaultChecklist: CountryChecklistItem[];
  calculateStampDuty: (price: number, isForeignBuyer?: boolean, isFirstTimeBuyer?: boolean) => {
    stampDuty: number;
    legalFeesEstimate: number;
    breakdown: string[];
  };
}

export const COUNTRY_PACKS: Record<CountryCode, CountryPack> = {
  Malaysia: {
    code: 'Malaysia',
    name: 'Malaysia (Peninsular / Federal Territories)',
    currency: 'MYR',
    currencySymbol: 'RM',
    regulators: [
      'Ministry of Housing and Local Government (KPKT)',
      'Valuation and Property Services Department (JPPH)',
      'Land and Mines Office (PTG / Pejabat Tanah dan Galian)',
      'Strata Management Tribunal (SMT)',
    ],
    titleTypes: ['Individual Title (Freehold)', 'Strata Title (Freehold)', 'Leasehold 99-year', 'Master Title (Pending Subdivision)'],
    maxStandardDsr: 65,
    stampDutySummary: 'MOT Tiered: 1% (first RM100k), 2% (RM100k-500k), 3% (RM500k-1M), 4% (>RM1M). First-time buyer remissions apply up to RM500k.',
    foreignBuyerRules: 'Minimum purchase threshold applies by state (e.g., RM 1,000,000 in KL, RM 2,000,000 in Selangor zone 1 & 2). Requires State Authority Consent (Section 433B National Land Code).',
    defaultChecklist: [
      {
        id: 'my-1',
        title: 'Title Verification (Strata / Individual vs Master Title)',
        description: 'Ensure individual strata title has been issued, or verify Developer Liquidator status if on Master Title over 10 years old.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'my-2',
        title: 'Bumiputera Quota / Lot Status Check',
        description: 'Verify Land Registry search to ensure the parcel is not a Bumi Lot if purchasing as a non-Bumi, which would cause transfer rejection.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'my-3',
        title: 'Developer APDL & Statutory DLP Compliance',
        description: 'Verify Developer Advertising Permit and Developer License (APDL) and ensure 24-month statutory Defect Liability Period coverage.',
        status: 'action_needed',
        critical: false,
        notes: '',
      },
      {
        id: 'my-4',
        title: 'Management Corporation (JMB / MC) Audited Accounts & Sinking Fund',
        description: 'Review last AGM minutes, sinking fund balance, outstanding maintenance arrears, and verify whether any major lift or repainting levy is slated.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'my-5',
        title: 'Foreign Ownership Minimum Threshold & State Consent',
        description: 'If foreign buyer, confirm transaction price satisfies state minimum (KL: RM1M, Selangor: RM2M) and prepare 2% consent application.',
        status: 'not_applicable',
        critical: false,
        notes: '',
      },
      {
        id: 'my-6',
        title: 'Private Caveat and Existing Bank Charge Search',
        description: 'Perform official land search to verify no competing private caveats or unredeemed 3rd-party charges exist on the property.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
    ],
    calculateStampDuty: (price: number, isForeignBuyer = false, isFirstTimeBuyer = false) => {
      let mot = 0;
      const breakdown: string[] = [];

      if (isFirstTimeBuyer && price <= 500000) {
        breakdown.push('First-Time Homebuyer 100% MOT Stamp Duty Exemption applied.');
        mot = 0;
      } else {
        // Tier 1: First 100k @ 1%
        const t1 = Math.min(price, 100000);
        mot += t1 * 0.01;
        breakdown.push(`First RM 100,000 @ 1%: RM ${(t1 * 0.01).toLocaleString()}`);

        // Tier 2: 100k to 500k @ 2%
        if (price > 100000) {
          const t2 = Math.min(price - 100000, 400000);
          mot += t2 * 0.02;
          breakdown.push(`Next RM 400,000 @ 2%: RM ${(t2 * 0.02).toLocaleString()}`);
        }

        // Tier 3: 500k to 1M @ 3%
        if (price > 500000) {
          const t3 = Math.min(price - 500000, 500000);
          mot += t3 * 0.03;
          breakdown.push(`Next RM 500,000 @ 3%: RM ${(t3 * 0.03).toLocaleString()}`);
        }

        // Tier 4: Above 1M @ 4%
        if (price > 1000000) {
          const t4 = price - 1000000;
          mot += t4 * 0.04;
          breakdown.push(`Remaining over RM 1,000,000 @ 4%: RM ${(t4 * 0.04).toLocaleString()}`);
        }
      }

      // Legal fees (Solicitors Remuneration Order scale)
      const legalFees = Math.round(price * 0.009 + 2500);
      breakdown.push(`Estimated Legal & Valuation Disbursements: RM ${legalFees.toLocaleString()}`);

      if (isForeignBuyer) {
        breakdown.push('State Consent Application levy: RM 1,000 - 5,000 depending on state.');
      }

      return {
        stampDuty: mot,
        legalFeesEstimate: legalFees,
        breakdown,
      };
    },
  },
  Singapore: {
    code: 'Singapore',
    name: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    regulators: [
      'Urban Redevelopment Authority (URA)',
      'Inland Revenue Authority of Singapore (IRAS)',
      'Singapore Land Authority (SLA)',
      'Building and Construction Authority (BCA)',
      'Monetary Authority of Singapore (MAS)',
    ],
    titleTypes: ['Estate in Fee Simple (Freehold)', '999-Year Leasehold', '99-Year Leasehold (Subject to Bala Curve)'],
    maxStandardDsr: 55, // MAS TDSR 55%
    stampDutySummary: 'Buyer Stamp Duty (BSD) tiered up to 6%. Additional Buyer Stamp Duty (ABSD) up to 20% for 2nd residential property (SC) and 60% for foreigners.',
    foreignBuyerRules: 'Restricted residential properties (landed homes) require Singapore Land Authority Land Dealings Approval Unit (LDAU) approval. ABSD for foreign individuals is 60%.',
    defaultChecklist: [
      {
        id: 'sg-1',
        title: 'MAS TDSR (55%) & MSR Borrowing Capacity Assessment',
        description: 'Total Debt Servicing Ratio capped at 55% of gross monthly income, calculated against MAS medium-term stress interest rate floor (4.0%).',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'sg-2',
        title: 'ABSD & Buyer Profile Verification',
        description: 'Verify residency status and existing property count to apply correct ABSD tier (0% for 1st property Citizen, 20% for 2nd, 60% for Foreigners).',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'sg-3',
        title: '99-Year Lease Decay & Bala Curve Residual Analysis',
        description: 'Calculate remaining lease. If remaining lease drops under 30 years, CPF withdrawal limits and bank financing are severely restricted.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'sg-4',
        title: 'URA Master Plan Zonal & Plot Ratio Check',
        description: 'Inspect URA Master Plan for allowable gross plot ratio and surrounding empty plots earmarked for high-rise commercial or infrastructure works.',
        status: 'action_needed',
        critical: false,
        notes: '',
      },
      {
        id: 'sg-5',
        title: 'MCST Sinking Fund & Maintenance Health',
        description: 'Examine Management Corporation Strata Title (MCST) management funds and review past AGM minutes for past en-bloc attempts or major lift retrofits.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
    ],
    calculateStampDuty: (price: number, isForeignBuyer = false, isFirstTimeBuyer = false) => {
      let bsd = 0;
      const breakdown: string[] = [];

      // BSD 2024 tiers:
      // First 180k @ 1%
      const t1 = Math.min(price, 180000);
      bsd += t1 * 0.01;
      breakdown.push(`First S$ 180,000 @ 1%: S$ ${(t1 * 0.01).toLocaleString()}`);

      // Next 180k (180k-360k) @ 2%
      if (price > 180000) {
        const t2 = Math.min(price - 180000, 180000);
        bsd += t2 * 0.02;
        breakdown.push(`Next S$ 180,000 @ 2%: S$ ${(t2 * 0.02).toLocaleString()}`);
      }

      // Next 640k (360k-1M) @ 3%
      if (price > 360000) {
        const t3 = Math.min(price - 360000, 640000);
        bsd += t3 * 0.03;
        breakdown.push(`Next S$ 640,000 @ 3%: S$ ${(t3 * 0.03).toLocaleString()}`);
      }

      // Next 500k (1M-1.5M) @ 4%
      if (price > 1000000) {
        const t4 = Math.min(price - 1000000, 500000);
        bsd += t4 * 0.04;
        breakdown.push(`Next S$ 500,000 @ 4%: S$ ${(t4 * 0.04).toLocaleString()}`);
      }

      // Next 1.5M (1.5M-3M) @ 5%
      if (price > 1500000) {
        const t5 = Math.min(price - 1500000, 1500000);
        bsd += t5 * 0.05;
        breakdown.push(`Next S$ 1,500,000 @ 5%: S$ ${(t5 * 0.05).toLocaleString()}`);
      }

      // Above 3M @ 6%
      if (price > 3000000) {
        const t6 = price - 3000000;
        bsd += t6 * 0.06;
        breakdown.push(`Portion above S$ 3,000,000 @ 6%: S$ ${(t6 * 0.06).toLocaleString()}`);
      }

      let absd = 0;
      if (isForeignBuyer) {
        absd = price * 0.60;
        breakdown.push(`Foreign Buyer ABSD @ 60%: S$ ${absd.toLocaleString()}`);
      } else if (!isFirstTimeBuyer) {
        absd = price * 0.20;
        breakdown.push(`Citizen 2nd Property ABSD @ 20%: S$ ${absd.toLocaleString()}`);
      }

      const totalDuty = bsd + absd;
      const legalFees = 3000;
      breakdown.push(`Conveyancing Legal Fee Estimate: S$ ${legalFees.toLocaleString()}`);

      return {
        stampDuty: totalDuty,
        legalFeesEstimate: legalFees,
        breakdown,
      };
    },
  },
  India: {
    code: 'India',
    name: 'India (Karnataka / Bengaluru Urban)',
    currency: 'INR',
    currencySymbol: '₹',
    regulators: [
      'Real Estate Regulatory Authority (RERA)',
      'Sub-Registrar Office (Inspector General of Registration)',
      'Bruhat Bengaluru Mahanagara Palike (BBMP) / BDA',
      'Reserve Bank of India (RBI / FEMA NRI Guidelines)',
    ],
    titleTypes: ['Freehold Title (A-Khata)', 'Freehold Title (B-Khata / Unregularized)', 'Leasehold 99-year'],
    maxStandardDsr: 50,
    stampDutySummary: 'Stamp duty 5% + Cess & Surcharges (total approx 5.6%) + 1% Registration fee in Karnataka. GST 5% on under-construction non-affordable units.',
    foreignBuyerRules: 'NRIs and OCIs can purchase residential and commercial property freely under FEMA guidelines. Foreign nationals of non-Indian origin cannot buy without RBI prior permission.',
    defaultChecklist: [
      {
        id: 'in-1',
        title: 'RERA Registration & Project Order Scrutiny',
        description: 'Verify RERA number on the official Karnataka RERA portal, confirm sanctioned floor plans and committed completion dates.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'in-2',
        title: '30-Year Encumbrance Certificate (EC Form 15)',
        description: 'Obtain Form 15 nil-encumbrance certificate covering minimum 30 years to verify complete title lineage and no unpaid bank hypothecations.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'in-3',
        title: 'A-Khata vs B-Khata Verification & Property Tax Receipts',
        description: 'Confirm property holds an authentic A-Khata extract from BBMP with fully paid property tax receipts (SAS challans).',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'in-4',
        title: 'Occupancy Certificate (OC) & Commencement Certificate (CC)',
        description: 'Inspect BBMP/BDA sanctioned plan, Commencement Certificate, and final Occupancy Certificate (OC) confirming no plan deviation exceeding 5%.',
        status: 'action_needed',
        critical: true,
        notes: '',
      },
      {
        id: 'in-5',
        title: 'NOC from Pollution Control, Fire & Airport Authorities',
        description: 'Ensure master NOCs from Karnataka State Pollution Control Board (KSPCB), Fire Department, and Airports Authority of India (AAI height clearance).',
        status: 'action_needed',
        critical: false,
        notes: '',
      },
    ],
    calculateStampDuty: (price: number, isForeignBuyer = false, isFirstTimeBuyer = false) => {
      // Karnataka: 5% stamp duty + 10% cess on duty + 2% surcharge on duty in urban areas = 5.6%
      const stampDuty = Math.round(price * 0.056);
      const registrationFee = Math.round(price * 0.01);
      const legalFees = 45000;

      const breakdown = [
        `Stamp Duty with Cess (5.6%): ₹ ${stampDuty.toLocaleString('en-IN')}`,
        `Registration Fee (1.0%): ₹ ${registrationFee.toLocaleString('en-IN')}`,
        `Title Lawyer & EC Scrutiny Fees: ₹ ${legalFees.toLocaleString('en-IN')}`,
      ];

      return {
        stampDuty: stampDuty + registrationFee,
        legalFeesEstimate: legalFees,
        breakdown,
      };
    },
  },
};
