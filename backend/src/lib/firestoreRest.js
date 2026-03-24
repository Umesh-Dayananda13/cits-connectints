import config from '../config/env.js'

const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${config.firebase.projectId}/databases/${config.firebase.databaseId}/documents`
const firestoreRunQueryUrl = `${firestoreBaseUrl}:runQuery`

// Converts plain JS values to Firestore REST value format.
const toFirestoreValue = (value) => {
  if (value === null) return { nullValue: null }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    }
  }

  switch (typeof value) {
    case 'boolean':
      return { booleanValue: value }
    case 'number':
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value }
    case 'object':
      return {
        mapValue: {
          fields: toFirestoreFields(value),
        },
      }
    default:
      return { stringValue: String(value) }
  }
}

// Converts plain JS object fields into Firestore `fields` payload.
const toFirestoreFields = (value) => Object.entries(value).reduce((fields, [key, fieldValue]) => {
  if (fieldValue === undefined) return fields

  fields[key] = toFirestoreValue(fieldValue)
  return fields
}, {})

// Converts Firestore REST values back into plain JS values.
const fromFirestoreValue = (value) => {
  if ('nullValue' in value) return null
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return Number(value.doubleValue)
  if ('stringValue' in value) return value.stringValue
  if ('timestampValue' in value) return value.timestampValue
  if ('arrayValue' in value) return (value.arrayValue.values || []).map((item) => fromFirestoreValue(item))
  if ('mapValue' in value) {
    return Object.entries(value.mapValue.fields || {}).reduce((result, [key, nestedValue]) => {
      result[key] = fromFirestoreValue(nestedValue)
      return result
    }, {})
  }

  return null
}

// Converts Firestore REST document to plain JS object.
const parseFirestoreDocument = (document) => Object.entries(document?.fields || {}).reduce((result, [key, value]) => {
  result[key] = fromFirestoreValue(value)
  return result
}, {})

const buildDocumentUrl = (documentPath, queryString = '') => `${firestoreBaseUrl}/${documentPath}${queryString ? `?${queryString}` : ''}`

const getFirestoreErrorMessage = (payload, defaultMessage) => (
  payload?.error?.message || payload?.error?.status || defaultMessage
)

const toStatusCodeFromFirestoreStatus = (status) => {
  switch (status) {
    case 'PERMISSION_DENIED':
      return 403
    case 'UNAUTHENTICATED':
      return 401
    case 'NOT_FOUND':
      return 404
    case 'ALREADY_EXISTS':
      return 409
    case 'INVALID_ARGUMENT':
    case 'FAILED_PRECONDITION':
      return 400
    case 'RESOURCE_EXHAUSTED':
      return 429
    default:
      return 500
  }
}

const toFirestoreRequestError = (payload, defaultMessage) => {
  const firestoreError = payload?.error || {}
  const firestoreStatus = String(firestoreError.status || '').trim()
  const error = new Error(getFirestoreErrorMessage(payload, defaultMessage))
  error.firestoreStatus = firestoreStatus
  error.statusCode = firestoreStatus
    ? toStatusCodeFromFirestoreStatus(firestoreStatus)
    : 500
  return error
}

const getAuthHeaders = ({ accessToken, idToken } = {}) => {
  const bearerToken = idToken || accessToken
  return bearerToken
    ? { Authorization: `Bearer ${bearerToken}` }
    : {}
}

export async function getFirestoreDocument({ documentPath, idToken, accessToken }) {
  // Reads a single Firestore document path (not a collection path).
  const response = await fetch(buildDocumentUrl(documentPath), {
    headers: getAuthHeaders({ accessToken, idToken }),
  })

  if (response.status === 404) {
    return null
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw toFirestoreRequestError(payload, 'Firestore read failed.')
  }

  return parseFirestoreDocument(payload)
}

export async function listFirestoreDocuments({ collectionPath, idToken, accessToken }) {
  // Lists direct documents under a collection path.
  const response = await fetch(buildDocumentUrl(collectionPath), {
    headers: getAuthHeaders({ accessToken, idToken }),
  })

  if (response.status === 404) {
    return []
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw toFirestoreRequestError(payload, 'Firestore list failed.')
  }

  return (payload.documents || []).map((document) => {
    const nameSegments = (document?.name || '').split('/')
    const id = nameSegments[nameSegments.length - 1] || ''

    return {
      ...parseFirestoreDocument(document),
      id,
    }
  })
}

export async function runFirestoreCollectionGroupQuery({
  collectionId,
  idToken,
  accessToken,
  limit = 100,
  orderByField = 'purchasedAtIso',
  orderDirection = 'DESCENDING',
}) {
  // Collection-group query across all descendants, used for admin-wide payments.
  const structuredQuery = {
    from: [
      {
        allDescendants: true,
        collectionId,
      },
    ],
    limit,
  }

  if (orderByField) {
    structuredQuery.orderBy = [
      {
        direction: orderDirection,
        field: { fieldPath: orderByField },
      },
    ]
  }

  const response = await fetch(firestoreRunQueryUrl, {
    body: JSON.stringify({
      structuredQuery,
    }),
    headers: {
      ...getAuthHeaders({ accessToken, idToken }),
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const payload = await response.json().catch(() => [])
  if (!response.ok) {
    const firstError = Array.isArray(payload)
      ? payload.find((item) => item?.error)
      : payload

    throw toFirestoreRequestError(firstError, 'Firestore query failed.')
  }

  const resultRows = Array.isArray(payload) ? payload : []

  // Keep document id/path for UI/debug visibility and key generation.
  return resultRows
    .filter((item) => item?.document)
    .map((item) => {
      const document = item.document
      const fullName = document?.name || ''
      const documentPath = fullName.split('/documents/')[1] || ''
      const pathSegments = documentPath.split('/').filter(Boolean)
      const id = pathSegments[pathSegments.length - 1] || ''

      return {
        ...parseFirestoreDocument(document),
        id,
        path: documentPath,
      }
    })
}

export async function setFirestoreDocument({ data, documentPath, idToken, accessToken }) {
  // PATCH with update mask updates only provided top-level fields.
  const updateMask = Object.keys(data)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join('&')

  const response = await fetch(buildDocumentUrl(documentPath, updateMask), {
    body: JSON.stringify({
      fields: toFirestoreFields(data),
    }),
    headers: {
      ...getAuthHeaders({ accessToken, idToken }),
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw toFirestoreRequestError(payload, 'Firestore write failed.')
  }

  return parseFirestoreDocument(payload)
}
