import React, { useMemo } from 'react';
import CategoryChips from './CategoryChips';
import useCategories from '../../hooks/useCategories';

export default function CategoryFilter({ selected, onChange, includeAll = true }) {
  const { categories } = useCategories();
  const list = useMemo(() => {
    if (includeAll) return categories;
    return categories.filter((c) => c.id !== 'all');
  }, [categories, includeAll]);
  return (
    <CategoryChips categories={list} selected={selected} onChange={onChange} />
  );
}

