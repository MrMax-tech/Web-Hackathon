import { jsPDF } from 'jspdf';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

export function PDFGenerator({ ticket }: { ticket: any }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('Tic-Solver Support Ticket', margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, margin, y);
    y += 20;

    // Ticket Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Ticket Information', margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.text(`Ticket Number: ${ticket.ticketNumber}`, margin, y); y += 7;
    doc.text(`Status: ${ticket.status.toUpperCase()}`, margin, y); y += 7;
    doc.text(`Type: ${ticket.type.toUpperCase()}`, margin, y); y += 7;
    doc.text(`Customer: ${ticket.customerName} (${ticket.customerEmail})`, margin, y); y += 15;

    // Details
    doc.setFontSize(14);
    doc.text('Issue Details', margin, y);
    y += 10;
    
    doc.setFontSize(10);
    Object.entries(ticket.details).forEach(([key, value]: [string, any]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      doc.text(`${label}: ${value}`, margin, y);
      y += 7;
    });
    y += 10;

    // Chat History
    doc.setFontSize(14);
    doc.text('Communication History', margin, y);
    y += 10;

    doc.setFontSize(9);
    ticket.messages.forEach((msg: any) => {
      const time = format(new Date(msg.timestamp), 'p');
      const text = `${time} - ${msg.senderName}: ${msg.text}`;
      const splitText = doc.splitTextToSize(text, 170);
      
      if (y + (splitText.length * 5) > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(splitText, margin, y);
      y += (splitText.length * 5) + 2;
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Thank you for using Tic-Solver. We value your business.', margin, 285);

    doc.save(`Ticket_${ticket.ticketNumber}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      title="Download PDF Summary"
    >
      <FileText className="w-4 h-4" />
      PDF
    </button>
  );
}
