import { useState } from 'react';
import { actions } from 'astro:actions';
import { TurnstileWidget } from '../common/TurnstileWidget';

interface InquiryFormProps {
  productInterest?: string;
}

// Turnstile Site Key - fetched from environment variables, uses test key for local development
const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export function InquiryForm({ productInterest }: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Add Turnstile token
    if (turnstileToken) {
      formData.set('cfTurnstileToken', turnstileToken);
    }

    try {
      const result = await actions.inquiry(formData);

      if (result.error) {
        setError(result.error.message || 'Submission failed');
        return;
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();

    } catch (err) {
      console.error('Submit error:', err);
      setError('Submission failed, please try again later');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-secondary-900 mb-2">Submission Successful!</h3>
        <p className="text-secondary-600 mb-6">We have received your inquiry and will contact you within 24 hours.</p>
        <button
          onClick={() => setSuccess(false)}
          className="btn-secondary"
        >
          Submit Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot field - hidden from users */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="label">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            required
            className="input"
            placeholder="Enter company name"
          />
        </div>

        {/* Contact Person */}
        <div>
          <label htmlFor="contactName" className="label">
            Contact Person <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            required
            className="input"
            placeholder="Enter contact name"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="input"
            placeholder="example@company.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="input"
            placeholder="+86 xxx xxxx xxxx"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Country */}
        <div>
          <label htmlFor="country" className="label">Country/Region</label>
          <select id="country" name="country" className="input">
            <option value="">Please select</option>
            <option value="China">China</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
            <option value="Japan">Japan</option>
            <option value="South Korea">South Korea</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="label">Desired Quantity</label>
          <input
            type="text"
            id="quantity"
            name="quantity"
            className="input"
            placeholder="e.g., 1,000 pcs/month"
          />
        </div>
      </div>

      {/* Product Interest */}
      <div>
        <label htmlFor="productInterest" className="label">Product of Interest</label>
        <input
          type="text"
          id="productInterest"
          name="productInterest"
          className="input"
          placeholder="Enter product name or model number"
          defaultValue={productInterest}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="label">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="input resize-none"
          placeholder="Please describe your requirements in detail, including product specifications, intended use, etc."
        />
      </div>

      {/* Privacy Consent */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="privacyConsent"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          required
        />
        <label htmlFor="privacyConsent" className="text-sm text-secondary-600">
          I have read and agree to the{' '}
          <a href="/privacy" target="_blank" className="text-primary-600 hover:underline">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" target="_blank" className="text-primary-600 hover:underline">
            Terms & Conditions
          </a>{' '}
          <span className="text-red-500">*</span>
        </label>
      </div>

      {/* Cloudflare Turnstile CAPTCHA */}
      <TurnstileWidget
        siteKey={TURNSTILE_SITE_KEY}
        onVerify={(token) => setTurnstileToken(token)}
        onError={(err) => setError(err)}
        theme="auto"
        language="en"
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !turnstileToken || !privacyAccepted}
        className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        title={!turnstileToken ? 'Please complete the CAPTCHA first' : !privacyAccepted ? 'Please accept the privacy policy' : undefined}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : !turnstileToken ? 'Please complete the CAPTCHA first' : !privacyAccepted ? 'Please accept the privacy policy' : 'Submit Inquiry'}
      </button>

      <p className="text-sm text-secondary-500 text-center">
        By submitting, you agree to our <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
      </p>
    </form>
  );
}
