import { Check, X } from 'lucide-react'

type LoanKind = 'housing' | 'apartment' | 'land' | 'vehicle' | 'agriculture'

type FlowStep = {
  description: string
  active: boolean
  completed: boolean
  title: string
}

const baseRequiredApplicationFields = [
  'loanType',
  'requested_amount',
  'requested_amount_words',
  'purpose',
  'repayment_period_years',
  'loan_tenure_start_date',
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
  'email',
  'father_name',
  'grandfather_name',
  'dependents_parents',
  'dependents_children',
  'occupation',
  'company_name',
  'work_address',
  'years_there',
  'deposit_nmb',
  'deposit_other_bank',
  'shares_bonds',
  'assets_land_building',
  'assets_vehicle',
  'furniture_appliances',
  'loan_nmb',
  'loan_other_bank',
  'rent',
  'total_income',
  'living_expenses',
  'net_disposable_income',
  'declaration_truth',
  'declaration_authorization',
] as const

const loanSpecificRequiredApplicationFields: Record<LoanKind, readonly string[]> = {
  housing: [
    'property_address',
    'land_area',
    'built_up_area',
    'no_of_floors',
    'ownership_type',
    'estimated_property_value',
  ],
  apartment: [
    'project_name',
    'unit_no',
    'floor_no',
    'apartment_built_up_area',
    'apartment_ownership_type',
    'estimated_apartment_value',
  ],
  land: [
    'kitta_no',
    'land_location',
    'land_area_land',
    'road_access',
    'land_ownership_type',
    'intended_use',
    'estimated_market_value',
  ],
  vehicle: [
    'vehicle_type',
    'vehicle_model',
    'vehicle_year',
    'vehicle_seller',
    'vehicle_invoice_no',
    'vehicle_purchase_price',
    'vehicle_down_payment',
    'vehicle_loan_amount',
  ],
  agriculture: [
    'farm_project_name',
    'crop_activity_type',
    'agri_land_area',
    'agri_land_location',
    'agri_ownership_type',
    'irrigation_source',
    'agri_project_cost',
  ],
}

function hasRequiredValue(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== '' && value !== 'false'
}

export function isApplicationComplete(draft: Record<string, string>, loanKind: LoanKind): boolean {
  return [...baseRequiredApplicationFields, ...loanSpecificRequiredApplicationFields[loanKind]].every((field) =>
    hasRequiredValue(draft[field]),
  )
}

export function FlowCheckpointTrail({
  subtitle,
  steps,
  title = 'Application checkpoints',
}: {
  subtitle: string
  steps: FlowStep[]
  title?: string
}) {
  return (
    <section className="form-section flow-section">
      <div className="section-head">
        <div className="section-title">
          <Check size={18} className="feature-icon" />
          <div>
            <h2>{title}</h2>
            <p className="muted">{subtitle}</p>
          </div>
        </div>
      </div>

      <ol className="flow-list is-horizontal">
        {steps.map((step, index) => {
          return (
            <li
              key={step.title}
              className={`flow-item ${step.completed ? 'is-done' : step.active ? 'is-current' : 'is-incomplete'}`}
              aria-current={step.active ? 'step' : undefined}
            >
              <span className="flow-marker">
                <span className="flow-marker-value">{step.completed ? <Check size={14} /> : index + 1}</span>
                {!step.completed ? (
                  <span className="flow-marker-cross" aria-hidden="true">
                    <X size={10} />
                  </span>
                ) : null}
              </span>
              <div className="flow-copy">
                <span className="flow-title">{step.title}</span>
                <span className="flow-description">{step.description}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
