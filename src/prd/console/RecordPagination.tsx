import { useEffect, useState } from "react"
import { useLanguage } from "../../domain/store"
import { translate } from "../../i18n"

export const RECORDS_PER_PAGE = 10

export function useRecordPagination<T>(records: T[], resetKey: string) {
  const [pagination, setPagination] = useState({ page: 1, resetKey })
  const totalPages = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE))
  const page = Math.min(
    pagination.resetKey === resetKey ? pagination.page : 1,
    totalPages,
  )

  useEffect(() => {
    if (pagination.resetKey !== resetKey || pagination.page !== page)
      setPagination({ page, resetKey })
  }, [pagination, page, resetKey])

  return {
    page,
    setPage: (nextPage: number) =>
      setPagination({ page: nextPage, resetKey }),
    pageRecords: records.slice(
      (page - 1) * RECORDS_PER_PAGE,
      page * RECORDS_PER_PAGE,
    ),
    totalPages,
  }
}

export function RecordPagination({
  page,
  totalItems,
  totalPages,
  onPageChange,
}: {
  page: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const language = useLanguage()
  const tr = (text: string) => translate(text, language === "my" ? "MY" : "EN")
  if (totalItems === 0) return null
  const firstPage = Math.max(
    1,
    Math.min(page - 2, totalPages - Math.min(totalPages, 5) + 1),
  )
  const pageNumbers = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => firstPage + index,
  )
  const firstItem = (page - 1) * RECORDS_PER_PAGE + 1
  const lastItem = Math.min(page * RECORDS_PER_PAGE, totalItems)

  return (
    <nav className="prd-pagination" aria-label={tr("Record pages")}>
      <span className="prd-pagination-summary">
        {tr("Showing")} {firstItem}–{lastItem} {tr("of")} {totalItems}
      </span>
      {totalPages > 1 && (
        <div className="prd-pagination-controls">
          <button
            className="button button--secondary"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            {tr("Previous")}
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              aria-current={pageNumber === page ? "page" : undefined}
              aria-label={`${tr("Page")} ${pageNumber}`}
              className={`button ${
                pageNumber === page
                  ? "button--primary"
                  : "button--secondary"
              }`}
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="button button--secondary"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            {tr("Next")}
          </button>
        </div>
      )}
    </nav>
  )
}
