export type LoanType = 'housing' | 'apartment' | 'land' | 'vehicle' | 'agriculture'

export type LoanDraft = Record<string, string>

export type LoanDraftSectionKey =
  | 'loan_request'
  | 'applicant_details'
  | 'employment'
  | 'security'
  | 'financial_position'
  | 'declarations'
  | 'other'

export type SectionedLoanDraft = Record<LoanDraftSectionKey, LoanDraft>

export type LoanApplicationPayload = {
  schema_version: 1
  loan_type: LoanType
  sections: SectionedLoanDraft
}

export const DRAFT_STORAGE_KEY = 'aclo-loan-draft'

const loanRequestFields = [
  'loanType',
  'requested_amount',
  'requested_amount_words',
  'purpose',
  'repayment_period_years',
  'loan_tenure_start_date',
] as const

const applicantDetailFields = [
  'applicant_name',
  'dob_or_establishment',
  'calendar_type',
  'permanent_house_no',
  'ward_no',
  'street_name',
  'city',
  'district',
  'po_box',
  'telephone_office',
  'telephone_residence',
  'mobile',
  'fax',
  'email',
  'father_name',
  'grandfather_name',
  'spouse_name',
  'dependents_parents',
  'dependents_children',
] as const

const employmentFields = [
  'occupation',
  'company_name',
  'work_address',
  'years_there',
  'previous_employer',
  'business_nature',
] as const

const securityFields = [
  'property_address',
  'land_area',
  'built_up_area',
  'no_of_floors',
  'ownership_type',
  'estimated_property_value',
  'developer_contractor',
  'project_name',
  'unit_no',
  'floor_no',
  'apartment_built_up_area',
  'parking_slot',
  'apartment_ownership_type',
  'estimated_apartment_value',
  'expected_handover_date',
  'kitta_no',
  'land_location',
  'land_area_land',
  'road_access',
  'land_ownership_type',
  'intended_use',
  'estimated_market_value',
  'vehicle_type',
  'vehicle_model',
  'vehicle_year',
  'vehicle_seller',
  'vehicle_invoice_no',
  'vehicle_purchase_price',
  'vehicle_down_payment',
  'vehicle_loan_amount',
  'vehicle_chassis_no',
  'vehicle_engine_no',
  'vehicle_registration_no',
  'farm_project_name',
  'crop_activity_type',
  'agri_land_area',
  'agri_land_location',
  'agri_ownership_type',
  'irrigation_source',
  'farm_equipment',
  'agri_project_cost',
  'harvest_cycle',
  'cash_margin',
  'guarantee_of',
  'other_security',
  'years_at_current_residence',
] as const

const financialPositionFields = [
  'deposit_nmb',
  'deposit_other_bank',
  'shares_bonds',
  'assets_land_building',
  'assets_vehicle',
  'furniture_appliances',
  'other_assets',
  'loan_nmb',
  'loan_other_bank',
  'loan_employer',
  'credit_card_limit',
  'loan_other_sources',
  'rent',
  'land_building_tax',
  'income_tax',
  'total_income',
  'living_expenses',
  'net_disposable_income',
] as const

const declarationFields = [
  'declaration_truth',
  'declaration_authorization',
  'declaration_date',
  'signature_name',
] as const

const draftSectionFields: Record<Exclude<LoanDraftSectionKey, 'other'>, readonly string[]> = {
  loan_request: loanRequestFields,
  applicant_details: applicantDetailFields,
  employment: employmentFields,
  security: securityFields,
  financial_position: financialPositionFields,
  declarations: declarationFields,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sectionValuesToDraft(value: unknown): LoanDraft {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<LoanDraft>((draft, [key, fieldValue]) => {
    if (typeof fieldValue === 'string') {
      draft[key] = fieldValue
    }

    return draft
  }, {})
}

function isSectionedDraft(value: unknown): value is Partial<SectionedLoanDraft> {
  if (!isRecord(value)) {
    return false
  }

  return Object.keys(draftSectionFields).some((section) => isRecord(value[section]))
}

function pickDraftFields(draft: LoanDraft, fields: readonly string[]): LoanDraft {
  return fields.reduce<LoanDraft>((section, field) => {
    if (draft[field] !== undefined) {
      section[field] = draft[field]
    }

    return section
  }, {})
}

export function flattenSectionedDraft(sectionedDraft: Partial<SectionedLoanDraft>): LoanDraft {
  return Object.values(sectionedDraft).reduce<LoanDraft>((draft, section) => {
    return { ...draft, ...sectionValuesToDraft(section) }
  }, {})
}

export function buildSectionedDraft(draft: LoanDraft): SectionedLoanDraft {
  const groupedFields = new Set(Object.values(draftSectionFields).flat())
  const sectionedDraft: SectionedLoanDraft = {
    loan_request: pickDraftFields(draft, draftSectionFields.loan_request),
    applicant_details: pickDraftFields(draft, draftSectionFields.applicant_details),
    employment: pickDraftFields(draft, draftSectionFields.employment),
    security: pickDraftFields(draft, draftSectionFields.security),
    financial_position: pickDraftFields(draft, draftSectionFields.financial_position),
    declarations: pickDraftFields(draft, draftSectionFields.declarations),
    other: {},
  }

  Object.entries(draft).forEach(([field, value]) => {
    if (!groupedFields.has(field)) {
      sectionedDraft.other[field] = value
    }
  })

  return sectionedDraft
}

export function parseStoredLoanDraft(value: unknown): LoanDraft {
  return isSectionedDraft(value) ? flattenSectionedDraft(value) : sectionValuesToDraft(value)
}

export function readStoredLoanDraft(): LoanDraft {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    return raw ? parseStoredLoanDraft(JSON.parse(raw) as unknown) : {}
  } catch {
    return {}
  }
}

export function readStoredLoanType(): LoanType | null {
  const draft = readStoredLoanDraft()
  const loanType = draft.loanType

  return loanType === 'housing' ||
    loanType === 'apartment' ||
    loanType === 'land' ||
    loanType === 'vehicle' ||
    loanType === 'agriculture'
    ? loanType
    : null
}

export function buildLoanApplicationPayload(draft: LoanDraft, loanType: LoanType): LoanApplicationPayload {
  return {
    schema_version: 1,
    loan_type: loanType,
    sections: buildSectionedDraft({ ...draft, loanType }),
  }
}
