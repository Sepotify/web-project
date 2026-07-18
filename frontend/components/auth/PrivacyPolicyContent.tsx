export function PrivacyPolicyContent() {
  return (
    <div className="space-y-4 text-sm leading-6 text-text-secondary">
      <section>
        <h3 className="mb-2 font-semibold text-text-primary">1. Information We Collect</h3>
        <p>
          Mock Spotify collects account information such as display name, email address,
          date of birth, gender, and artist portfolio details to provide music streaming
          and artist onboarding services.
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-text-primary">2. How We Use Your Data</h3>
        <p>
          Your listening activity, playlists, preferences, and uploaded content may be
          stored locally during Phase 1 and synchronized with our servers in later phases
          to personalize your experience.
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-text-primary">3. Data Sharing</h3>
        <p>
          We do not sell your personal data. Artist applications are reviewed by support
          staff and administrators solely for account verification purposes.
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-text-primary">4. Your Rights</h3>
        <p>
          You may update your profile information or request account deletion at any
          time from the app settings page.
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-text-primary">5. Consent</h3>
        <p>
          By creating an account, you agree to our terms of service and consent to the
          collection and use of your information as described in this policy.
        </p>
      </section>
    </div>
  );
}
