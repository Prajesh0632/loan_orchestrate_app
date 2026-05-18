import { useEffect, useState } from 'react'
import { BadgeInfo, FileText, Landmark } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { FlowCheckpointTrail, isApplicationComplete } from './loan-flow'
import { buildLoanApplicationPayload, readStoredLoanDraft, readStoredLoanType, type LoanType } from './loan-draft'
import { submitLoanApplication, type LoanApplicationDocument } from './api/loan_application_api'
import { getTestDocumentFiles } from './loan-test-data'

type DocumentItem = {
  fieldName: string
  required?: boolean
  title: string
  note: string
}

const loanTypeMeta: Record<
  LoanType,
  {
    label: string
    hero: string
  }
> = {
  housing: { label: 'Housing loan', hero: 'Housing loan documents' },
  apartment: { label: 'Apartment loan', hero: 'Apartment loan documents' },
  land: { label: 'Land loan', hero: 'Land loan documents' },
  vehicle: { label: 'Vehicle loan', hero: 'Vehicle loan documents' },
  agriculture: { label: 'Agricultural loan', hero: 'Agricultural loan documents' },
}

const commonDocuments: DocumentItem[] = [
  { fieldName: 'citizenship_or_national_id', title: 'Citizenship / national ID', note: 'Required for identity verification.', required: true },
  { fieldName: 'passport_size_photo', title: 'Passport-size photo', note: 'Applicant and co-applicant if applicable.', required: true },
  { fieldName: 'pan_or_tax_registration', title: 'PAN / tax registration', note: 'For salaried or business applicants where applicable.', required: true },
  { fieldName: 'bank_statement', title: 'Bank statement', note: 'Usually the latest 6 months.', required: true },
  { fieldName: 'income_proof', title: 'Income proof', note: 'Salary slip, business income, remittance proof, or tax returns.', required: true },
]

const documentsByLoanType: Record<LoanType, DocumentItem[]> = {
  housing: [
    { fieldName: 'title_deed_or_lalpurja', title: 'Title deed / लालपुर्जा', note: 'Proof of ownership of the property being financed.', required: true },
    { fieldName: 'land_or_property_tax_receipt', title: 'Land / property tax receipt', note: 'Latest local tax receipt for the property.', required: true },
    { fieldName: 'site_plan_or_map', title: 'Site plan / map', note: 'Property map or location sketch.', required: true },
    { fieldName: 'valuation_report', title: 'Valuation report', note: 'Approved valuation of the land or house.', required: true },
    { fieldName: 'construction_estimate_or_quotation', title: 'Construction estimate / quotation', note: 'Builder estimate if construction is planned.', required: false },
  ],
  apartment: [
    { fieldName: 'booking_or_allotment_letter', title: 'Booking / allotment letter', note: 'Issued by the developer or seller.', required: true },
    { fieldName: 'project_quotation', title: 'Project quotation', note: 'Apartment booking quotation or invoice.', required: true },
    { fieldName: 'building_or_project_approval_papers', title: 'Building / project approval papers', note: 'Developer approval documents if available.', required: true },
    { fieldName: 'unit_or_floor_plan', title: 'Unit / floor plan', note: 'Plan showing the flat and floor details.', required: true },
    { fieldName: 'developer_ownership_papers', title: 'Developer ownership papers', note: 'Land/title documents of the project where available.', required: false },
  ],
  land: [
    { fieldName: 'title_deed_or_lalpurja', title: 'Title deed / लालपुर्जा', note: 'Ownership proof for the land being purchased.', required: true },
    { fieldName: 'plot_or_kitta_map', title: 'Plot / kitta map', note: 'Survey or plot map of the land.', required: true },
    { fieldName: 'land_tax_receipt', title: 'Land tax receipt', note: 'Latest land revenue / tax payment.', required: true },
    { fieldName: 'purchase_agreement', title: 'Purchase agreement', note: 'Sale agreement or commitment letter.', required: true },
    { fieldName: 'valuation_report', title: 'Valuation report', note: 'Valuation from an approved valuator.', required: true },
  ],
  vehicle: [
    { fieldName: 'dealer_quotation_or_proforma_invoice', title: 'Dealer quotation / proforma invoice', note: 'Quoted by the authorized seller.', required: true },
    { fieldName: 'vehicle_specification_sheet', title: 'Vehicle specification sheet', note: 'Make, model, year, and key vehicle details.', required: true },
    { fieldName: 'used_vehicle_valuation', title: 'Used vehicle valuation', note: 'Needed if the vehicle is second-hand.', required: false },
    { fieldName: 'driving_license', title: 'Driving license', note: 'Helpful for personal vehicle loans.', required: false },
    { fieldName: 'purchase_agreement', title: 'Purchase agreement', note: 'Sale agreement or booking document.', required: true },
  ],
  agriculture: [
    { fieldName: 'land_ownership_or_lease_agreement', title: 'Land ownership / lease agreement', note: 'Farm land proof or lease contract.', required: true },
    { fieldName: 'agricultural_plan', title: 'Agricultural plan', note: 'Crop, livestock, or production plan.', required: true },
    { fieldName: 'supplier_quotation', title: 'Supplier quotation', note: 'Quotation for seeds, livestock, equipment, or materials.', required: true },
    { fieldName: 'irrigation_or_utility_document', title: 'Irrigation / utility document', note: 'Water source, irrigation, or utility details if available.', required: false },
    { fieldName: 'farm_registration_or_pan', title: 'Farm registration / PAN', note: 'If the farm or business is formally registered.', required: false },
  ],
}

