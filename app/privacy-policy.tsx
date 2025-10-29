import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function PrivacyPolicy() {
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
        <Text className="text-gray-900 text-xl font-semibold">Privacy Policy</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        <Text className="text-gray-600 text-sm mb-6">
          Last Updated: October 19, 2025
        </Text>

        <Section title="1. Introduction">
          <Paragraph>
            Welcome to ClearSkin AI ("we," "our," or "us"). We are committed to protecting your privacy and personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application 
            (the "App"). ClearSkin AI is operated by Teddy-Michael Sannan and is based in Ontario, Canada.
          </Paragraph>
          <Paragraph>
            By using the App, you agree to the collection and use of information in accordance with this Privacy Policy. 
            If you do not agree with our policies and practices, please do not use the App.
          </Paragraph>
        </Section>

        <Section title="2. Information We Collect">
          <Important>
            LEGAL NOTICE: By using this App, you acknowledge that all data collection is for informational and educational purposes only. 
            We do not provide medical advice and are not responsible for any health outcomes.
          </Important>
          <Subsection title="2.1 Personal Information">
            <Paragraph>
              When you create an account, we collect:
            </Paragraph>
            <BulletPoint>Email address</BulletPoint>
            <BulletPoint>Password (encrypted)</BulletPoint>
            <BulletPoint>Full name (optional, if provided)</BulletPoint>
          </Subsection>

          <Subsection title="2.2 Skin Analysis Data">
            <Paragraph>
              When you use our skin analysis features, we collect:
            </Paragraph>
            <BulletPoint>Photographs of your skin taken through the App</BulletPoint>
            <BulletPoint>Analysis results and recommendations</BulletPoint>
            <BulletPoint>Skin condition assessments</BulletPoint>
            <BulletPoint>Historical scan data and progress tracking</BulletPoint>
          </Subsection>

          <Subsection title="2.3 Payment Information">
            <Paragraph>
              When you subscribe to premium features, payment processing is handled by Stripe. We do not store your full credit card details. 
              Stripe collects and processes:
            </Paragraph>
            <BulletPoint>Payment card information</BulletPoint>
            <BulletPoint>Billing address</BulletPoint>
            <BulletPoint>Transaction history</BulletPoint>
          </Subsection>

          <Subsection title="2.4 Contact and Communication Data">
            <Paragraph>
              When you contact us through the App's contact form, we collect:
            </Paragraph>
            <BulletPoint>Your contact messages and inquiries</BulletPoint>
            <BulletPoint>Subject lines and message content</BulletPoint>
            <BulletPoint>Your email address for response purposes</BulletPoint>
            <BulletPoint>Timestamp of your communication</BulletPoint>
          </Subsection>

          <Subsection title="2.5 Automatically Collected Information">
            <Paragraph>
              When you use the App, we may automatically collect:
            </Paragraph>
            <BulletPoint>Device information (model, operating system, unique device identifiers)</BulletPoint>
            <BulletPoint>App usage data (features accessed, time spent in app)</BulletPoint>
            <BulletPoint>Camera permissions (only when you actively use the scan feature)</BulletPoint>
            <BulletPoint>Error logs and crash reports</BulletPoint>
          </Subsection>
        </Section>

        <Section title="3. How We Use Your Information">
          <Paragraph>
            We use the information we collect to:
          </Paragraph>
          <BulletPoint>Provide and maintain the App's skin analysis features</BulletPoint>
          <BulletPoint>Process your AI-powered skin assessments using OpenAI's API</BulletPoint>
          <BulletPoint>Track your skin health progress over time</BulletPoint>
          <BulletPoint>Process subscription payments and manage your account</BulletPoint>
          <BulletPoint>Send you important updates about your account or the App</BulletPoint>
          <BulletPoint>Respond to your inquiries and provide customer support through our contact form</BulletPoint>
          <BulletPoint>Process and respond to your contact form submissions</BulletPoint>
          <BulletPoint>Improve our App's features and user experience</BulletPoint>
          <BulletPoint>Detect, prevent, and address technical issues or fraudulent activity</BulletPoint>
          <BulletPoint>Comply with legal obligations</BulletPoint>
        </Section>

        <Section title="4. Third-Party Services">
          <Paragraph>
            We use the following third-party services that may collect and process your information:
          </Paragraph>

          <Subsection title="4.1 Supabase (Database & Authentication)">
            <Paragraph>
              We use Supabase to store your account information, scan data, and manage authentication. 
              Supabase is hosted on secure servers and complies with industry-standard security practices.
            </Paragraph>
          </Subsection>

          <Subsection title="4.2 OpenAI (AI Processing)">
            <Paragraph>
              Your skin photos are processed through OpenAI's API to provide AI-powered analysis and recommendations. 
              OpenAI processes this data in accordance with their privacy policy and data processing agreements. 
              Images are processed for analysis purposes only and are not used to train OpenAI's models.
            </Paragraph>
          </Subsection>

          <Subsection title="4.3 Stripe (Payment Processing)">
            <Paragraph>
              All payment transactions are processed by Stripe. We do not store your full payment card details. 
              Stripe's use of your personal information is governed by their privacy policy.
            </Paragraph>
          </Subsection>

          <Subsection title="4.4 Resend (Email Services)">
            <Paragraph>
              We use Resend to send emails, including contact form responses and data export emails. 
              Your email address and message content are processed by Resend in accordance with their privacy policy.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="5. Data Retention">
          <Paragraph>
            We retain your personal information and skin analysis data until you delete your account. 
            When you delete your account:
          </Paragraph>
          <BulletPoint>All your personal information is permanently deleted</BulletPoint>
          <BulletPoint>All your scan photos and analysis results are permanently deleted</BulletPoint>
          <BulletPoint>Your subscription is cancelled (if active)</BulletPoint>
          <BulletPoint>Your contact form submissions and communication history are permanently deleted</BulletPoint>
          <BulletPoint>Some financial records may be retained as required by law for tax and accounting purposes</BulletPoint>
        </Section>

        <Section title="6. Data Security">
          <Paragraph>
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </Paragraph>
          <BulletPoint>Encryption of data in transit and at rest</BulletPoint>
          <BulletPoint>Secure authentication protocols</BulletPoint>
          <BulletPoint>Regular security assessments</BulletPoint>
          <BulletPoint>Limited access to personal data by authorized personnel only</BulletPoint>
          <Paragraph>
            However, no method of transmission over the internet or electronic storage is 100% secure. 
            While we strive to use commercially acceptable means to protect your personal information, 
            we cannot guarantee its absolute security.
          </Paragraph>
        </Section>

        <Section title="7. Your Privacy Rights">
          <Subsection title="7.1 General Rights">
            <Paragraph>
              You have the right to:
            </Paragraph>
            <BulletPoint>Access your personal information</BulletPoint>
            <BulletPoint>Correct inaccurate or incomplete information</BulletPoint>
            <BulletPoint>Delete your account and all associated data</BulletPoint>
            <BulletPoint>Withdraw consent for data processing</BulletPoint>
            <BulletPoint>Export your data in a portable format</BulletPoint>
          </Subsection>

          <Subsection title="7.2 Canadian Residents (PIPEDA)">
            <Paragraph>
              Under Canadian privacy law, you have the right to access your personal information and request corrections. 
              You may also withdraw consent for certain data processing activities.
            </Paragraph>
          </Subsection>

          <Subsection title="7.3 European Residents (GDPR)">
            <Paragraph>
              If you are located in the European Economic Area, you have additional rights under GDPR, including:
            </Paragraph>
            <BulletPoint>Right to data portability</BulletPoint>
            <BulletPoint>Right to restrict processing</BulletPoint>
            <BulletPoint>Right to object to processing</BulletPoint>
            <BulletPoint>Right to lodge a complaint with a supervisory authority</BulletPoint>
          </Subsection>

          <Subsection title="7.4 California Residents (CCPA)">
            <Paragraph>
              California residents have the right to:
            </Paragraph>
            <BulletPoint>Know what personal information is collected, used, shared, or sold</BulletPoint>
            <BulletPoint>Delete personal information held by businesses</BulletPoint>
            <BulletPoint>Opt-out of the sale of personal information (Note: We do not sell personal information)</BulletPoint>
            <BulletPoint>Non-discrimination for exercising their privacy rights</BulletPoint>
          </Subsection>
        </Section>

        <Section title="8. Children's Privacy">
          <Paragraph>
            Our App is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. 
            If you are a parent or guardian and believe your child under 13 has provided us with personal information, 
            please contact us at contact@clearskinai.ca, and we will delete such information from our systems.
          </Paragraph>
          <Paragraph>
            For users aged 13-18, we recommend parental guidance when using the App and its skin analysis features.
          </Paragraph>
        </Section>

        <Section title="9. International Data Transfers">
          <Paragraph>
            Your information may be transferred to and processed in countries other than your country of residence. 
            These countries may have different data protection laws. By using the App, you consent to the transfer 
            of your information to Canada and other countries where our service providers operate.
          </Paragraph>
        </Section>

        <Section title="10. Changes to This Privacy Policy">
          <Paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
            within the App and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </Paragraph>
          <Paragraph>
            Your continued use of the App after any modifications to the Privacy Policy will constitute your acknowledgment 
            of the modifications and your consent to abide by the modified Privacy Policy.
          </Paragraph>
        </Section>

        <Section title="11. Legal Disclaimers and Limitations">
          <Important>
            CRITICAL LEGAL NOTICE: This Privacy Policy is subject to our Terms of Service, which contain comprehensive legal disclaimers and limitations of liability.
          </Important>
          <Subsection title="11.1 Medical and Health Disclaimers">
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>All data collection and processing is for informational and educational purposes only</BulletPoint>
            <BulletPoint>We do not provide medical advice, diagnosis, or treatment</BulletPoint>
            <BulletPoint>We are not responsible for any health outcomes or medical decisions based on our analysis</BulletPoint>
            <BulletPoint>You should consult with healthcare professionals for any medical concerns</BulletPoint>
            <BulletPoint>We disclaim all liability for any adverse health effects or medical complications</BulletPoint>
          </Subsection>

          <Subsection title="11.2 Product Recommendation Disclaimers">
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>Any product recommendations are generated by AI and may not be suitable for your specific needs</BulletPoint>
            <BulletPoint>We are not responsible for any adverse reactions to recommended products</BulletPoint>
            <BulletPoint>You are solely responsible for researching and testing any recommended products</BulletPoint>
            <BulletPoint>We disclaim all liability for product-related injuries or damages</BulletPoint>
            <BulletPoint>You assume all risks associated with using recommended products</BulletPoint>
          </Subsection>

          <Subsection title="11.3 Data Accuracy and Reliability">
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>All AI-generated analysis and recommendations may contain errors or inaccuracies</BulletPoint>
            <BulletPoint>We do not guarantee the accuracy, reliability, or completeness of any analysis results</BulletPoint>
            <BulletPoint>You should not rely solely on our analysis for important health or skincare decisions</BulletPoint>
            <BulletPoint>We are not liable for any decisions made based on our analysis or recommendations</BulletPoint>
          </Subsection>

          <Subsection title="11.4 International Data Protection Compliance">
            <Important>
              INTERNATIONAL DATA PROTECTION DISCLAIMER: We comply with Canadian privacy laws and disclaim liability under foreign data protection regulations.
            </Important>
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>We comply with Canadian privacy laws (PIPEDA) as our primary legal framework</BulletPoint>
            <BulletPoint>We do not guarantee compliance with GDPR, CCPA, or other foreign data protection laws</BulletPoint>
            <BulletPoint>You waive any rights under foreign data protection regulations</BulletPoint>
            <BulletPoint>You consent to Canadian data protection standards</BulletPoint>
            <BulletPoint>We disclaim liability for any violations of foreign data protection laws</BulletPoint>
            <BulletPoint>You agree that Canadian privacy protection is adequate</BulletPoint>
            <BulletPoint>You will not seek remedies under foreign data protection statutes</BulletPoint>
            <BulletPoint>You consent to Canadian legal standards for all data-related claims</BulletPoint>
          </Subsection>

          <Subsection title="11.5 International Jurisdiction and Legal Compliance">
            <Important>
              INTERNATIONAL JURISDICTION: All data protection matters shall be governed by Canadian law and resolved in Canadian courts.
            </Important>
            <Paragraph>
              You expressly acknowledge and agree that:
            </Paragraph>
            <BulletPoint>All data protection disputes shall be resolved in Canada under Canadian law</BulletPoint>
            <BulletPoint>You waive any right to bring data protection claims in your home country</BulletPoint>
            <BulletPoint>You consent to Canadian jurisdiction for all privacy-related matters</BulletPoint>
            <BulletPoint>You agree that Canadian privacy laws provide adequate protection</BulletPoint>
            <BulletPoint>You will not seek enforcement of foreign data protection judgments</BulletPoint>
            <BulletPoint>You consent to Canadian legal proceedings for all privacy claims</BulletPoint>
          </Subsection>
        </Section>

        <Section title="12. Contact Us">
          <Paragraph>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
          </Paragraph>
          <Paragraph>
            Email: contact@clearskinai.ca{"\n"}
            Name: ClearSkin AI (Operated by Teddy-Michael Sannan){"\n"}
            Location: Ontario, Canada
          </Paragraph>
          <Paragraph>
            We will respond to your inquiry within 30 days of receipt.
          </Paragraph>
        </Section>

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
