const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-base-100 py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto prose prose-lg">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="opacity-70 mb-8">Last updated: December 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you
            create an account, post a job, or contact customer support. This may
            include:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Name, email address, phone number, and CNIC.</li>
            <li>
              Payment information (processed securely via third-party
              providers).
            </li>
            <li>Job details and site location data.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. How We Use Your Data</h2>
          <p>We use your data to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Connect homeowners with contractors.</li>
            <li>Process secure payments and hold funds in escrow.</li>
            <li>Verify identities to ensure platform safety.</li>
            <li>Send transaction updates and support messages.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your
            personal information. However, no method of transmission over the
            Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Contact Us</h2>
          <p>
            If you have questions about this policy, please contact us at{" "}
            <span className="font-bold text-primary">privacy@buildlink.pk</span>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
