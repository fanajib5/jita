import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { documentApi, type VaultDoc } from '../../api/documents';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import styles from './PendingDocsTable.module.css';

type PendingDoc = VaultDoc & { user_name: string; user_email: string };

interface Props {
  data: PendingDoc[];
  onDecide: (id: number, action: 'approved' | 'rejected') => void;
  isDeciding?: boolean;
}

export const PendingDocsTable: React.FC<Props> = ({ data, onDecide, isDeciding }) => {
  const columns = useMemo<ColumnDef<PendingDoc>[]>(
    () => [
      {
        accessorKey: 'user_name',
        header: 'Pengguna',
        cell: (info) => (
          <div>
            <div className={styles.userName}>{String(info.getValue())}</div>
            <div className={styles.userEmail}>{info.row.original.user_email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Dokumen',
        cell: (info) => (
          <div>
            <div className={styles.docTitle}>{String(info.getValue())}</div>
            <div className={styles.docType}>{info.row.original.type.toUpperCase()}</div>
          </div>
        ),
      },
      {
        accessorKey: 'verification_status',
        header: 'Status',
        cell: (info) => <Badge variant="warning">{String(info.getValue())}</Badge>,
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const doc = info.row.original;
          return (
            <div className={styles.actions}>
              <a
                href={documentApi.fileUrl(doc.id)}
                target="_blank"
                rel="noreferrer"
                className={styles.viewLink}
              >
                <Button variant="secondary" size="sm">
                  Lihat Berkas
                </Button>
              </a>
              <Button
                variant="primary"
                size="sm"
                disabled={isDeciding}
                onClick={() => onDecide(doc.id, 'approved')}
              >
                Setujui
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isDeciding}
                onClick={() => onDecide(doc.id, 'rejected')}
              >
                Tolak
              </Button>
            </div>
          );
        },
      },
    ],
    [onDecide, isDeciding]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = data.length;
  const pageCount = table.getPageCount();
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className={styles.th}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={styles.tr}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={styles.td}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Pagination Bar ── */}
      <div className={styles.paginationBar}>
        <div className={styles.paginationInfo}>
          <span>
            Menampilkan <strong>{startRow}</strong>–<strong>{endRow}</strong> dari{' '}
            <strong>{totalRows}</strong> dokumen
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Tampilkan:</span>
            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} baris
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.paginationControls}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            «
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ‹ Sebelumnya
          </Button>
          <span className={styles.pageIndicator}>
            Hal <strong>{pageIndex + 1}</strong> dari <strong>{Math.max(1, pageCount)}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Berikutnya ›
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
};