const FILE_DB_NAME = 'aclo-loan-files'
const FILE_STORE_NAME = 'files'
const MAX_FILE_SIZE = 5 * 1024 * 1024

type StoredLoanFile = {
  file: File
  updatedAt: number
}

function openFileDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(FILE_DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
        db.createObjectStore(FILE_STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readStoredFile(key: string): Promise<StoredLoanFile | null> {
  try {
    const db = await openFileDb()
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(FILE_STORE_NAME, 'readonly')
      const store = transaction.objectStore(FILE_STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => resolve((request.result as StoredLoanFile | undefined) ?? null)
      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => db.close()
      transaction.onerror = () => {
        db.close()
        reject(transaction.error)
      }
    })
  } catch {
    return null
  }
}

async function saveStoredFile(key: string, file: File): Promise<void> {
  const db = await openFileDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(FILE_STORE_NAME)
    store.put({ file, updatedAt: Date.now() } satisfies StoredLoanFile, key)
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

function DocumentUpload({
  document,
  refreshToken,
  storageKey,
}: {
  document: DocumentItem
  refreshToken: number
  storageKey: string
}) {
  const [error, setError] = useState('')
  const [savedName, setSavedName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void readStoredFile(storageKey).then((stored) => {
      if (!active) {
        return
      }

      setSavedName(stored?.file.name ?? '')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [refreshToken, storageKey])

  return (
    <label className="doc-upload">
      <div className="doc-upload-head">
        <span className="doc-title">
          {document.title}
          {document.required ? <span className="field-required">Required</span> : <span className="field-optional">Optional</span>}
        </span>
        <p className="muted doc-note">{document.note}</p>
      </div>
      <div className={`doc-status ${loading ? 'is-loading' : savedName ? 'is-uploaded' : 'is-empty'}`} aria-live="polite">
        {loading ? (
          <span className="doc-status-label">Checking upload status</span>
        ) : savedName ? (
          <>
            <span className="doc-status-pill">Uploaded</span>
            <span className="doc-status-name">{savedName}</span>
          </>
        ) : (
          <>
            <span className="doc-status-pill is-missing">Not uploaded</span>
            <span className="doc-status-name">No file has been saved for this item yet.</span>
          </>
        )}
      </div>
      <input
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) {
            setError('')
            return
          }

          if (file.type !== 'application/pdf') {
            setError('PDF only.')
            event.currentTarget.value = ''
            return
          }

          if (file.size > MAX_FILE_SIZE) {
            setError('Maximum 5 MB.')
            event.currentTarget.value = ''
            return
          }

          void saveStoredFile(storageKey, file).then(() => {
            setSavedName(file.name)
            setError('')
          })
        }}
      />
      <p className="doc-limit">PDF only, up to 5 MB.</p>
      {error ? <p className="doc-error">{error}</p> : null}
    </label>
  )
}

export function LoanDocumentsPage() {
  const location = useLocation()
  const loanType =
    (location.state as { loanType?: LoanType } | null)?.loanType ?? readStoredLoanType() ?? 'housing'
  const loanMeta = loanTypeMeta[loanType]
  const documentItems = [...commonDocuments, ...documentsByLoanType[loanType]]
  const applicationComplete = isApplicationComplete(readStoredLoanDraft(), loanType)
  const [documentsComplete, setDocumentsComplete] = useState(false)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const flowSteps = [
    {
      title: '1. Fill application',
      description: 'Application details have already been captured on the first page.',
      active: false,
      completed: applicationComplete,
    },
    {
      title: '2. Upload documents',
      description: 'Attach the PDF checklist for the selected loan type.',
      active: true,
      completed: applicationComplete && documentsComplete,
    },
    {
      title: '3. Submit application',
      description: 'Submit after all required uploads are saved.',
      active: false,
      completed: false,
    },
  ]

  useEffect(() => {
    let active = true
    setDocumentsLoading(true)

    void Promise.all(
      [...commonDocuments, ...documentsByLoanType[loanType]]
        .filter((document) => document.required)
        .map((document) => readStoredFile(`${loanType}:${document.title}`)),
    ).then((files) => {
      if (!active) {
        return
      }

      setDocumentsComplete(files.every((file) => Boolean(file)))
      setDocumentsLoading(false)
    })

    return () => {
      active = false
    }
  }, [loanType, refreshToken])

  const prefillUploads = async () => {
    const files = await getTestDocumentFiles(documentItems.map((document) => document.title))
    await Promise.all(
      Object.entries(files).map(([title, file]) => saveStoredFile(`${loanType}:${title}`, file)),
    )
    setRefreshToken((current) => current + 1)
  }

  const readUploadedDocuments = async (): Promise<LoanApplicationDocument[]> => {
    const storedDocuments = await Promise.all(
      documentItems.map(async (document) => ({
        document,
        stored: await readStoredFile(`${loanType}:${document.title}`),
      })),
    )

    return storedDocuments.flatMap(({ document, stored }) =>
      stored
        ? [
            {
              file: stored.file,
              fieldName: document.fieldName,
              required: document.required ?? false,
              title: document.title,
            },
          ]
        : [],
    )
  }

  const handleSubmitApplication = async () => {
    setSubmitMessage(null)
    setIsSubmitting(true)

    try {
      const payload = buildLoanApplicationPayload(readStoredLoanDraft(), loanType)
      const documents = await readUploadedDocuments()
      const response = await submitLoanApplication(payload, documents)

      if (!response?.status) {
        throw new Error(response?.message || 'Could not submit application data.')
      }

      setSubmitMessage(`${response.message} Application ID: ${response.application_id}`)
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Could not submit application data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="form-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <div className="brand-name">ACLO</div>
            <div className="brand-sub">Document upload</div>
          </div>
        </div>

        <nav className="nav-links" aria-label="Documents navigation">
          <span className="nav-link active">Documents</span>
        </nav>
      </header>

      <main className="form-container">
        <section className="form-hero">
          <div>
            <p className="eyebrow">Uploads</p>
            <h1>{loanMeta.hero}</h1>
            <p className="muted">
              Upload the common KYC documents first, then the loan-specific documents for the selected
              product.
            </p>
          </div>
          <div className="form-hero-note">
            <BadgeInfo size={18} className="feature-icon" />
            <span>Loan type controls the required upload list. PDF only, up to 5 MB each.</span>
          </div>
        </section>

        <FlowCheckpointTrail
          subtitle="The document step is shown as a linked checkpoint after the main form."
          steps={flowSteps}
        />

        <section className="form-section">
          <div className="section-head">
            <div className="section-title">
              <Landmark size={18} className="feature-icon" />
              <div>
                <h2>Selected loan type</h2>
                <p className="muted">{loanMeta.label}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="section-head">
            <div className="section-title">
              <FileText size={18} className="feature-icon" />
              <div>
                <h2>Documents to Upload</h2>
                <p className="muted">Common KYC plus loan-specific evidence.</p>
              </div>
            </div>
          </div>

          <div className="form-grid two-up">
            {documentItems.map((document) => (
              <DocumentUpload
                key={document.title}
                document={document}
                refreshToken={refreshToken}
                storageKey={`${loanType}:${document.title}`}
              />
            ))}
          </div>
          {!documentsLoading ? (
            <p className="doc-summary">
              {documentsComplete
                ? 'All required PDFs are uploaded.'
                : 'Some required PDFs are still missing.'}
            </p>
          ) : null}
        </section>

        <div className="form-actions">
          <Link className="secondary-button" to="/fill-form">
            Back to form
          </Link>
          <button className="secondary-button" type="button" onClick={() => void prefillUploads()}>
            Prefill uploads
          </button>
          <button className="secondary-button" type="button">
            Save draft
          </button>
          <button className="primary-button" type="button" disabled={isSubmitting} onClick={() => void handleSubmitApplication()}>
            {isSubmitting ? 'Submitting...' : 'Submit application'}
          </button>
        </div>
        {submitMessage ? <p className="doc-summary">{submitMessage}</p> : null}
      </main>
    </div>
  )
}
