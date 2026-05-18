import { request } from '../../services/request'
import type { LoanApplicationPayload } from '../loan-draft'

export type LoanApplicationDocument = {
  fieldName: string
  file: File
  required: boolean
  title: string
}

export type SubmitLoanApplicationResponse = {
  application_id: string
  loan_type: LoanApplicationPayload['loan_type']
  message: string
  status: boolean
}

export function submitLoanApplication(
  payload: LoanApplicationPayload,
  documents: LoanApplicationDocument[],
): Promise<SubmitLoanApplicationResponse | undefined> {
  const loanType = encodeURIComponent(payload.loan_type)
  const formData = new FormData()
  formData.append('application', JSON.stringify(payload))
  formData.append(
    'documents_metadata',
    JSON.stringify(
      documents.map(({ file, required, title }) => ({
        file_name: file.name,
        required,
        title,
      })),
    ),
  )

  documents.forEach(({ fieldName, file }) => {
    formData.append('documents', file, file.name)
    formData.append('document_titles', fieldName)
  })

  return request(`/loan-applications?loan_type=${loanType}`, {
    method: 'POST',
    body: formData,
  })
}
