import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExcelColumn {
  header: string;
  key: string;
  width: number;
  isCurrency?: boolean;
}

interface ExportExcelProps {
  data: any[];
  fileName: string;
  sheetName?: string;
  columns: ExcelColumn[];
}

export const exportToExcel = async ({ data, fileName, sheetName = 'Sheet1', columns }: ExportExcelProps) => {
  if (data.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 1. Set Kolom & Lebar Kolom
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  // 2. Masukkan Data
  worksheet.addRows(data);

  // 3. Styling Header (Baris Pertama)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Teks Putih
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF107C41' } // Hijau khas Excel
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25; // Tinggikan sedikit baris header

  // 4. Styling Isi Data (Border, Alignment, & Format Mata Uang)
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      // Tambahkan border tipis untuk semua cell
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Jika bukan header, atur perataan teks
      if (rowNumber > 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        
        // Format angka sebagai Rupiah (Currency) jika kolom di-set isCurrency: true
        const isCurrencyCol = columns[colNumber - 1]?.isCurrency;
        if (isCurrencyCol && typeof cell.value === 'number') {
          // Format Akuntansi Excel untuk Rupiah: Rp 100.000
          cell.numFmt = '[$Rp-421] #,##0.00;[Red]-[$Rp-421] #,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' }; // Angka rata kanan
        }
      }
    });
  });

  // 5. Generate & Download File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};

interface ExportPDFProps {
  title: string;
  fileName: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
  orientation?: 'portrait' | 'landscape';
}

export const exportToPDF = ({ title, fileName, data, columns, orientation = 'landscape' }: ExportPDFProps) => {
  if (data.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  const doc = new jsPDF(orientation);

  // Menambahkan Judul
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

  // Menambahkan Tabel
  autoTable(doc, {
    startY: 28,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey])),
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Warna primary biru
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Warna baris ganjil/genap
    },
  });

  doc.save(`${fileName}.pdf`);
};