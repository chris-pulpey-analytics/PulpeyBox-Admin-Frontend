export const crossReference = async (file) => {
  const token = localStorage.getItem('admin_token')
  const formData = new FormData()
  formData.append('file', file)
  return fetch('/api/reports/cross-reference', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
}

export const downloadBlob = async (response, fileName) => {
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
