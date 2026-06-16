"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

function getPageItems(currentPage, totalPages, maxVisiblePages) {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const siblingCount = Math.max(1, Math.floor((maxVisiblePages - 3) / 2));
  const left = Math.max(2, currentPage - siblingCount);
  const right = Math.min(totalPages - 1, currentPage + siblingCount);
  const pages = [1];

  if (left > 2) {
    pages.push("start-ellipsis");
  }

  for (let page = left; page <= right; page += 1) {
    pages.push(page);
  }

  if (right < totalPages - 1) {
    pages.push("end-ellipsis");
  }

  pages.push(totalPages);
  return pages;
}

function handleLinkClick(event, disabled, page, onPageChange) {
  event.preventDefault();

  if (disabled) {
    return;
  }

  onPageChange(page);
}

export function AppPagination({
  className,
  currentPage = 1,
  maxVisiblePages = 5,
  onPageChange,
  totalPages = 1,
}) {
  const normalizedTotalPages = Math.max(1, Number(totalPages) || 1);
  const normalizedCurrentPage = Math.min(
    Math.max(1, Number(currentPage) || 1),
    normalizedTotalPages
  );
  const pageItems = getPageItems(normalizedCurrentPage, normalizedTotalPages, maxVisiblePages);
  const isPreviousDisabled = normalizedCurrentPage <= 1;
  const isNextDisabled = normalizedCurrentPage >= normalizedTotalPages;

  return (
    <Pagination className={cn("py-2", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={isPreviousDisabled}
            tabIndex={isPreviousDisabled ? -1 : undefined}
            className={cn(isPreviousDisabled && "pointer-events-none opacity-50")}
            onClick={(event) =>
              handleLinkClick(event, isPreviousDisabled, normalizedCurrentPage - 1, onPageChange)
            }
          />
        </PaginationItem>

        {pageItems.map((item) =>
          typeof item === "number" ? (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                isActive={item === normalizedCurrentPage}
                onClick={(event) => handleLinkClick(event, false, item, onPageChange)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis />
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={isNextDisabled}
            tabIndex={isNextDisabled ? -1 : undefined}
            className={cn(isNextDisabled && "pointer-events-none opacity-50")}
            onClick={(event) =>
              handleLinkClick(event, isNextDisabled, normalizedCurrentPage + 1, onPageChange)
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}