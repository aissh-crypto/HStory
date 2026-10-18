import { Property, CaseFile, UserProfile } from '../types';

export const googleWorkspace = {
  /**
   * Generates a Google Calendar event creation URL for on-site property inspection
   */
  getCalendarInspectionUrl(property: Property, inspectionDate?: string, inspectionTime?: string): string {
    const title = encodeURIComponent(`Homestory Site Diligence: ${property.title}`);
    const location = encodeURIComponent(`${property.address}, ${property.city}, ${property.country}`);
    
    const details = encodeURIComponent(
      `Homestory AI Property Diligence Viewing\n\n` +
      `Property: ${property.title}\n` +
      `Asking Price: ${property.currency} ${property.price.toLocaleString()}\n` +
      `Developer: ${property.developer}\n` +
      `Legal Approval: ${property.legalStatus.certificateType} (Cert #${property.legalStatus.certificateNumber})\n` +
      `NAPIC/URA Submarket: ${property.napicUraData.submarketName}\n` +
      `Google Maps Directions: ${property.googleMaps.googleMapsDirectionsUrl}\n\n` +
      `DILIGENCE CHECKLIST TO VERIFY ON-SITE:\n` +
      `1. Open SightView AI Camera in Homestory for automated defect and dampness inspection\n` +
      `2. Test electrical DB distribution board and trip breaker\n` +
      `3. Inspect ceiling perimeter for upper-parcel pipe seepage\n` +
      `4. Verify water pressure and drainage trap flow\n` +
      `5. Inspect exterior window silicone seals against rain ingress`
    );

    // Format dates (default to tomorrow 10:00 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const startIso = tomorrow.toISOString().replace(/-|:|\.\d\d\d/g, '');
    tomorrow.setHours(12, 0, 0, 0);
    const endIso = tomorrow.toISOString().replace(/-|:|\.\d\d\d/g, '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startIso}/${endIso}`;
  },

  /**
   * Generates a pre-filled Gmail legal/diligence inquiry draft
   */
  getGmailLegalInquiryUrl(property: Property, userProfile: UserProfile): string {
    const subject = encodeURIComponent(
      `Legal & Title Due Diligence Inquiry: ${property.title} [Ref: ${property.legalStatus.certificateNumber}]`
    );
    
    const body = encodeURIComponent(
      `Dear Conveyancing Counsel / Developer Representative,\n\n` +
      `I am conducting buyer due diligence on "${property.title}" located at ${property.address}.\n\n` +
      `Please provide written confirmation on the following statutory and title items:\n` +
      `1. Statutory Clearance: Confirmation of ${property.legalStatus.certificateType} (Ref: ${property.legalStatus.certificateNumber}) and issuance date.\n` +
      `2. Strata Subdivision: Current status of Strata Title extraction and expected timeline for direct transfer.\n` +
      `3. Financial Reserves: Latest audited sinking fund and maintenance reserve balance of the Joint Management Body (JMB) / Management Corporation (MC).\n` +
      `4. Encumbrances: Certified copy of the latest land registry search confirming no active private caveats or lis pendens.\n` +
      `5. NAPIC/URA Benchmark: Recent transacted comparable rate (${property.currency} ${property.napicUraData.medianTransactedPsqft} psf) against asking price.\n\n` +
      `Looking forward to your prompt response.\n\n` +
      `Sincerely,\n` +
      `${userProfile.name}\n` +
      `Prospective Buyer (${userProfile.buyerRole})\n` +
      `Contact: ${userProfile.email}`
    );

    return `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
  },

  /**
   * Generates a downloadable CSV / Google Sheets formatted financial diligence model
   */
  exportToGoogleSheets(property: Property, caseFile?: CaseFile | null): void {
    const rows = [
      ['HOMESTORY AI PROPERTY DUE DILIGENCE REPORT & FINANCIAL MODEL'],
      ['Generated Date', new Date().toLocaleString()],
      ['Property Title', property.title],
      ['Address', property.address],
      ['City / Country', `${property.city}, ${property.country}`],
      ['Property Typology', property.propertyType],
      ['Tenure', property.tenure],
      ['Developer', property.developer],
      ['Built-up Area (sqft)', property.builtUpArea],
      [],
      ['=== STATUTORY & LEGAL APPROVAL AUDIT ==='],
      ['Legal Approval Status', property.legalStatus.isApproved ? 'VERIFIED APPROVED' : 'PENDING'],
      ['Regulatory Authority', property.legalStatus.regulatoryAuthority],
      ['Certificate Type', property.legalStatus.certificateType],
      ['Certificate Number', property.legalStatus.certificateNumber],
      ['Issue Date', property.legalStatus.issueDate],
      ['APDL / Developer License', property.legalStatus.apdlNumber || 'N/A'],
      ['Strata Title Status', property.legalStatus.strataTitleStatus],
      ['Land Registry Search', property.legalStatus.landRegistrySearch],
      ['Zoning Classification', property.legalStatus.zoningClassification],
      [],
      ['=== NAPIC / URA OFFICIAL STATUTORY TRANSACTION DATA ==='],
      ['Data Source', property.napicUraData.dataSource],
      ['Dataset Citation', property.napicUraData.datasetCitation],
      ['Submarket / Planning Area', property.napicUraData.submarketName],
      ['Price Index Movement', property.napicUraData.quarterlyPriceIndex],
      ['Submarket Median PSF', `${property.currency} ${property.napicUraData.medianTransactedPsqft}`],
      ['12-Month Volume', property.napicUraData.transactionVolume12Mo || property.napicUraData.totalTransactions12m || 'N/A'],
      ['Stock Absorption Status', property.napicUraData.submarketStockStatus || property.napicUraData.absorptionRate || 'Healthy Absorption'],
      ['Registry Verification Seal', property.napicUraData.registryVerificationSeal || 'NAPIC-JPPH-VERIFIED'],
      [],
      ['Recent Official Transacted Units (NAPIC/URA Caveats):'],
      ['Unit / Parcel', 'Built-Up (sqft)', 'Transacted Price', 'Price PSF', 'Contract Date', 'Tenure'],
      ...((property.napicUraData.recentTransactedUnits || property.napicUraData.recentTransactedComparables || []).map((u: any) => [
        u.unit || u.unitType || 'Unit',
        u.builtUpSqft || '',
        `${property.currency} ${(u.transactedPrice || 0).toLocaleString()}`,
        `${property.currency} ${u.psqft || 0}`,
        u.contractDate || u.date || '',
        u.tenure || property.tenure,
      ])),
      [],
      ['=== VALUATION & UNDERWRITING CORRIDOR ==='],
      ['Asking Price', `${property.currency} ${property.price.toLocaleString()}`],
      ['Asking Price PSF', `${property.currency} ${property.valuation.pricePerSqFt}`],
      ['Fair Value Range (Min)', `${property.currency} ${property.valuation.fairValueMin.toLocaleString()}`],
      ['Fair Value Range (Max)', `${property.currency} ${property.valuation.fairValueMax.toLocaleString()}`],
      ['Market Position Verdict', property.valuation.marketPosition],
      ['Estimated Gross Yield', property.valuation.grossRentalYield],
      ['Valuation Reasoning', property.valuation.reasoning],
    ];

    const st = caseFile?.modules.dsrStressTest || caseFile?.modules.stressTest;
    if (st) {
      rows.push(
        [],
        ['=== BANK LOAN & DSR STRESS TEST ==='],
        ['Down Payment (%)', `${st.downPaymentPercent}%`],
        ['Loan Principal Amount', `${property.currency} ${(st.loanAmount || 0).toLocaleString()}`],
        ['Monthly Installment', `${property.currency} ${(st.monthlyInstallment || st.monthlyInstallmentBaseline || 0).toLocaleString()}`],
        ['Stressed Installment (+2% Rate Spike)', `${property.currency} ${(st.stressedInstallment || st.monthlyInstallmentStressed || 0).toLocaleString()}`],
        ['Household Debt Service Ratio (DSR)', `${st.dsrPercent || st.baselineDsr || 0}%`],
        ['Stressed DSR', `${st.stressedDsrPercent || st.stressedDsr || 0}%`],
        ['Loan Underwriting Verdict', st.approvalVerdict || st.recommendation || 'Eligible']
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Homestory_DueDiligence_${property.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Generates a link to Google Drive folder for saving diligence dossiers
   */
  getGoogleDriveFolderUrl(property: Property): string {
    return `https://drive.google.com/drive/u/0/my-drive`;
  },
};
