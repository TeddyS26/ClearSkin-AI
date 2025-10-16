import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function TermsOfService() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-5 py-4 border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mb-3 active:opacity-60"
          android_ripple={{ color: "#9CA3AF20" }}
        >
          <ArrowLeft size={24} color="#374151" strokeWidth={2.5} />
          <Text className="text-gray-700 font-semibold text-base ml-1">Back</Text>
        </Pressable>
        <Text className="text-gray-900 text-xl font-semibold">Terms of Service</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        <Text className="text-gray-600 text-sm mb-6">
          Last Updated: October 15, 2025
        </Text>

        <Section title="1. Acceptance of Terms">
          <Paragraph>
            Welcome to ClearSkin AI. These Terms of Service ("Terms") constitute a legally binding agreement between you 
            and ClearSkin AI, operated by Teddy-Michael Sannan ("we," "our," or "us"), concerning your access to and use 
            of the ClearSkin AI mobile application (the "App").
          </Paragraph>
          <Paragraph>
            By creating an account, accessing, or using the App, you agree to be bound by these Terms and our Privacy Policy. 
            If you do not agree to these Terms, you must not use the App.
          </Paragraph>
        </Section>

        <Section title="2. Eligibility">
          <Paragraph>
            You must be at least 13 years old to use the App. By using the App, you represent and warrant that:
          </Paragraph>
          <BulletPoint>You are at least 13 years of age</BulletPoint>
          <BulletPoint>You have the legal capacity to enter into these Terms</BulletPoint>
          <BulletPoint>If you are between 13 and 18 years old, you have obtained parental or guardian consent to use the App</BulletPoint>
          <BulletPoint>You will comply with all applicable laws and regulations</BulletPoint>
        </Section>

        <Section title="3. Description of Service">
          <Paragraph>
            ClearSkin AI is a skin analysis application that uses artificial intelligence to:
          </Paragraph>
          <BulletPoint>Analyze photographs of your skin</BulletPoint>
          <BulletPoint>Identify potential skin conditions and concerns</BulletPoint>
          <BulletPoint>Provide personalized skincare recommendations</BulletPoint>
          <BulletPoint>Track your skin health progress over time</BulletPoint>
          <BulletPoint>Suggest skincare routines and products</BulletPoint>
        </Section>

        <Section title="4. Medical Disclaimer">
          <Important>
            IMPORTANT: ClearSkin AI is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment.
          </Important>
          <Paragraph>
            The App is intended for informational and educational purposes only. The analysis and recommendations provided by the App:
          </Paragraph>
          <BulletPoint>Are not a substitute for professional medical advice, diagnosis, or treatment</BulletPoint>
          <BulletPoint>Should not be used to diagnose or treat any health condition</BulletPoint>
          <BulletPoint>May not be accurate or suitable for your specific situation</BulletPoint>
          <BulletPoint>Should not replace consultations with qualified healthcare professionals</BulletPoint>
          <Paragraph>
            Always seek the advice of your physician, dermatologist, or other qualified health provider with any questions 
            you may have regarding a skin condition or medical treatment. Never disregard professional medical advice or 
            delay seeking it because of information provided by the App.
          </Paragraph>
          <Paragraph>
            If you have a medical emergency or serious skin condition, contact a healthcare provider immediately or call 
            emergency services.
          </Paragraph>
        </Section>

        <Section title="5. User Accounts">
          <Subsection title="5.1 Account Creation">
            <Paragraph>
              To use certain features of the App, you must create an account by providing:
            </Paragraph>
            <BulletPoint>A valid email address</BulletPoint>
            <BulletPoint>A secure password</BulletPoint>
            <BulletPoint>Optional profile information</BulletPoint>
          </Subsection>

          <Subsection title="5.2 Account Security">
            <Paragraph>
              You are responsible for:
            </Paragraph>
            <BulletPoint>Maintaining the confidentiality of your account credentials</BulletPoint>
            <BulletPoint>All activities that occur under your account</BulletPoint>
            <BulletPoint>Notifying us immediately of any unauthorized access or security breach</BulletPoint>
          </Subsection>

          <Subsection title="5.3 Account Termination">
            <Paragraph>
              You may delete your account at any time through the App's settings. Upon deletion:
            </Paragraph>
            <BulletPoint>All your personal data will be permanently deleted</BulletPoint>
            <BulletPoint>Your subscription will be cancelled</BulletPoint>
            <BulletPoint>You will lose access to all features and saved data</BulletPoint>
          </Subsection>
        </Section>

        <Section title="6. Subscriptions and Payments">
          <Subsection title="6.1 Free and Premium Features">
            <Paragraph>
              The App offers both free and premium subscription features. Premium features include:
            </Paragraph>
            <BulletPoint>Unlimited skin scans and analyses</BulletPoint>
            <BulletPoint>Advanced AI-powered recommendations</BulletPoint>
            <BulletPoint>Detailed progress tracking and history</BulletPoint>
            <BulletPoint>Personalized skincare routines</BulletPoint>
            <BulletPoint>Priority customer support</BulletPoint>
          </Subsection>

          <Subsection title="6.2 Subscription Pricing and Billing">
            <Paragraph>
              Subscription pricing is displayed in the App at the time of purchase. By subscribing, you agree to:
            </Paragraph>
            <BulletPoint>Pay the subscription fee shown at checkout</BulletPoint>
            <BulletPoint>Automatic recurring billing until you cancel</BulletPoint>
            <BulletPoint>Prices may change with 30 days notice to active subscribers</BulletPoint>
          </Subsection>

          <Subsection title="6.3 Payment Processing">
            <Paragraph>
              All payments are processed securely through Stripe. By providing payment information, you represent that:
            </Paragraph>
            <BulletPoint>You are authorized to use the payment method</BulletPoint>
            <BulletPoint>You will maintain sufficient funds or credit for recurring payments</BulletPoint>
            <BulletPoint>You authorize us to charge the applicable fees to your payment method</BulletPoint>
          </Subsection>

          <Subsection title="6.4 Cancellation and Refunds">
            <Paragraph>
              You may cancel your subscription at any time through the App's settings or the Stripe billing portal. Upon cancellation:
            </Paragraph>
            <BulletPoint>You will retain access to premium features until the end of your current billing period</BulletPoint>
            <BulletPoint>No refunds will be provided for partial subscription periods</BulletPoint>
            <BulletPoint>You will not be charged for subsequent billing periods</BulletPoint>
            <Paragraph>
              Refunds may be provided at our sole discretion in cases of technical errors or exceptional circumstances.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="7. User Content and Data">
          <Subsection title="7.1 Content You Provide">
            <Paragraph>
              You retain ownership of all photos and content you submit to the App. By submitting content, you grant us a license to:
            </Paragraph>
            <BulletPoint>Process your photos through AI analysis services</BulletPoint>
            <BulletPoint>Store your data securely on our servers</BulletPoint>
            <BulletPoint>Display your analysis results and history to you</BulletPoint>
          </Subsection>

          <Subsection title="7.2 Contact Form Usage">
            <Paragraph>
              When using our contact form, you agree to:
            </Paragraph>
            <BulletPoint>Provide accurate and truthful information</BulletPoint>
            <BulletPoint>Not submit spam, abusive, or inappropriate messages</BulletPoint>
            <BulletPoint>Respect our support team and maintain professional communication</BulletPoint>
            <BulletPoint>Allow us to use your contact information to respond to your inquiry</BulletPoint>
          </Subsection>

          <Subsection title="7.3 Prohibited Content">
            <Paragraph>
              You may not submit content that:
            </Paragraph>
            <BulletPoint>Contains images of individuals other than yourself without their consent</BulletPoint>
            <BulletPoint>Violates any third-party rights</BulletPoint>
            <BulletPoint>Contains inappropriate, offensive, or illegal content</BulletPoint>
            <BulletPoint>Contains malware, viruses, or harmful code</BulletPoint>
            <BulletPoint>Includes spam, harassment, or abusive language in contact form submissions</BulletPoint>
          </Subsection>
        </Section>

        <Section title="8. Acceptable Use">
          <Paragraph>
            You agree not to:
          </Paragraph>
          <BulletPoint>Use the App for any illegal or unauthorized purpose</BulletPoint>
          <BulletPoint>Attempt to gain unauthorized access to our systems or other users' accounts</BulletPoint>
          <BulletPoint>Reverse engineer, decompile, or disassemble the App</BulletPoint>
          <BulletPoint>Use automated systems (bots, scrapers) to access the App</BulletPoint>
          <BulletPoint>Interfere with or disrupt the App's functionality</BulletPoint>
          <BulletPoint>Violate any applicable laws or regulations</BulletPoint>
          <BulletPoint>Impersonate another person or entity</BulletPoint>
          <BulletPoint>Collect or harvest information about other users</BulletPoint>
        </Section>

        <Section title="9. Intellectual Property">
          <Paragraph>
            All content, features, and functionality of the App, including but not limited to:
          </Paragraph>
          <BulletPoint>Software code and algorithms</BulletPoint>
          <BulletPoint>Text, graphics, logos, and images</BulletPoint>
          <BulletPoint>User interface and design</BulletPoint>
          <BulletPoint>Trademarks and branding</BulletPoint>
          <Paragraph>
            are owned by ClearSkin AI or our licensors and are protected by Canadian and international copyright, trademark, 
            and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the App 
            without our express written permission.
          </Paragraph>
        </Section>

        <Section title="10. Third-Party Services">
          <Paragraph>
            The App integrates with third-party services, including:
          </Paragraph>
          <BulletPoint>OpenAI for AI-powered skin analysis</BulletPoint>
          <BulletPoint>Stripe for payment processing</BulletPoint>
          <BulletPoint>Supabase for data storage and authentication</BulletPoint>
          <BulletPoint>Resend for email communications and contact form processing</BulletPoint>
          <Paragraph>
            Your use of these third-party services is subject to their respective terms of service and privacy policies. 
            We are not responsible for the actions, content, or policies of these third-party services.
          </Paragraph>
        </Section>

        <Section title="11. Disclaimers and Limitations of Liability">
          <Subsection title="11.1 Disclaimer of Warranties">
            <Paragraph>
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </Paragraph>
            <BulletPoint>Warranties of merchantability, fitness for a particular purpose, or non-infringement</BulletPoint>
            <BulletPoint>Warranties that the App will be uninterrupted, error-free, or secure</BulletPoint>
            <BulletPoint>Warranties regarding the accuracy, reliability, or completeness of analysis results</BulletPoint>
          </Subsection>

          <Subsection title="11.2 Limitation of Liability">
            <Paragraph>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLEARSKIN AI AND ITS OPERATORS, EMPLOYEES, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR:
            </Paragraph>
            <BulletPoint>Any indirect, incidental, special, consequential, or punitive damages</BulletPoint>
            <BulletPoint>Loss of profits, revenue, data, or business opportunities</BulletPoint>
            <BulletPoint>Personal injury or property damage resulting from your use of the App</BulletPoint>
            <BulletPoint>Any reliance on information provided by the App</BulletPoint>
            <Paragraph>
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE APP SHALL NOT EXCEED THE AMOUNT 
              YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100 CAD, WHICHEVER IS GREATER.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="12. Indemnification">
          <Paragraph>
            You agree to indemnify, defend, and hold harmless ClearSkin AI, its operators, employees, and service providers 
            from any claims, losses, liabilities, damages, costs, and expenses (including reasonable attorneys' fees) arising from:
          </Paragraph>
          <BulletPoint>Your use of the App</BulletPoint>
          <BulletPoint>Your violation of these Terms</BulletPoint>
          <BulletPoint>Your violation of any rights of another person or entity</BulletPoint>
          <BulletPoint>Content you submit to the App</BulletPoint>
        </Section>

        <Section title="13. Changes to the Service">
          <Paragraph>
            We reserve the right to:
          </Paragraph>
          <BulletPoint>Modify, suspend, or discontinue any part of the App at any time</BulletPoint>
          <BulletPoint>Update features, pricing, or terms with reasonable notice</BulletPoint>
          <BulletPoint>Refuse service to anyone for any reason</BulletPoint>
          <Paragraph>
            We will notify you of significant changes through the App or via email. Your continued use of the App 
            after such changes constitutes acceptance of the new terms.
          </Paragraph>
        </Section>

        <Section title="14. Termination">
          <Paragraph>
            We may terminate or suspend your access to the App immediately, without prior notice, if:
          </Paragraph>
          <BulletPoint>You breach these Terms</BulletPoint>
          <BulletPoint>You engage in fraudulent or illegal activity</BulletPoint>
          <BulletPoint>We are required to do so by law</BulletPoint>
          <BulletPoint>We discontinue the App</BulletPoint>
          <Paragraph>
            Upon termination, your right to use the App will cease immediately, and we may delete your account and data.
          </Paragraph>
        </Section>

        <Section title="15. Governing Law and Dispute Resolution">
          <Paragraph>
            These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, 
            without regard to conflict of law principles.
          </Paragraph>
          <Paragraph>
            Any dispute arising from these Terms or your use of the App shall be resolved through:
          </Paragraph>
          <BulletPoint>Good faith negotiation between the parties</BulletPoint>
          <BulletPoint>If negotiation fails, binding arbitration in Ontario, Canada</BulletPoint>
          <BulletPoint>You waive any right to participate in class action lawsuits or class-wide arbitration</BulletPoint>
        </Section>

        <Section title="16. Apple App Store Terms">
          <Paragraph>
            If you download the App from the Apple App Store, you acknowledge and agree that:
          </Paragraph>
          <BulletPoint>These Terms are between you and ClearSkin AI, not Apple</BulletPoint>
          <BulletPoint>Apple has no obligation to provide maintenance or support services</BulletPoint>
          <BulletPoint>Apple is not responsible for any product warranties</BulletPoint>
          <BulletPoint>Apple is not responsible for addressing any claims relating to the App</BulletPoint>
          <BulletPoint>You will comply with all applicable third-party terms when using the App</BulletPoint>
          <BulletPoint>Apple and its subsidiaries are third-party beneficiaries of these Terms</BulletPoint>
        </Section>

        <Section title="17. Google Play Store Terms">
          <Paragraph>
            If you download the App from the Google Play Store, you acknowledge and agree that:
          </Paragraph>
          <BulletPoint>These Terms are between you and ClearSkin AI, not Google</BulletPoint>
          <BulletPoint>You will comply with Google Play's Terms of Service</BulletPoint>
          <BulletPoint>Google is not responsible for the App or its content</BulletPoint>
          <BulletPoint>Google has no obligation to provide maintenance or support</BulletPoint>
        </Section>

        <Section title="18. General Provisions">
          <Subsection title="18.1 Entire Agreement">
            <Paragraph>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and ClearSkin AI 
              regarding the App.
            </Paragraph>
          </Subsection>

          <Subsection title="18.2 Severability">
            <Paragraph>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </Paragraph>
          </Subsection>

          <Subsection title="18.3 Waiver">
            <Paragraph>
              Our failure to enforce any right or provision of these Terms will not constitute a waiver of such right or provision.
            </Paragraph>
          </Subsection>

          <Subsection title="18.4 Assignment">
            <Paragraph>
              You may not assign or transfer these Terms or your account without our prior written consent. 
              We may assign these Terms to any successor or affiliate.
            </Paragraph>
          </Subsection>

          <Subsection title="18.5 Force Majeure">
            <Paragraph>
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, 
              including acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, 
              network infrastructure failures, strikes, or shortages of transportation facilities, fuel, energy, labor, or materials.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="19. Updates to Terms">
          <Paragraph>
            We may update these Terms from time to time. We will notify you of any material changes by:
          </Paragraph>
          <BulletPoint>Posting the new Terms within the App</BulletPoint>
          <BulletPoint>Updating the "Last Updated" date</BulletPoint>
          <BulletPoint>Sending you an email notification (for significant changes)</BulletPoint>
          <Paragraph>
            Your continued use of the App after the updated Terms take effect constitutes your acceptance of the changes. 
            If you do not agree to the updated Terms, you must stop using the App and delete your account.
          </Paragraph>
        </Section>

        <Section title="20. Contact Information">
          <Paragraph>
            If you have any questions, concerns, or feedback regarding these Terms, please contact us at:
          </Paragraph>
          <Paragraph>
            Email: contact@clearskinai.ca{"\n"}
            Service Name: ClearSkin AI{"\n"}
            Operator: Teddy-Michael Sannan{"\n"}
            Location: Ontario, Canada
          </Paragraph>
          <Paragraph>
            We will respond to your inquiry within 30 days of receipt.
          </Paragraph>
        </Section>

        <Important>
          By using ClearSkin AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </Important>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-gray-900 text-lg font-semibold mb-3">{title}</Text>
      {children}
    </View>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-gray-900 text-base font-semibold mb-2">{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-gray-700 text-sm leading-6 mb-3">
      {children}
    </Text>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row mb-2 pl-3">
      <Text className="text-gray-700 text-sm mr-2">•</Text>
      <Text className="text-gray-700 text-sm leading-6 flex-1">{children}</Text>
    </View>
  );
}

function Important({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-r">
      <Text className="text-amber-900 text-sm font-semibold leading-6">
        {children}
      </Text>
    </View>
  );
}
