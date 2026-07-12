import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ReporteAsistenciaDia, ReporteConductaAlumno } from '../models/asistencia.models';
import { Curso } from '../models/academico.models';

const COLEGIO = "Colegio Bernardo O'Higgins";

@Injectable({ providedIn: 'root' })
export class ExportarService {

  // ── Asistencia ──────────────────────────────────────────────────────────────

  asistenciaPdf(datos: ReporteAsistenciaDia[], curso: Curso, fecha: string): void {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Reporte de Asistencia', 14, 20);
    doc.setFontSize(11);
    doc.text(`${curso.gradoCurso} ${curso.seccionCurso} — ${fecha}`, 14, 28);
    doc.setFontSize(9);
    doc.text(COLEGIO, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['N°', 'Alumno', 'RUT', 'Estado', 'Justificación']],
      body: datos.map((a, i) => [
        i + 1,
        a.nombreEstudiante,
        a.rutEstudiante,
        a.estadoAsistencia,
        a.justificacionAsistencia ?? '—'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 }
      }
    });

    doc.save(`Asistencia_${curso.gradoCurso}${curso.seccionCurso}_${fecha}.pdf`);
  }

  asistenciaExcel(datos: ReporteAsistenciaDia[], curso: Curso, fecha: string): void {
    const filas = datos.map((a, i) => ({
      'N°': i + 1,
      'Alumno': a.nombreEstudiante,
      'RUT': a.rutEstudiante,
      'Estado': a.estadoAsistencia,
      'Justificación': a.justificacionAsistencia ?? ''
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja['!cols'] = [{ wch: 5 }, { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 40 }];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Asistencia');
    XLSX.writeFile(libro, `Asistencia_${curso.gradoCurso}${curso.seccionCurso}_${fecha}.xlsx`);
  }

  // ── Conducta ────────────────────────────────────────────────────────────────

  conductaPdf(datos: ReporteConductaAlumno[], curso: Curso): void {
    const doc = new jsPDF();
    const totalPos = datos.reduce((s, a) => s + a.totalPositivas, 0);
    const totalNeg = datos.reduce((s, a) => s + a.totalNegativas, 0);
    const totalAnot = totalPos + totalNeg;
    const pctPos = totalAnot > 0 ? (totalPos / totalAnot * 100).toFixed(1) : '0.0';
    const pctNeg = totalAnot > 0 ? (totalNeg / totalAnot * 100).toFixed(1) : '0.0';

    doc.setFontSize(16);
    doc.text('Reporte de Conducta', 14, 20);
    doc.setFontSize(11);
    doc.text(`${curso.gradoCurso} ${curso.seccionCurso}`, 14, 28);
    doc.setFontSize(9);
    doc.text(COLEGIO, 14, 34);
    doc.text(
      `Buena conducta: ${pctPos}%   Mala conducta: ${pctNeg}%   Total anotaciones: ${totalAnot}`,
      14, 40
    );

    autoTable(doc, {
      startY: 46,
      head: [['N°', 'Alumno', 'RUT', 'Positivas', 'Negativas', '% Buena conducta']],
      body: datos.map((a, i) => {
        const total = a.totalPositivas + a.totalNegativas;
        const pct = total > 0 ? (a.totalPositivas / total * 100).toFixed(1) + '%' : '—';
        return [i + 1, a.nombreEstudiante, a.rutEstudiante, a.totalPositivas, a.totalNegativas, pct];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { cellWidth: 26 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 32, halign: 'center' }
      }
    });

    doc.save(`Conducta_${curso.gradoCurso}${curso.seccionCurso}.pdf`);
  }

  conductaExcel(datos: ReporteConductaAlumno[], curso: Curso): void {
    const totalPos = datos.reduce((s, a) => s + a.totalPositivas, 0);
    const totalNeg = datos.reduce((s, a) => s + a.totalNegativas, 0);
    const totalAnot = totalPos + totalNeg;

    const filas: Record<string, unknown>[] = datos.map((a, i) => {
      const total = a.totalPositivas + a.totalNegativas;
      return {
        'N°': i + 1,
        'Alumno': a.nombreEstudiante,
        'RUT': a.rutEstudiante,
        'Positivas': a.totalPositivas,
        'Negativas': a.totalNegativas,
        '% Buena conducta': total > 0 ? parseFloat((a.totalPositivas / total * 100).toFixed(1)) : 0
      };
    });

    filas.push({
      'N°': '',
      'Alumno': 'TOTAL',
      'RUT': '',
      'Positivas': totalPos,
      'Negativas': totalNeg,
      '% Buena conducta': totalAnot > 0 ? parseFloat((totalPos / totalAnot * 100).toFixed(1)) : 0
    });

    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja['!cols'] = [{ wch: 5 }, { wch: 36 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Conducta');
    XLSX.writeFile(libro, `Conducta_${curso.gradoCurso}${curso.seccionCurso}.xlsx`);
  }
}
