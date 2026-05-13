import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BadgeInfo, BriefcaseBusiness, FileText, Landmark, Loader2, MapPin, ShieldCheck, User, WalletCards } from 'lucide-react'
import { FlowCheckpointTrail, isApplicationComplete } from './loan-flow'
import { getTestDraft } from './loan-test-data'

type LoanType = 'housing' | 'apartment' | 'land' | 'vehicle' | 'agriculture'

type LoanDraft = Record<string, string>

const DRAFT_STORAGE_KEY = 'aclo-loan-draft'

const nepalDistricts = [
  'Achham',
  'Arghakhanchi',
  'Baglung',
  'Baitadi',
  'Bajhang',
  'Bajura',
  'Banke',
  'Bara',
  'Bardiya',
  'Bhaktapur',
  'Bhojpur',
  'Chitwan',
  'Dadeldhura',
  'Dailekh',
  'Dang',
  'Darchula',
  'Dhading',
  'Dhankuta',
  'Dhanusha',
  'Dolakha',
  'Dolpa',
  'Doti',
  'Gorkha',
  'Gulmi',
  'Humla',
  'Ilam',
  'Jajarkot',
  'Jumla',
  'Jhapa',
  'Kailali',
  'Kalikot',
  'Kanchanpur',
  'Kapilvastu',
  'Kaski',
  'Kathmandu',
  'Kavrepalanchok',
  'Khotang',
  'Lalitpur',
  'Lamjung',
  'Mahottari',
  'Makwanpur',
  'Manang',
  'Morang',
  'Mugu',
  'Mustang',
  'Myagdi',
  'Nawalparasi East',
  'Nawalparasi West',
  'Nuwakot',
  'Okhaldhunga',
  'Palpa',
  'Panchthar',
  'Parbat',
  'Parsa',
  'Pyuthan',
  'Ramechhap',
  'Rasuwa',
  'Rautahat',
  'Rolpa',
  'Rukum East',
  'Rukum West',
  'Rupandehi',
  'Salyan',
  'Sankhuwasabha',
  'Saptari',
  'Sarlahi',
  'Sindhuli',
  'Sindhupalchok',
  'Siraha',
  'Solukhumbu',
  'Sunsari',
  'Surkhet',
  'Syangja',
  'Tanahun',
  'Taplejung',
  'Terhathum',
  'Udayapur',
] as const

const loanTypeMeta: Record<
  LoanType,
  {
    label: string
    hero: string
    collateralTitle: string
    collateralSubtitle: string
  }
> = {
  housing: {
    label: 'Housing loan',
    hero: 'Housing loan application',
    collateralTitle: 'Housing security details',
    collateralSubtitle: 'Land, building, cash margin, and guarantor details for housing finance.',
  },
  apartment: {
    label: 'Apartment loan',
    hero: 'Apartment loan application',
    collateralTitle: 'Apartment security details',
    collateralSubtitle: 'Project, unit, and ownership details for apartment financing.',
  },
  land: {
    label: 'Land loan',
    hero: 'Land loan application',
    collateralTitle: 'Land security details',
    collateralSubtitle: 'Plot, area, access, and ownership details for land purchase financing.',
  },
  vehicle: {
    label: 'Vehicle loan',
    hero: 'Vehicle loan application',
    collateralTitle: 'Vehicle security details',
    collateralSubtitle: 'Vehicle, registration, and financing details for auto loans.',
  },
  agriculture: {
    label: 'Agricultural loan',
    hero: 'Agricultural loan application',
    collateralTitle: 'Agricultural security details',
    collateralSubtitle: 'Crop, livestock, land, irrigation, and farm equipment details.',
  },
}

