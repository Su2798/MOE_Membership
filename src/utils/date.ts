const monthNumbers: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
}

export function dateKey(value: string) {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`

  const match = value.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (!match) return ""
  const month = monthNumbers[match[2].toLowerCase()]
  if (!month) return ""
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`
}

export function isWithinDateRange(
  value: string,
  from: string,
  to: string,
) {
  const key = dateKey(value)
  if (!key) return false
  return (!from || key >= from) && (!to || key <= to)
}
