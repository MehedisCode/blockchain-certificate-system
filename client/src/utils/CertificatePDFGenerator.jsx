import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const CertificatePDFGenerator = ({ certData, id }) => {
  const [pdfDataUri, setPdfDataUri] = useState(null);
  const [error, setError] = useState(null);

  const generatePDF = data => {
    if (!data) {
      console.error('generatePDF: No certData available');
      setError('Failed to generate certificate: No data available');
      return;
    }

    try {
      console.log('Generating PDF with certData:', data);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Colors
      const headerBlue = [0, 51, 102];
      const accentGold = [218, 165, 32];
      const borderGray = [80, 80, 80];

      // Border
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 287, 200);
      doc.setDrawColor(...accentGold);
      doc.setLineWidth(0.5);
      doc.rect(7, 7, 283, 196);

      // University Info (centered)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...headerBlue);
      doc.setFontSize(20);
      doc.text(`${data.instituteName} (${data.instituteAcronym})`, 148.5, 20, {
        align: 'center',
      });
      doc.setFontSize(12);
      doc.text(data.instituteAddress, 148.5, 30, { align: 'center' });
      doc.text(data.instituteLink, 148.5, 36, { align: 'center' });

      // Certificate Body
      doc.setFontSize(16);
      doc.text('Certificate of Graduation', 148.5, 50, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('This is to certify that', 148.5, 60, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(data.candidateName, 148.5, 70, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`bearing Student ID ${data.candidateId},`, 148.5, 80, {
        align: 'center',
      });
      doc.text(`son of ${data.fatherName} and ${data.motherName},`, 148.5, 88, {
        align: 'center',
      });
      doc.text(`of the Academic Session ${data.session},`, 148.5, 96, {
        align: 'center',
      });
      doc.text(
        'has successfully completed all the academic requirements and has been awarded the degree of:',
        148.5,
        104,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...headerBlue);
      doc.setFontSize(18);
      doc.text(`${data.degreeName} in ${data.departmentName}`, 148.5, 114, {
        align: 'center',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`CGPA: ${data.cgpa}/4.00`, 148.5, 124, { align: 'center' });
      doc.text('on this day,', 148.5, 132, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      const formattedDate = new Date(data.creationDate).toLocaleDateString(
        'en-US',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      );
      doc.text(formattedDate, 148.5, 140, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text(
        'This degree is awarded in recognition of the satisfactory completion of the prescribed course of study and all required examinations,',
        148.5,
        150,
        { align: 'center', maxWidth: 260 }
      );
      doc.text(
        'and in accordance with the rules and regulations of',
        148.5,
        158,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'bold');
      doc.text(`${data.instituteName}.`, 148.5, 166, { align: 'center' });

      // Certificate ID and Revoked Status
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Certificate ID: ${id}`, 148.5, 180, { align: 'center' });

      // Signatures
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.line(50, 190, 100, 190);
      doc.text('Dr. Farhana Rahman', 75, 195, { align: 'center' });
      doc.text('Registrar', 75, 200, { align: 'center' });
      doc.text(data.instituteAcronym, 75, 205, { align: 'center' });
      doc.line(197, 190, 247, 190);
      doc.text('Prof. Kamrul Hasan', 222, 195, { align: 'center' });
      doc.text(`Head, Department of ${data.departmentName}`, 222, 200, {
        align: 'center',
      });
      doc.text(data.instituteAcronym, 222, 205, { align: 'center' });

      // Generate data URL
      const pdfDataUri = doc.output('datauristring');
      setPdfDataUri(pdfDataUri);
      setError(null);
      console.log('PDF generated successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate certificate: ' + err.message);
    }
  };

  useEffect(() => {
    if (certData) {
      console.log(
        'CertificatePDFGenerator: Triggering generatePDF with certData:',
        certData
      );
      generatePDF(certData);
    }
  }, [certData, id]);

  return {
    pdfDataUri,
    error,
    generatePDF, // Expose generatePDF for manual triggering
  };
};

export default CertificatePDFGenerator;