function Field({
  label,
  placeholder,
  type = 'text',
  wide = false,
  optional = false,
  name,
  value,
  onChange,
  suggestions,
  className,
  textOnly = false,
}: {
  label: string
  placeholder?: string
  type?: string
  wide?: boolean
  optional?: boolean
  name?: string
  value?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  suggestions?: readonly string[]
  className?: string
  textOnly?: boolean
}) {
  const listId = suggestions?.length ? `${name ?? label.replace(/\s+/g, '-').toLowerCase()}-options` : undefined

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (textOnly) {
      // Remove any digits from the input
      const filteredValue = event.target.value.replace(/[0-9]/g, '')
      event.target.value = filteredValue
    }
    onChange?.(event)
  }

  return (
    <label className={[wide ? 'form-field form-field-wide' : 'form-field', className].filter(Boolean).join(' ')}>
      <span>
        {label}
        {optional ? <span className="field-optional">Optional</span> : null}
      </span>
      <input
        name={name}
        value={value}
        onChange={handleChange}
        type={type}
        placeholder={placeholder}
        list={listId}
      />
      {suggestions?.length ? (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </label>
  )
}

function SelectField({
  label,
  options,
  placeholder = 'Select one',
  value,
  onChange,
  name,
  className,
}: {
  label: string
  options: string[]
  placeholder?: string
  value?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  name?: string
  className?: string
}) {
  const selectProps =
    value !== undefined
      ? { value, onChange }
      : {
          defaultValue: '',
          onChange,
        }

  return (
    <label className={['form-field', className].filter(Boolean).join(' ')}>
      <span>{label}</span>
      <select name={name} {...selectProps}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function NepalCityField({
  value,
  onSelect,
  onChange,
}: {
  value: string
  onSelect: (city: string) => void
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const query = value.trim()

    if (query.length < 3) {
      setSuggestions([])
      setLoading(false)
      setOpen(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setOpen(true)
    const timeout = window.setTimeout(() => {
      void fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=50&dedupe=1&countrycodes=np&layer=address&q=${encodeURIComponent(`${query} Nepal`)}`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        },
      )
        .then((response) => response.json() as Promise<Array<{ address?: { city?: string; town?: string; village?: string }; display_name?: string }>>)
        .then((results) => {
          const nextSuggestions = Array.from(
            new Set(
              results
                .map((result) => result.address?.city ?? result.address?.town ?? result.address?.village ?? result.display_name?.split(',')[0]?.trim())
                .filter((item): item is string => Boolean(item)),
            ),
          )
          const normalizedQuery = query.toLowerCase().replace(/\s+/g, '')
          setSuggestions(
            nextSuggestions.filter((city) =>
              city.toLowerCase().replace(/\s+/g, '').startsWith(normalizedQuery),
            ),
          )
          setLoading(false)
          setOpen(true)
        })
        .catch(() => {
          setSuggestions([])
          setLoading(false)
          setOpen(false)
        })
    }, 1000)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [value])

  return (
    <div className="form-field form-field-wide city-search district-search">
      <span>City</span>
      <div className="city-search-input">
        <input
          name="city"
          value={value}
          onChange={onChange}
          type="text"
          placeholder="Type at least 3 letters to search cities in Nepal"
        />
        {open && value.trim().length >= 3 ? (
          <div className="city-results city-results-overlay" aria-live="polite">
            {loading ? (
              [1, 2, 3, 4].map((index) => (
                <div className="city-skeleton" key={index}>
                  <Loader2 size={14} className="city-skeleton-icon" />
                  <span className="city-skeleton-line" />
                </div>
              ))
            ) : suggestions.length ? (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className={`city-result ${suggestion === value ? 'is-selected' : ''}`}
                  type="button"
                  onClick={() => {
                    onSelect(suggestion)
                    setOpen(false)
                  }}
                >
                  <MapPin size={14} />
                  <span>{suggestion}</span>
                </button>
              ))
            ) : (
              <div className="city-empty-state">No Nepal city matches found for "{value}".</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof FileText
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="form-section">
      <div className="section-head">
        <div className="section-title">
          <Icon size={18} className="feature-icon" />
          <div>
            <h2>{title}</h2>
            <p className="muted">{subtitle}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  )
}

function readDraft(): LoanDraft {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LoanDraft) : {}
  } catch {
    return {}
  }
}

export function HousingLoanFormPage() {
  const [draft, setDraft] = useState<LoanDraft>(() => readDraft())
  const loanType = (draft.loanType as LoanType | undefined) ?? 'housing'
  const loanMeta = loanTypeMeta[loanType]
  const applicationComplete = isApplicationComplete(draft, loanType)
  const flowSteps = [
    {
      title: '1. Fill application',
      description: 'Enter borrower details, loan purpose, and the selected loan-specific fields.',
      active: true,
      completed: applicationComplete,
    },
    {
      title: '2. Upload documents',
      description: 'Open the documents page and attach the required PDF files.',
      active: false,
      completed: false,
    },
    {
      title: '3. Submit application',
      description: 'Review the draft and submit only after uploads are complete.',
      active: false,
      completed: false,
    },
  ]

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // Ignore storage failures and keep the form usable.
    }
  }, [draft])

  const setDraftField = (name: string, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }))
  }

  const prefillTestData = () => {
    setDraft(getTestDraft())
  }

  const renderLoanSpecificFields = () => {
    switch (loanType) {
      case 'housing':
        return (
          <div className="form-grid three-up">
            <Field label="Property address" placeholder="Kathmandu / Lalitpur / Bhaktapur" wide name="property_address" value={draft.property_address ?? ''} onChange={(event) => setDraftField('property_address', event.target.value)} />
            <Field label="Land area" placeholder="10 anna / sq.ft." name="land_area" value={draft.land_area ?? ''} onChange={(event) => setDraftField('land_area', event.target.value)} />
            <Field label="Built-up area" placeholder="2,100 sq.ft." name="built_up_area" value={draft.built_up_area ?? ''} onChange={(event) => setDraftField('built_up_area', event.target.value)} />
            <Field label="No. of floors" placeholder="2" type="number" name="no_of_floors" value={draft.no_of_floors ?? ''} onChange={(event) => setDraftField('no_of_floors', event.target.value)} />
            <SelectField
              label="Ownership type"
              options={['Self-owned', 'Joint ownership', 'Family property', 'To be acquired']}
              name="ownership_type"
              value={draft.ownership_type ?? ''}
              onChange={(event) => setDraftField('ownership_type', event.target.value)}
            />
            <Field label="Estimated property value" placeholder="5,500,000" type="number" name="estimated_property_value" value={draft.estimated_property_value ?? ''} onChange={(event) => setDraftField('estimated_property_value', event.target.value)} />
            <Field label="Developer / contractor" placeholder="Builder name" wide optional name="developer_contractor" value={draft.developer_contractor ?? ''} onChange={(event) => setDraftField('developer_contractor', event.target.value)} />
          </div>
        )
      case 'apartment':
        return (
          <div className="form-grid three-up">
            <Field label="Project / building name" placeholder="Apartment project name" wide name="project_name" value={draft.project_name ?? ''} onChange={(event) => setDraftField('project_name', event.target.value)} />
            <Field label="Unit / flat no." placeholder="A-402" name="unit_no" value={draft.unit_no ?? ''} onChange={(event) => setDraftField('unit_no', event.target.value)} />
            <Field label="Floor no." placeholder="4" type="number" name="floor_no" value={draft.floor_no ?? ''} onChange={(event) => setDraftField('floor_no', event.target.value)} />
            <Field label="Built-up area" placeholder="1,250 sq.ft." name="apartment_built_up_area" value={draft.apartment_built_up_area ?? ''} onChange={(event) => setDraftField('apartment_built_up_area', event.target.value)} />
            <Field label="Parking slot" placeholder="P-21" optional name="parking_slot" value={draft.parking_slot ?? ''} onChange={(event) => setDraftField('parking_slot', event.target.value)} />
            <SelectField
              label="Ownership type"
              options={['Under construction', 'Ready to move', 'Resale', 'Pre-launch']}
              name="apartment_ownership_type"
              value={draft.apartment_ownership_type ?? ''}
              onChange={(event) => setDraftField('apartment_ownership_type', event.target.value)}
            />
            <Field label="Estimated apartment value" placeholder="8,500,000" type="number" name="estimated_apartment_value" value={draft.estimated_apartment_value ?? ''} onChange={(event) => setDraftField('estimated_apartment_value', event.target.value)} />
            <Field label="Expected handover date" placeholder="YYYY-MM-DD" type="date" optional name="expected_handover_date" value={draft.expected_handover_date ?? ''} onChange={(event) => setDraftField('expected_handover_date', event.target.value)} />
          </div>
        )
      case 'land':
        return (
          <div className="form-grid three-up">
            <Field label="Plot / kitta no." placeholder="1024" name="kitta_no" value={draft.kitta_no ?? ''} onChange={(event) => setDraftField('kitta_no', event.target.value)} />
            <Field label="Land location" placeholder="Ward / municipality / district" wide name="land_location" value={draft.land_location ?? ''} onChange={(event) => setDraftField('land_location', event.target.value)} />
            <Field label="Area of land" placeholder="8 anna / 0.5 ropani" name="land_area_land" value={draft.land_area_land ?? ''} onChange={(event) => setDraftField('land_area_land', event.target.value)} />
            <Field label="Road access" placeholder="12 ft road / 20 ft road" name="road_access" value={draft.road_access ?? ''} onChange={(event) => setDraftField('road_access', event.target.value)} />
            <SelectField
              label="Ownership type"
              options={['Registered land', 'In process', 'Family inheritance', 'Joint ownership']}
              name="land_ownership_type"
              value={draft.land_ownership_type ?? ''}
              onChange={(event) => setDraftField('land_ownership_type', event.target.value)}
            />
            <Field label="Intended use" placeholder="Residential / investment / future construction" wide name="intended_use" value={draft.intended_use ?? ''} onChange={(event) => setDraftField('intended_use', event.target.value)} />
            <Field label="Estimated market value" placeholder="4,000,000" type="number" name="estimated_market_value" value={draft.estimated_market_value ?? ''} onChange={(event) => setDraftField('estimated_market_value', event.target.value)} />
          </div>
        )
      case 'vehicle':
        return (
          <div className="form-grid three-up">
            <Field label="Vehicle type" placeholder="Car / SUV / Bike" name="vehicle_type" value={draft.vehicle_type ?? ''} onChange={(event) => setDraftField('vehicle_type', event.target.value)} />
            <Field label="Make / model" placeholder="Toyota Corolla" name="vehicle_model" value={draft.vehicle_model ?? ''} onChange={(event) => setDraftField('vehicle_model', event.target.value)} />
            <Field label="Year" placeholder="2022" type="number" name="vehicle_year" value={draft.vehicle_year ?? ''} onChange={(event) => setDraftField('vehicle_year', event.target.value)} />
            <Field label="Dealer / seller" placeholder="Authorized dealer name" wide name="vehicle_seller" value={draft.vehicle_seller ?? ''} onChange={(event) => setDraftField('vehicle_seller', event.target.value)} />
            <Field label="Quotation / proforma invoice no." placeholder="Invoice reference" name="vehicle_invoice_no" value={draft.vehicle_invoice_no ?? ''} onChange={(event) => setDraftField('vehicle_invoice_no', event.target.value)} />
            <Field label="Purchase price" placeholder="3,500,000" type="number" name="vehicle_purchase_price" value={draft.vehicle_purchase_price ?? ''} onChange={(event) => setDraftField('vehicle_purchase_price', event.target.value)} />
            <Field label="Down payment" placeholder="1,000,000" type="number" name="vehicle_down_payment" value={draft.vehicle_down_payment ?? ''} onChange={(event) => setDraftField('vehicle_down_payment', event.target.value)} />
            <Field label="Loan amount requested" placeholder="2,500,000" type="number" name="vehicle_loan_amount" value={draft.vehicle_loan_amount ?? ''} onChange={(event) => setDraftField('vehicle_loan_amount', event.target.value)} />
            <Field label="Chassis no." placeholder="Available from invoice / vehicle record" wide optional name="vehicle_chassis_no" value={draft.vehicle_chassis_no ?? ''} onChange={(event) => setDraftField('vehicle_chassis_no', event.target.value)} />
            <Field label="Engine no." placeholder="Available from invoice / vehicle record" wide optional name="vehicle_engine_no" value={draft.vehicle_engine_no ?? ''} onChange={(event) => setDraftField('vehicle_engine_no', event.target.value)} />
            <Field label="Registration no." placeholder="Optional after registration" optional wide name="vehicle_registration_no" value={draft.vehicle_registration_no ?? ''} onChange={(event) => setDraftField('vehicle_registration_no', event.target.value)} />
          </div>
        )
      case 'agriculture':
        return (
          <div className="form-grid three-up">
            <Field label="Farm / project name" placeholder="Farm name or project title" wide name="farm_project_name" value={draft.farm_project_name ?? ''} onChange={(event) => setDraftField('farm_project_name', event.target.value)} textOnly />
            <Field label="Crop / activity type" placeholder="Vegetables / dairy / poultry / greenhouse" name="crop_activity_type" value={draft.crop_activity_type ?? ''} onChange={(event) => setDraftField('crop_activity_type', event.target.value)} textOnly />
            <Field label="Land area" placeholder="Ropani / kattha / bigha" name="agri_land_area" value={draft.agri_land_area ?? ''} onChange={(event) => setDraftField('agri_land_area', event.target.value)} />
            <Field label="Land location" placeholder="Ward / municipality / district" wide name="agri_land_location" value={draft.agri_land_location ?? ''} onChange={(event) => setDraftField('agri_land_location', event.target.value)} />
            <SelectField
              label="Ownership type"
              options={['Owned land', 'Leased land', 'Shared land', 'To be acquired']}
              name="agri_ownership_type"
              value={draft.agri_ownership_type ?? ''}
              onChange={(event) => setDraftField('agri_ownership_type', event.target.value)}
            />
            <Field label="Irrigation source" placeholder="Borewell / canal / rainfed / tank" name="irrigation_source" value={draft.irrigation_source ?? ''} onChange={(event) => setDraftField('irrigation_source', event.target.value)} />
            <Field label="Farm equipment / livestock" placeholder="Tractor, cows, poultry, etc." wide optional name="farm_equipment" value={draft.farm_equipment ?? ''} onChange={(event) => setDraftField('farm_equipment', event.target.value)} />
            <Field label="Estimated project cost" placeholder="3,500,000" type="number" name="agri_project_cost" value={draft.agri_project_cost ?? ''} onChange={(event) => setDraftField('agri_project_cost', event.target.value)} />
            <Field label="Expected harvest / income cycle" placeholder="Monthly / seasonal / annual" optional name="harvest_cycle" value={draft.harvest_cycle ?? ''} onChange={(event) => setDraftField('harvest_cycle', event.target.value)} />
          </div>
        )
    }
  }

  return (
    <div className="form-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <div className="brand-name">ACLO</div>
            <div className="brand-sub">{loanMeta.label}</div>
          </div>
        </div>

        <nav className="nav-links" aria-label="Form navigation">
          <span className="nav-link active">Fill the form</span>
        </nav>
      </header>

      <main className="form-container">
        <section className="form-hero">
          <div>
            <p className="eyebrow">Application for loan</p>
            <h1>{loanMeta.hero}</h1>
            <p className="muted">
              Choose the loan type first. The collateral and asset fields below update to match the
              selected loan category.
            </p>
          </div>
          <div className="form-hero-note">
            <BadgeInfo size={18} className="feature-icon" />
            <span>Fields are generated dynamically from the selected loan type.</span>
          </div>
        </section>

        <FlowCheckpointTrail
          subtitle="The application is treated as a linked sequence rather than isolated screens."
          steps={flowSteps}
        />

        <form className="loan-form">
          <Section
            icon={Landmark}
            title="Loan Request"
            subtitle="Core request details from the first part of the application."
          >
            <div className="form-grid two-up">
              <SelectField
                label="Loan type"
                options={['Housing loan', 'Apartment loan', 'Land loan', 'Vehicle loan', 'Agricultural loan']}
                value={loanMeta.label}
                name="loan_type"
                onChange={(event) => {
                  const selected = event.target.value
                  const nextType =
                    selected === 'Apartment loan'
                      ? 'apartment'
                      : selected === 'Land loan'
                        ? 'land'
                        : selected === 'Vehicle loan'
                          ? 'vehicle'
                          : selected === 'Agricultural loan'
                            ? 'agriculture'
                          : 'housing'
                  setDraftField('loanType', nextType)
                }}
              />
              <Field label="Requested amount (NPR)" placeholder="5,000,000" type="number" name="requested_amount" value={draft.requested_amount ?? ''} onChange={(event) => setDraftField('requested_amount', event.target.value)} />
              <Field label="Amount in words" placeholder="Five million Nepalese rupees" wide name="requested_amount_words" value={draft.requested_amount_words ?? ''} onChange={(event) => setDraftField('requested_amount_words', event.target.value)} />
              <SelectField
                label="Purpose"
                options={[
                  'Purchase land',
                  'Construct house',
                  'Refinance',
                  'Apartment purchase',
                  'Vehicle purchase',
                  'Agricultural activity',
                ]}
                name="purpose"
                value={draft.purpose ?? ''}
                onChange={(event) => setDraftField('purpose', event.target.value)}
              />
              <Field label="Repayment period (years)" placeholder="15" type="number" name="repayment_period_years" value={draft.repayment_period_years ?? ''} onChange={(event) => setDraftField('repayment_period_years', event.target.value)} />
              <Field label="Loan tenure start date" placeholder="YYYY-MM-DD" type="date" name="loan_tenure_start_date" value={draft.loan_tenure_start_date ?? ''} onChange={(event) => setDraftField('loan_tenure_start_date', event.target.value)} />
            </div>
          </Section>

          <Section icon={User} title="Applicant Details" subtitle="Personal and contact information.">
            <div className="form-grid three-up">
              <Field label="Applicant name" placeholder="Prajesh" name="applicant_name" value={draft.applicant_name ?? ''} onChange={(event) => setDraftField('applicant_name', event.target.value)} textOnly />
              <Field label="Date of birth / establishment" placeholder="YYYY-MM-DD" type="date" name="dob_or_establishment" value={draft.dob_or_establishment ?? ''} onChange={(event) => setDraftField('dob_or_establishment', event.target.value)} />
              <SelectField label="Calendar type" options={['A.D.', 'B.S.']} name="calendar_type" value={draft.calendar_type ?? ''} onChange={(event) => setDraftField('calendar_type', event.target.value)} />
              <Field label="Permanent house no." placeholder="12" name="permanent_house_no" value={draft.permanent_house_no ?? ''} onChange={(event) => setDraftField('permanent_house_no', event.target.value)} />
              <Field label="Ward no." placeholder="5" name="ward_no" value={draft.ward_no ?? ''} onChange={(event) => setDraftField('ward_no', event.target.value)} />
              <Field label="Street name" placeholder="Main Road" name="street_name" value={draft.street_name ?? ''} onChange={(event) => setDraftField('street_name', event.target.value)} />
              <NepalCityField
                value={draft.city ?? ''}
                onChange={(event) => setDraftField('city', event.target.value)}
                onSelect={(city) => setDraftField('city', city)}
              />
              <SelectField
                label="District"
                options={Array.from(nepalDistricts)}
                name="district"
                value={draft.district ?? ''}
                onChange={(event) => setDraftField('district', event.target.value)}
              />
              <Field label="PO Box" placeholder="12345" name="po_box" value={draft.po_box ?? ''} onChange={(event) => setDraftField('po_box', event.target.value)} />
              <Field label="Tel: office" placeholder="01-5555555" name="telephone_office" value={draft.telephone_office ?? ''} onChange={(event) => setDraftField('telephone_office', event.target.value)} />
              <Field label="Residence" placeholder="01-4444444" name="telephone_residence" value={draft.telephone_residence ?? ''} onChange={(event) => setDraftField('telephone_residence', event.target.value)} />
              <Field label="Mobile" placeholder="98XXXXXXXX" name="mobile" value={draft.mobile ?? ''} onChange={(event) => setDraftField('mobile', event.target.value)} />
              <Field label="Fax" placeholder="Optional" optional name="fax" value={draft.fax ?? ''} onChange={(event) => setDraftField('fax', event.target.value)} />
              <Field label="Email" placeholder="name@example.com" name="email" value={draft.email ?? ''} onChange={(event) => setDraftField('email', event.target.value)} />
              <Field label="Name of father" placeholder="Father's name" name="father_name" value={draft.father_name ?? ''} onChange={(event) => setDraftField('father_name', event.target.value)} textOnly />
              <Field label="Name of grandfather" placeholder="Grandfather's name" name="grandfather_name" value={draft.grandfather_name ?? ''} onChange={(event) => setDraftField('grandfather_name', event.target.value)} textOnly />
              <Field label="Spouse's name" placeholder="Spouse's name" optional name="spouse_name" value={draft.spouse_name ?? ''} onChange={(event) => setDraftField('spouse_name', event.target.value)} textOnly />
              <Field label="Dependents (parents)" placeholder="2" type="number" name="dependents_parents" value={draft.dependents_parents ?? ''} onChange={(event) => setDraftField('dependents_parents', event.target.value)} />
              <Field label="Dependents (children)" placeholder="1" type="number" name="dependents_children" value={draft.dependents_children ?? ''} onChange={(event) => setDraftField('dependents_children', event.target.value)} />
            </div>
          </Section>

          <Section
            icon={BriefcaseBusiness}
            title="Employment and Work Address"
            subtitle="This section covers occupation, employer, and years at current location."
          >
            <div className="form-grid two-up">
              <Field label="Applicant occupation" placeholder="Service / Business / Self-employed" name="occupation" value={draft.occupation ?? ''} onChange={(event) => setDraftField('occupation', event.target.value)} textOnly />
              <Field label="Firm / company name" placeholder="Company name" name="company_name" value={draft.company_name ?? ''} onChange={(event) => setDraftField('company_name', event.target.value)} textOnly />
              <Field label="Work address" placeholder="Business address" wide name="work_address" value={draft.work_address ?? ''} onChange={(event) => setDraftField('work_address', event.target.value)} />
              <Field label="Years there" placeholder="3" type="number" name="years_there" value={draft.years_there ?? ''} onChange={(event) => setDraftField('years_there', event.target.value)} />
              <Field label="Previous employer (if any)" placeholder="Previous company" optional name="previous_employer" value={draft.previous_employer ?? ''} onChange={(event) => setDraftField('previous_employer', event.target.value)} />
              <Field
                label="Nature of business (if self employed)"
                placeholder="Retail / Manufacturing / Services"
                wide
                optional
                name="business_nature"
                value={draft.business_nature ?? ''}
                onChange={(event) => setDraftField('business_nature', event.target.value)}
              />
            </div>
          </Section>

          <Section
            icon={ShieldCheck}
            title={loanMeta.collateralTitle}
            subtitle={loanMeta.collateralSubtitle}
          >
            {renderLoanSpecificFields()}
            <div className="form-grid two-up form-section-group">
              <Field label="Cash margin (if any)" placeholder="250,000" type="number" optional name="cash_margin" value={draft.cash_margin ?? ''} onChange={(event) => setDraftField('cash_margin', event.target.value)} />
              <Field label="Personal / corporate guarantee of" placeholder="Guarantor name" optional name="guarantee_of" value={draft.guarantee_of ?? ''} onChange={(event) => setDraftField('guarantee_of', event.target.value)} textOnly />
              <Field label="Other security" placeholder="Describe any additional security" wide optional name="other_security" value={draft.other_security ?? ''} onChange={(event) => setDraftField('other_security', event.target.value)} />
              <Field label="Years at current residence" placeholder="4" type="number" optional name="years_at_current_residence" value={draft.years_at_current_residence ?? ''} onChange={(event) => setDraftField('years_at_current_residence', event.target.value)} />
            </div>
          </Section>

          <Section
            icon={WalletCards}
            title="Financial Position"
            subtitle="Assets, liabilities, and monthly income / expense details."
          >
            <div className="form-section-group">
              <h3>Assets</h3>
              <div className="form-grid three-up">
                <Field label="Deposit with NMB" placeholder="0" type="number" name="deposit_nmb" value={draft.deposit_nmb ?? ''} onChange={(event) => setDraftField('deposit_nmb', event.target.value)} />
                <Field label="Deposit with other bank" placeholder="0" type="number" name="deposit_other_bank" value={draft.deposit_other_bank ?? ''} onChange={(event) => setDraftField('deposit_other_bank', event.target.value)} />
                <Field label="Shares / bonds / debentures" placeholder="0" type="number" name="shares_bonds" value={draft.shares_bonds ?? ''} onChange={(event) => setDraftField('shares_bonds', event.target.value)} />
                <Field label="Land and / or building / flat" placeholder="0" type="number" name="assets_land_building" value={draft.assets_land_building ?? ''} onChange={(event) => setDraftField('assets_land_building', event.target.value)} />
                <Field label="Vehicles brand / year" placeholder="Toyota 2020" name="assets_vehicle" value={draft.assets_vehicle ?? ''} onChange={(event) => setDraftField('assets_vehicle', event.target.value)} />
                <Field label="Furniture & appliances" placeholder="0" type="number" name="furniture_appliances" value={draft.furniture_appliances ?? ''} onChange={(event) => setDraftField('furniture_appliances', event.target.value)} />
                <Field label="Other assets" placeholder="Describe other assets" wide optional name="other_assets" value={draft.other_assets ?? ''} onChange={(event) => setDraftField('other_assets', event.target.value)} />
              </div>
            </div>

            <div className="form-section-group">
              <h3>Liabilities</h3>
              <div className="form-grid three-up">
                <Field label="Loan from NMB" placeholder="0" type="number" name="loan_nmb" value={draft.loan_nmb ?? ''} onChange={(event) => setDraftField('loan_nmb', event.target.value)} />
                <Field label="Loan from other bank" placeholder="0" type="number" name="loan_other_bank" value={draft.loan_other_bank ?? ''} onChange={(event) => setDraftField('loan_other_bank', event.target.value)} />
                <Field label="Loan from employer" placeholder="0" type="number" optional name="loan_employer" value={draft.loan_employer ?? ''} onChange={(event) => setDraftField('loan_employer', event.target.value)} />
                <Field label="Credit card limit" placeholder="0" type="number" optional name="credit_card_limit" value={draft.credit_card_limit ?? ''} onChange={(event) => setDraftField('credit_card_limit', event.target.value)} />
                <Field label="Loan from other sources" placeholder="0" type="number" optional name="loan_other_sources" value={draft.loan_other_sources ?? ''} onChange={(event) => setDraftField('loan_other_sources', event.target.value)} />
                <Field label="Rent" placeholder="0" type="number" name="rent" value={draft.rent ?? ''} onChange={(event) => setDraftField('rent', event.target.value)} />
                <Field label="Land / building tax" placeholder="0" type="number" optional name="land_building_tax" value={draft.land_building_tax ?? ''} onChange={(event) => setDraftField('land_building_tax', event.target.value)} />
                <Field label="Income tax" placeholder="0" type="number" optional name="income_tax" value={draft.income_tax ?? ''} onChange={(event) => setDraftField('income_tax', event.target.value)} />
              </div>
            </div>

            <div className="form-section-group">
              <h3>Monthly Income / Expenses</h3>
              <div className="form-grid three-up">
                <Field label="Total income" placeholder="0" type="number" name="total_income" value={draft.total_income ?? ''} onChange={(event) => setDraftField('total_income', event.target.value)} />
                <Field label="Living expenses" placeholder="0" type="number" name="living_expenses" value={draft.living_expenses ?? ''} onChange={(event) => setDraftField('living_expenses', event.target.value)} />
                <Field label="Net disposable income" placeholder="0" type="number" name="net_disposable_income" value={draft.net_disposable_income ?? ''} onChange={(event) => setDraftField('net_disposable_income', event.target.value)} />
              </div>
            </div>
          </Section>

          <Section
            icon={FileText}
            title="Declarations"
            subtitle="Bank-use notes and applicant acknowledgements."
          >
            <div className="form-grid two-up">
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={draft.declaration_truth === 'true'}
                  onChange={(event) => setDraftField('declaration_truth', event.target.checked ? 'true' : 'false')}
                />
                <span>I confirm the details provided are true and complete.</span>
              </label>
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={draft.declaration_authorization === 'true'}
                  onChange={(event) =>
                    setDraftField('declaration_authorization', event.target.checked ? 'true' : 'false')
                  }
                />
                <span>I authorize verification of my submitted information.</span>
              </label>
              <Field label="Date" placeholder="YYYY-MM-DD" type="date" name="declaration_date" value={draft.declaration_date ?? ''} onChange={(event) => setDraftField('declaration_date', event.target.value)} />
              <Field label="Applicant signature name" placeholder="Prajesh" name="signature_name" value={draft.signature_name ?? ''} onChange={(event) => setDraftField('signature_name', event.target.value)} textOnly />
            </div>
          </Section>

          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={prefillTestData}>
              Prefill test data
            </button>
            <Link className="secondary-button" to="/documents" state={{ loanType }}>
              Open documents page
            </Link>
            <button className="secondary-button" type="button">
              Save draft
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
