type LoanType = 'housing' | 'apartment' | 'land' | 'vehicle' | 'agriculture'

export type LoanDraft = Record<string, string>

const TEST_LOAN_TYPE: LoanType = 'vehicle'

const TEST_DRAFT: LoanDraft = {
  loanType: TEST_LOAN_TYPE,
  requested_amount: '2500000',
  requested_amount_words: 'Two million five hundred thousand Nepalese rupees',
  purpose: 'Vehicle purchase',
  repayment_period_years: '5',
  loan_tenure_start_date: '2026-05-13',
  applicant_name: 'Prajesh',
  dob_or_establishment: '1998-01-01',
  calendar_type: 'A.D.',
  permanent_house_no: '12',
  ward_no: '5',
  street_name: 'Main Road',
  city: 'Kathmandu',
  district: 'Kathmandu',
  po_box: '44600',
  telephone_office: '01-5555555',
  telephone_residence: '01-4444444',
  mobile: '98XXXXXXXX',
  fax: '',
  email: 'prajesh@example.com',
  father_name: 'Ram Bahadur',
  grandfather_name: 'Hari Bahadur',
  spouse_name: 'Sita',
  dependents_parents: '2',
  dependents_children: '1',
  occupation: 'Service',
  company_name: 'ACLO Demo Pvt. Ltd.',
  work_address: 'Kathmandu',
  years_there: '3',
  property_address: '',
  land_area: '',
  built_up_area: '',
  no_of_floors: '',
  ownership_type: '',
  estimated_property_value: '',
  developer_contractor: '',
  project_name: '',
  unit_no: '',
  floor_no: '',
  apartment_built_up_area: '',
  parking_slot: '',
  apartment_ownership_type: '',
  estimated_apartment_value: '',
  expected_handover_date: '',
  kitta_no: '',
  land_location: '',
  land_area_land: '',
  road_access: '',
  land_ownership_type: '',
  intended_use: '',
  estimated_market_value: '',
  vehicle_type: 'Car',
  vehicle_model: 'Toyota Corolla',
  vehicle_year: '2024',
  vehicle_seller: 'Authorized dealer',
  vehicle_invoice_no: 'INV-2026-001',
  vehicle_purchase_price: '3500000',
  vehicle_down_payment: '1000000',
  vehicle_loan_amount: '2500000',
  vehicle_chassis_no: 'CHS-TEST-001',
  vehicle_engine_no: 'ENG-TEST-001',
  vehicle_registration_no: '',
  farm_project_name: '',
  crop_activity_type: '',
  agri_land_area: '',
  agri_land_location: '',
  agri_ownership_type: '',
  irrigation_source: '',
  farm_equipment: '',
  agri_project_cost: '',
  harvest_cycle: '',
  cash_margin: '250000',
  guarantee_of: 'Guarantor Name',
  other_security: '',
  years_at_current_residence: '4',
  deposit_nmb: '100000',
  deposit_other_bank: '50000',
  shares_bonds: '20000',
  assets_land_building: '0',
  assets_vehicle: 'Toyota 2020',
  furniture_appliances: '30000',
  other_assets: '',
  loan_nmb: '0',
  loan_other_bank: '0',
  loan_employer: '',
  credit_card_limit: '',
  loan_other_sources: '',
  rent: '15000',
  land_building_tax: '',
  income_tax: '',
  total_income: '120000',
  living_expenses: '50000',
  net_disposable_income: '70000',
  declaration_truth: 'true',
  declaration_authorization: 'true',
  declaration_date: '2026-05-13',
  signature_name: 'Prajesh',
}

export function getTestDraft(): LoanDraft {
  return { ...TEST_DRAFT }
}

export async function buildTestPdfFile(name: string): Promise<File> {
  const bytes = new TextEncoder().encode(`%PDF-1.4\n% Test file for ${name}\n%%EOF`)
  return new File([bytes], name, { type: 'application/pdf' })
}

export async function getTestDocumentFiles(documentTitles: string[]): Promise<Record<string, File>> {
  const entries = await Promise.all(
    documentTitles.map(async (title) => [title, await buildTestPdfFile(`${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`)] as const),
  )
  return Object.fromEntries(entries)
}

export function getTestLoanType(): LoanType {
  return TEST_LOAN_TYPE
}
