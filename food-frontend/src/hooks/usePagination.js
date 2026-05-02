import { useState, useMemo } from "react";
import { PAGINATION_WINDOW } from "../utils/constants";

/**
 * Manages pagination state for an array of items.
 * Resets to page 1 whenever the items array reference changes.
 *
 * @param {Array}  items   - The full list of items to paginate
 * @param {number} perPage - Number of items per page
 * @returns {{
 *   currentPage: number,
 *   setCurrentPage: Function,
 *   totalPages: number,
 *   currentItems: Array,
 *   paginationNumbers: number[]
 * }}
 */
const usePagination = (items, perPage) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevItems, setPrevItems] = useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    setCurrentPage(1);
  }

  const totalPages = useMemo(
    () => Math.ceil(items.length / perPage),
    [items.length, perPage]
  );

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, currentPage, perPage]);

  const paginationNumbers = useMemo(() => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end   = Math.min(totalPages, start + PAGINATION_WINDOW - 1);
    if (end - start + 1 < PAGINATION_WINDOW) start = Math.max(1, end - PAGINATION_WINDOW + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }, [currentPage, totalPages]);

  return { currentPage, setCurrentPage, totalPages, currentItems, paginationNumbers };
};

export default usePagination;
