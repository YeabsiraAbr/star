// app/view-pdf/page.tsx or pages/view-pdf.tsx

export default function ViewPdfPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <embed
        src="/BabayeBekeleLegesseCertificate.pdf"
        type="application/pdf"
        width="100%"
        height="100%"
      />
    </div>
  );
}
