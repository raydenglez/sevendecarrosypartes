import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import SEO from "@/components/SEO";

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        titleKey="seo.termsConditions.title"
        descriptionKey="seo.termsConditions.description"
        path="/terms-conditions"
      />
      
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Terms & Conditions</h1>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="px-4 py-6 space-y-6 text-sm text-muted-foreground">
          <p className="text-xs">Last updated: December 17, 2024</p>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using CarNetworx ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
            <p>
              CarNetworx is a mobile marketplace platform that connects buyers and sellers of vehicles, automotive parts, and automotive services. We provide the platform for users to list, discover, and communicate about automotive products and services. CarNetworx does not participate in or guarantee any transactions between users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. User Accounts</h2>
            
            <h3 className="font-medium text-foreground">Registration</h3>
            <p>
              To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
            </p>

            <h3 className="font-medium text-foreground">Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
            </p>

            <h3 className="font-medium text-foreground">Age Requirement</h3>
            <p>
              You must be at least 18 years old to create an account and use CarNetworx.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Post false, misleading, or fraudulent listings</li>
              <li>Misrepresent the condition, features, or history of vehicles or parts</li>
              <li>Use fake VINs or falsified vehicle documentation</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Spam or send unsolicited messages</li>
              <li>Attempt to manipulate ratings or reviews</li>
              <li>Use the App for any illegal purposes</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with the operation of the App</li>
              <li>Create multiple accounts to circumvent restrictions</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Listings</h2>
            
            <h3 className="font-medium text-foreground">Seller Responsibilities</h3>
            <p>As a seller, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate and complete information about your listings</li>
              <li>Only list items you have the legal right to sell</li>
              <li>Respond to buyer inquiries in a timely manner</li>
              <li>Honor the terms of any agreed-upon transaction</li>
              <li>Update or remove listings when items are no longer available</li>
            </ul>

            <h3 className="font-medium text-foreground">Prohibited Items</h3>
            <p>You may not list:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Stolen vehicles or parts</li>
              <li>Vehicles with undisclosed salvage titles or major damage</li>
              <li>Counterfeit or illegal parts</li>
              <li>Items that violate intellectual property rights</li>
              <li>Any items prohibited by law</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Transactions</h2>
            <p>
              CarNetworx is a platform that facilitates connections between buyers and sellers. We are not a party to any transaction between users. All transactions are conducted directly between buyers and sellers, who are solely responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Negotiating and agreeing on price and terms</li>
              <li>Verifying the condition and authenticity of items</li>
              <li>Completing payment and transfer of ownership</li>
              <li>Handling any disputes that may arise</li>
            </ul>
            <p className="mt-2">
              We strongly recommend that buyers inspect vehicles in person, verify VINs, request vehicle history reports, and use secure payment methods.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Reviews and Ratings</h2>
            <p>
              Users may leave reviews and ratings for sellers based on their experience. Reviews must be honest, accurate, and based on actual interactions. We reserve the right to remove reviews that violate our guidelines or contain inappropriate content.
            </p>
            <p>
              To leave a review, you must have contacted the seller through our messaging system. Reviews cannot be left on your own listings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Intellectual Property</h2>
            <p>
              The CarNetworx name, logo, and all related content, features, and functionality are owned by CarNetworx and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              By posting content on CarNetworx, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the operation of the App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Disclaimers</h2>
            <p>
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The accuracy of listings or user-provided information</li>
              <li>The quality, safety, or legality of listed items</li>
              <li>The ability of sellers to sell or buyers to pay</li>
              <li>That the App will be uninterrupted or error-free</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CARNETWORX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP OR ANY TRANSACTIONS CONDUCTED THROUGH IT.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless CarNetworx, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the App, your listings, or your violation of these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">12. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violations of these Terms or for any other reason at our sole discretion. You may delete your account at any time through the Security & Privacy settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms in the App. Your continued use of the App after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which CarNetworx operates, without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">15. Contact Us</h2>
            <p>
              If you have questions about these Terms and Conditions, please contact us through the app's Help Center or email us at legal@carnetworx.app.
            </p>
          </section>

          <div className="pt-6 pb-20" />
        </div>
      </ScrollArea>
    </div>
  );
};

export default TermsConditions;
