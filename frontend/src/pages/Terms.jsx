const Terms = () => {
  return (
    <div className="min-h-screen bg-base-100 py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto prose prose-lg">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="opacity-70 mb-8">Effective Date: January 1, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using BuildLink, you agree to comply with and be
            bound by these Terms of Service. If you do not agree, please do not
            use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. User Responsibilities</h2>
          <p>
            <strong>Homeowners:</strong> You agree to provide accurate job
            descriptions and pay the agreed amount upon job completion.
            <br />
            <strong>Contractors:</strong> You agree to perform work
            professionally, on time, and match the quality standards promised.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Payments & Escrow</h2>
          <p>
            BuildLink holds payments in a secure escrow account. Funds are
            released to the contractor only after the homeowner marks the job as
            "Completed" and "Satisfied". In case of disputes, BuildLink
            administration has the final verdict.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            4. Limitation of Liability
          </h2>
          <p>
            BuildLink is a marketplace connecting independent contractors with
            users. We are not liable for any direct or indirect damages
            resulting from the work performed by contractors, though we
            facilitate dispute resolution.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
