import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import SEO from "@/components/SEO";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        titleKey="seo.privacyPolicy.title"
        descriptionKey="seo.privacyPolicy.description"
        path="/privacy-policy"
      />
      
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="px-4 py-6 space-y-6 text-sm text-muted-foreground">
          <p className="text-xs">Last updated: December 17, 2024</p>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Introduction</h2>
            <p>
              Welcome to CarNetworx ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Information We Collect</h2>
            
            <h3 className="font-medium text-foreground">Personal Information</h3>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name and email address when you create an account</li>
              <li>Phone number (optional, for contact purposes)</li>
              <li>Profile picture</li>
              <li>Location data (city, state, and coordinates for proximity-based features)</li>
            </ul>

            <h3 className="font-medium text-foreground">Listing Information</h3>
            <p>When you create listings, we collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vehicle details (make, model, year, VIN, condition, mileage)</li>
              <li>Part specifications and compatibility information</li>
              <li>Service descriptions and availability</li>
              <li>Photos and images you upload</li>
              <li>Pricing and location information</li>
            </ul>

            <h3 className="font-medium text-foreground">Usage Information</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Device information and identifiers</li>
              <li>Log data and app usage statistics</li>
              <li>Messages exchanged through our platform</li>
              <li>Search queries and browsing history within the app</li>
            </ul>

            <h3 className="font-medium text-foreground">Location Data</h3>
            <p>
              With your permission, we collect precise location data to provide proximity-based listing discovery, show nearby vehicles, parts, and services, and display your location on maps for buyers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your account</li>
              <li>Display and promote your listings to potential buyers</li>
              <li>Enable communication between buyers and sellers</li>
              <li>Provide location-based search and discovery features</li>
              <li>Process and display reviews and ratings</li>
              <li>Send push notifications about messages, price drops, and nearby listings</li>
              <li>Improve our services and user experience</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Information Sharing</h2>
            <p>We may share your information in the following circumstances:</p>
            
            <h3 className="font-medium text-foreground">Public Information</h3>
            <p>
              Your public profile (name, avatar, ratings, general location) and listings are visible to all users. VINs are only visible to listing owners.
            </p>

            <h3 className="font-medium text-foreground">With Other Users</h3>
            <p>
              When you message another user or they contact you about a listing, they can see your profile information and communicate with you through our platform.
            </p>

            <h3 className="font-medium text-foreground">Service Providers</h3>
            <p>
              We may share information with third-party service providers who perform services on our behalf, including cloud hosting, analytics, and push notification services.
            </p>

            <h3 className="font-medium text-foreground">Legal Requirements</h3>
            <p>
              We may disclose information if required by law or in response to valid legal requests.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information, including encryption, secure authentication, and access controls. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Your Privacy Choices</h2>
            <p>You can control your privacy through:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Profile Settings:</strong> Choose whether to display your phone number on listings</li>
              <li><strong>Messaging Preferences:</strong> Control who can send you messages</li>
              <li><strong>Online Status:</strong> Choose whether to show your online status</li>
              <li><strong>Location Permissions:</strong> Grant or revoke location access at any time</li>
              <li><strong>Notification Settings:</strong> Manage push notification preferences</li>
              <li><strong>Account Deletion:</strong> Request complete deletion of your account and data</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. You can delete your account at any time through Security & Privacy settings, which will remove your profile, listings, messages, and associated data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Children's Privacy</h2>
            <p>
              CarNetworx is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us through the app's Help Center or email us at privacy@carnetworx.app.
            </p>
          </section>

          <div className="pt-6 pb-20" />
        </div>
      </ScrollArea>
    </div>
  );
};

export default PrivacyPolicy;
