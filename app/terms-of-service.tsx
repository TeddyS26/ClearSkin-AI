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
          Last Updated: October 19, 2025
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

        <Section title="4. Medical Disclaimer and Product Liability">
          <Important>
            CRITICAL WARNING: ClearSkin AI is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment. 
            ALL PRODUCT RECOMMENDATIONS ARE FOR INFORMATIONAL PURPOSES ONLY.
          </Important>
          <Paragraph>
            The App is intended for informational and educational purposes only. The analysis and recommendations provided by the App:
          </Paragraph>
          <BulletPoint>Are not a substitute for professional medical advice, diagnosis, or treatment</BulletPoint>
          <BulletPoint>Should not be used to diagnose or treat any health condition</BulletPoint>
          <BulletPoint>May not be accurate or suitable for your specific situation</BulletPoint>
          <BulletPoint>Should not replace consultations with qualified healthcare professionals</BulletPoint>
          <BulletPoint>Do not guarantee the safety, efficacy, or suitability of any recommended products</BulletPoint>
          <BulletPoint>Cannot predict or prevent adverse reactions to skincare products</BulletPoint>
          <BulletPoint>Cannot diagnose, treat, cure, or prevent any medical conditions</BulletPoint>
          <BulletPoint>Cannot replace the expertise of qualified healthcare professionals</BulletPoint>
          <BulletPoint>May provide inaccurate or inappropriate recommendations</BulletPoint>
          <Paragraph>
            <Text className="font-semibold text-red-600">CRITICAL PRODUCT SAFETY WARNING:</Text> Any products, brands, or specific recommendations mentioned by the App are suggestions only and may cause serious adverse reactions including but not limited to:
          </Paragraph>
          <BulletPoint>Allergic reactions, contact dermatitis, or severe skin irritation</BulletPoint>
          <BulletPoint>Chemical burns, skin discoloration, or permanent scarring</BulletPoint>
          <BulletPoint>Exacerbation of existing skin conditions or medical problems</BulletPoint>
          <BulletPoint>Systemic reactions or life-threatening allergic responses</BulletPoint>
          <BulletPoint>Photosensitivity or increased sun sensitivity</BulletPoint>
          <BulletPoint>Hormonal disruptions or endocrine system effects</BulletPoint>
          <Paragraph>
            You acknowledge and agree that:
          </Paragraph>
          <BulletPoint>You are solely responsible for researching and testing any recommended products</BulletPoint>
          <BulletPoint>You must perform patch tests before using any new skincare products</BulletPoint>
          <BulletPoint>You should consult with a dermatologist before trying new products, especially if you have sensitive skin or allergies</BulletPoint>
          <BulletPoint>We are not responsible for any adverse reactions, allergies, or skin damage from recommended products</BulletPoint>
          <BulletPoint>Product recommendations are based on general AI analysis and may not be suitable for your specific skin type or conditions</BulletPoint>
          <BulletPoint>You assume all risks associated with using any recommended products</BulletPoint>
          <BulletPoint>You will seek immediate medical attention for any severe reactions</BulletPoint>
          <BulletPoint>You will discontinue use of any product that causes adverse effects</BulletPoint>
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

        <Section title="8. Acceptable Use and User Responsibilities">
          <Subsection title="8.1 Prohibited Uses">
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
          </Subsection>

          <Subsection title="8.2 Product Safety Responsibilities">
            <Important>
              PRODUCT SAFETY RESPONSIBILITIES: You are solely responsible for the safe use of any recommended products.
            </Important>
            <Paragraph>
              You acknowledge and agree that you are solely responsible for:
            </Paragraph>
            <BulletPoint>Researching and verifying the safety of any recommended products before use</BulletPoint>
            <BulletPoint>Performing patch tests on a small area of skin before using new products</BulletPoint>
            <BulletPoint>Reading and understanding all product labels, ingredients, and warnings</BulletPoint>
            <BulletPoint>Consulting with healthcare professionals before using products if you have allergies or sensitive skin</BulletPoint>
            <BulletPoint>Discontinuing use of any product that causes adverse reactions</BulletPoint>
            <BulletPoint>Seeking medical attention if you experience severe reactions to products</BulletPoint>
            <BulletPoint>Ensuring products are authentic and purchased from reputable sources</BulletPoint>
            <BulletPoint>Following proper storage and usage instructions for all products</BulletPoint>
            <BulletPoint>Monitoring your skin for any changes or reactions when using new products</BulletPoint>
          </Subsection>

          <Subsection title="8.3 Health and Safety Responsibilities">
            <Paragraph>
              You acknowledge and agree that you are solely responsible for:
            </Paragraph>
            <BulletPoint>Your own health and safety when using any recommended products</BulletPoint>
            <BulletPoint>Consulting with healthcare professionals for any medical concerns</BulletPoint>
            <BulletPoint>Not using the App as a substitute for professional medical advice</BulletPoint>
            <BulletPoint>Seeking immediate medical attention for any serious skin reactions or medical emergencies</BulletPoint>
            <BulletPoint>Informing healthcare providers about any products you are using</BulletPoint>
            <BulletPoint>Keeping records of products used and any reactions experienced</BulletPoint>
          </Subsection>
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

        <Section title="10. Third-Party Services and Products">
          <Subsection title="10.1 Third-Party Services">
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
          </Subsection>

          <Subsection title="10.2 Third-Party Product Disclaimers">
            <Important>
              THIRD-PARTY PRODUCT DISCLAIMER: We do not manufacture, distribute, sell, or endorse any skincare products mentioned in our recommendations.
            </Important>
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>We are not affiliated with, endorsed by, or sponsored by any product manufacturers or brands</BulletPoint>
            <BulletPoint>We do not receive compensation from product manufacturers for recommendations</BulletPoint>
            <BulletPoint>We have no control over the quality, safety, or efficacy of recommended products</BulletPoint>
            <BulletPoint>We do not guarantee the availability, pricing, or authenticity of recommended products</BulletPoint>
            <BulletPoint>Product formulations, ingredients, and safety profiles may change without our knowledge</BulletPoint>
            <BulletPoint>We are not responsible for any product recalls, safety warnings, or regulatory actions</BulletPoint>
            <BulletPoint>You must verify product authenticity and safety independently</BulletPoint>
            <BulletPoint>We disclaim all liability for any issues arising from third-party products</BulletPoint>
          </Subsection>

          <Subsection title="10.3 Product Safety and Regulatory Compliance">
            <Important>
              INTERNATIONAL REGULATORY DISCLAIMER: We do not verify compliance with any international health, safety, or regulatory standards.
            </Important>
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>Recommended products may not be approved by health authorities in your jurisdiction</BulletPoint>
            <BulletPoint>Product safety standards and regulations vary by country and region</BulletPoint>
            <BulletPoint>We do not verify compliance with local health and safety regulations</BulletPoint>
            <BulletPoint>We do not verify compliance with FDA, EMA, Health Canada, or any other regulatory body</BulletPoint>
            <BulletPoint>We do not verify compliance with EU, US, UK, or any other international standards</BulletPoint>
            <BulletPoint>You are responsible for ensuring products comply with local laws and regulations</BulletPoint>
            <BulletPoint>We are not responsible for any regulatory violations or penalties</BulletPoint>
            <BulletPoint>You assume all risks of using products that may not be approved in your jurisdiction</BulletPoint>
            <BulletPoint>We disclaim all liability for any regulatory violations or penalties</BulletPoint>
          </Subsection>

          <Subsection title="10.4 International Product Liability Disclaimers">
            <Important>
              INTERNATIONAL PRODUCT LIABILITY DISCLAIMER: We disclaim all liability under any international product liability laws or consumer protection statutes.
            </Important>
            <Paragraph>
              You expressly acknowledge and agree that:
            </Paragraph>
            <BulletPoint>We disclaim all liability under US product liability laws (including strict liability)</BulletPoint>
            <BulletPoint>We disclaim all liability under EU consumer protection directives</BulletPoint>
            <BulletPoint>We disclaim all liability under UK consumer protection laws</BulletPoint>
            <BulletPoint>We disclaim all liability under any other international consumer protection laws</BulletPoint>
            <BulletPoint>You waive any rights under foreign product liability statutes</BulletPoint>
            <BulletPoint>You agree that Canadian law provides adequate protection</BulletPoint>
            <BulletPoint>You will not seek remedies under foreign legal systems</BulletPoint>
            <BulletPoint>You consent to Canadian legal standards for all product-related claims</BulletPoint>
          </Subsection>
        </Section>

        <Section title="11. Disclaimers and Limitations of Liability">
          <Subsection title="11.1 Disclaimer of Warranties">
            <Paragraph>
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </Paragraph>
            <BulletPoint>Warranties of merchantability, fitness for a particular purpose, or non-infringement</BulletPoint>
            <BulletPoint>Warranties that the App will be uninterrupted, error-free, or secure</BulletPoint>
            <BulletPoint>Warranties regarding the accuracy, reliability, or completeness of analysis results</BulletPoint>
            <BulletPoint>Warranties regarding the safety, efficacy, or suitability of any recommended products</BulletPoint>
            <BulletPoint>Warranties that AI-generated recommendations will be appropriate for your specific skin type or conditions</BulletPoint>
          </Subsection>

          <Subsection title="11.2 AI-Generated Content Disclaimer">
            <Important>
              AI-GENERATED CONTENT DISCLAIMER: All analysis results, recommendations, and product suggestions are generated by artificial intelligence and may contain errors, inaccuracies, or inappropriate suggestions.
            </Important>
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>All AI-generated content is provided for informational purposes only</BulletPoint>
            <BulletPoint>AI recommendations may be inaccurate, outdated, or unsuitable for your specific needs</BulletPoint>
            <BulletPoint>We do not endorse, guarantee, or warrant any specific products or brands mentioned by the AI</BulletPoint>
            <BulletPoint>AI-generated content should not be relied upon as professional medical or dermatological advice</BulletPoint>
            <BulletPoint>You are solely responsible for evaluating and verifying any AI-generated recommendations</BulletPoint>
            <BulletPoint>We are not liable for any decisions you make based on AI-generated content</BulletPoint>
          </Subsection>

          <Subsection title="11.3 Product Liability Disclaimer">
            <Important>
              PRODUCT LIABILITY DISCLAIMER: We are not responsible for any adverse reactions, allergies, injuries, or damages resulting from the use of any products recommended by our AI.
            </Important>
            <Paragraph>
              You expressly acknowledge and agree that:
            </Paragraph>
            <BulletPoint>We do not manufacture, distribute, or sell any recommended products</BulletPoint>
            <BulletPoint>We have no control over the quality, safety, or efficacy of recommended products</BulletPoint>
            <BulletPoint>Product recommendations are based on general AI analysis and may not be suitable for your specific skin type, allergies, or medical conditions</BulletPoint>
            <BulletPoint>You must consult with healthcare professionals before using any recommended products</BulletPoint>
            <BulletPoint>You are solely responsible for patch testing and evaluating product safety</BulletPoint>
            <BulletPoint>We disclaim all liability for any product-related injuries, reactions, or damages</BulletPoint>
          </Subsection>

          <Subsection title="11.4 Limitation of Liability">
            <Paragraph>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLEARSKIN AI AND ITS OPERATORS, EMPLOYEES, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR:
            </Paragraph>
            <BulletPoint>Any indirect, incidental, special, consequential, or punitive damages</BulletPoint>
            <BulletPoint>Loss of profits, revenue, data, or business opportunities</BulletPoint>
            <BulletPoint>Personal injury or property damage resulting from your use of the App</BulletPoint>
            <BulletPoint>Any reliance on information provided by the App</BulletPoint>
            <BulletPoint>Any adverse reactions, allergies, or skin damage from recommended products</BulletPoint>
            <BulletPoint>Any medical expenses, treatment costs, or healthcare bills resulting from product use</BulletPoint>
            <BulletPoint>Any emotional distress, pain and suffering, or loss of enjoyment of life</BulletPoint>
            <BulletPoint>Any third-party claims arising from your use of recommended products</BulletPoint>
            <Paragraph>
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE APP SHALL NOT EXCEED THE AMOUNT 
              YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100 CAD, WHICHEVER IS GREATER.
            </Paragraph>
            <Paragraph>
              <Text className="font-semibold text-red-600">NO EXCEPTIONS:</Text> This limitation applies regardless of the legal theory (contract, tort, negligence, strict liability, or otherwise) and even if we have been advised of the possibility of such damages.
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
          <BulletPoint>Your use of any products recommended by the App</BulletPoint>
          <BulletPoint>Any adverse reactions, injuries, or damages resulting from recommended products</BulletPoint>
          <BulletPoint>Any third-party claims arising from your use of recommended products</BulletPoint>
          <BulletPoint>Your failure to consult with healthcare professionals before using recommended products</BulletPoint>
          <BulletPoint>Your failure to perform patch tests or evaluate product safety</BulletPoint>
          <BulletPoint>Any reliance on AI-generated recommendations without proper verification</BulletPoint>
        </Section>

        <Section title="13. User Acknowledgment and Consent">
          <Important>
            BY USING THIS APP, YOU ACKNOWLEDGE AND AGREE TO THE FOLLOWING CRITICAL TERMS:
          </Important>
          <Subsection title="13.1 Product Recommendation Acknowledgment">
            <Paragraph>
              You expressly acknowledge and agree that:
            </Paragraph>
            <BulletPoint>All product recommendations are generated by AI and may not be suitable for your specific needs</BulletPoint>
            <BulletPoint>You are solely responsible for researching and evaluating any recommended products</BulletPoint>
            <BulletPoint>You must perform patch tests before using any new skincare products</BulletPoint>
            <BulletPoint>You should consult with a dermatologist before trying new products, especially if you have sensitive skin or allergies</BulletPoint>
            <BulletPoint>We are not responsible for any adverse reactions, allergies, or skin damage from recommended products</BulletPoint>
            <BulletPoint>You assume all risks associated with using any recommended products</BulletPoint>
          </Subsection>

          <Subsection title="13.2 Medical Advice Acknowledgment">
            <Paragraph>
              You expressly acknowledge and agree that:
            </Paragraph>
            <BulletPoint>The App does not provide medical advice, diagnosis, or treatment</BulletPoint>
            <BulletPoint>You should consult with healthcare professionals for any medical concerns</BulletPoint>
            <BulletPoint>You will not use the App as a substitute for professional medical care</BulletPoint>
            <BulletPoint>You are responsible for your own health and safety decisions</BulletPoint>
          </Subsection>

          <Subsection title="13.3 AI Content Acknowledgment">
            <Paragraph>
              You expressly acknowledge and agree that:
            </Paragraph>
            <BulletPoint>All AI-generated content is provided for informational purposes only</BulletPoint>
            <BulletPoint>AI recommendations may contain errors or inaccuracies</BulletPoint>
            <BulletPoint>You are solely responsible for evaluating and verifying any AI-generated content</BulletPoint>
            <BulletPoint>We do not guarantee the accuracy, reliability, or appropriateness of AI-generated content</BulletPoint>
          </Subsection>
        </Section>

        <Section title="14. Changes to the Service">
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

        <Section title="15. Termination">
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

        <Section title="16. Governing Law and Dispute Resolution">
          <Important>
            INTERNATIONAL JURISDICTION: ALL DISPUTES SHALL BE RESOLVED EXCLUSIVELY IN CANADA UNDER CANADIAN LAW, REGARDLESS OF YOUR LOCATION OR RESIDENCE.
          </Important>
          <Subsection title="16.1 Exclusive Jurisdiction and Choice of Law">
            <Paragraph>
              <Text className="font-semibold text-red-600">MANDATORY CANADIAN JURISDICTION:</Text> These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, 
              without regard to conflict of law principles. ALL DISPUTES MUST BE RESOLVED IN CANADA.
            </Paragraph>
            <BulletPoint>You expressly consent to the exclusive jurisdiction of the courts of Ontario, Canada</BulletPoint>
            <BulletPoint>You waive any objection to venue or jurisdiction in Ontario, Canada</BulletPoint>
            <BulletPoint>You agree that Canadian law shall apply to all disputes, regardless of your location</BulletPoint>
            <BulletPoint>You waive any right to bring claims in your home country or any other jurisdiction</BulletPoint>
            <BulletPoint>You acknowledge that Canadian law provides adequate consumer protection</BulletPoint>
            <BulletPoint>You agree that any foreign judgments against us are not enforceable</BulletPoint>
          </Subsection>

          <Subsection title="16.2 International Legal Compliance">
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>These Terms comply with international consumer protection standards</BulletPoint>
            <BulletPoint>Canadian law provides comprehensive consumer protection equivalent to other jurisdictions</BulletPoint>
            <BulletPoint>You waive any rights under foreign consumer protection laws</BulletPoint>
            <BulletPoint>You agree that Canadian dispute resolution is fair and adequate</BulletPoint>
            <BulletPoint>You will not seek to enforce foreign judgments against us</BulletPoint>
            <BulletPoint>You consent to Canadian legal proceedings even if you reside outside Canada</BulletPoint>
          </Subsection>
          <Subsection title="16.3 Mandatory International Arbitration">
            <Important>
              MANDATORY INTERNATIONAL ARBITRATION: ALL DISPUTES MUST BE RESOLVED THROUGH BINDING ARBITRATION IN CANADA. YOU WAIVE YOUR RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN CLASS ACTIONS.
            </Important>
            <Paragraph>
              Any dispute, controversy, or claim arising out of or relating to these Terms, your use of the App, or any product recommendations 
              (including but not limited to product liability claims, personal injury claims, or medical malpractice claims) shall be resolved 
              exclusively through binding arbitration in accordance with the Arbitration Act of Ontario, regardless of your location or residence.
            </Paragraph>
            <BulletPoint>Arbitration shall be conducted in Toronto, Ontario, Canada</BulletPoint>
            <BulletPoint>Arbitration shall be conducted by a single arbitrator appointed by the ADR Institute of Canada</BulletPoint>
            <BulletPoint>Arbitration shall be conducted in English</BulletPoint>
            <BulletPoint>Each party shall bear their own costs and attorneys' fees</BulletPoint>
            <BulletPoint>Arbitration proceedings shall be confidential</BulletPoint>
            <BulletPoint>The arbitrator's decision shall be final and binding</BulletPoint>
            <BulletPoint>You waive any right to arbitration in your home country or any other jurisdiction</BulletPoint>
            <BulletPoint>You consent to Canadian arbitration even if you reside outside Canada</BulletPoint>
            <BulletPoint>You agree that Canadian arbitration provides adequate due process</BulletPoint>
            <BulletPoint>You waive any objections to Canadian arbitration procedures</BulletPoint>
          </Subsection>

          <Subsection title="16.4 International Forum Selection">
            <Important>
              INTERNATIONAL FORUM SELECTION: ALL DISPUTES SHALL BE RESOLVED EXCLUSIVELY IN CANADA, REGARDLESS OF YOUR LOCATION OR RESIDENCE.
            </Important>
            <Paragraph>
              You expressly acknowledge and agree that:
            </Paragraph>
            <BulletPoint>You waive any right to bring claims in US courts, EU courts, UK courts, or any other foreign jurisdiction</BulletPoint>
            <BulletPoint>You waive any right to bring claims under US federal or state law</BulletPoint>
            <BulletPoint>You waive any right to bring claims under EU law or directives</BulletPoint>
            <BulletPoint>You waive any right to bring claims under UK law or regulations</BulletPoint>
            <BulletPoint>You waive any right to bring claims under any other foreign legal system</BulletPoint>
            <BulletPoint>You consent to exclusive Canadian jurisdiction for all disputes</BulletPoint>
            <BulletPoint>You agree that Canadian courts have exclusive jurisdiction</BulletPoint>
            <BulletPoint>You will not seek to enforce foreign judgments against us</BulletPoint>
            <BulletPoint>You consent to Canadian legal standards for all claims</BulletPoint>
          </Subsection>

          <Subsection title="16.5 Class Action Waiver">
            <Important>
              CLASS ACTION WAIVER: YOU EXPRESSLY WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTION LAWSUITS, CLASS-WIDE ARBITRATION, OR ANY OTHER COLLECTIVE PROCEEDINGS.
            </Important>
            <Paragraph>
              You acknowledge and agree that:
            </Paragraph>
            <BulletPoint>You may only bring claims against us in your individual capacity</BulletPoint>
            <BulletPoint>You waive any right to participate in class actions, collective actions, or representative proceedings</BulletPoint>
            <BulletPoint>You waive any right to consolidate your claims with those of other users</BulletPoint>
            <BulletPoint>You waive any right to a jury trial</BulletPoint>
            <BulletPoint>This waiver applies to all claims, including product liability and personal injury claims</BulletPoint>
            <BulletPoint>This waiver applies regardless of your location or residence</BulletPoint>
            <BulletPoint>You waive any right to participate in international class actions</BulletPoint>
          </Subsection>

          <Subsection title="16.3 Limitation Period">
            <Paragraph>
              Any claim or cause of action arising from these Terms or your use of the App must be commenced within one (1) year 
              after the claim or cause of action arose, or it shall be forever barred.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="17. Apple App Store Terms">
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

        <Section title="18. Google Play Store Terms">
          <Paragraph>
            If you download the App from the Google Play Store, you acknowledge and agree that:
          </Paragraph>
          <BulletPoint>These Terms are between you and ClearSkin AI, not Google</BulletPoint>
          <BulletPoint>You will comply with Google Play's Terms of Service</BulletPoint>
          <BulletPoint>Google is not responsible for the App or its content</BulletPoint>
          <BulletPoint>Google has no obligation to provide maintenance or support</BulletPoint>
        </Section>

        <Section title="19. General Provisions">
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

          <Subsection title="19.5 Force Majeure">
            <Important>
              FORCE MAJEURE: We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control.
            </Important>
            <Paragraph>
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, 
              including but not limited to:
            </Paragraph>
            <BulletPoint>Acts of God, natural disasters, earthquakes, floods, hurricanes, tornadoes, or other extreme weather events</BulletPoint>
            <BulletPoint>War, terrorism, civil unrest, riots, or acts of civil or military authorities</BulletPoint>
            <BulletPoint>Government actions, regulations, or policy changes</BulletPoint>
            <BulletPoint>Network infrastructure failures, internet outages, or telecommunications disruptions</BulletPoint>
            <BulletPoint>Strikes, labor disputes, or shortages of transportation facilities, fuel, energy, labor, or materials</BulletPoint>
            <BulletPoint>Pandemics, epidemics, or public health emergencies</BulletPoint>
            <BulletPoint>Cyber attacks, data breaches, or security incidents</BulletPoint>
            <BulletPoint>Third-party service failures or disruptions</BulletPoint>
            <BulletPoint>AI service outages or algorithmic failures</BulletPoint>
            <BulletPoint>Any other circumstances beyond our reasonable control</BulletPoint>
            <Paragraph>
              In the event of force majeure, we may suspend or terminate services without liability and without notice.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="20. Updates to Terms">
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

        <Section title="21. Contact Information">
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
