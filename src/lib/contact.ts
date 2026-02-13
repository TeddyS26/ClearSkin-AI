import { Alert, Linking } from 'react-native';

/**
 * Opens the default email client with pre-filled contact information
 * This is a fallback method when the edge function is not available
 */
export async function openContactEmail(subject: string = '', message: string = '') {
  try {
    const emailSubject = encodeURIComponent(subject || 'Contact from ClearSkin AI');
    const emailBody = encodeURIComponent(message || 'Hello ClearSkin AI team,\n\n');
    const emailUrl = `mailto:contact@clearskinai.ca?subject=${emailSubject}&body=${emailBody}`;
    
    const canOpen = await Linking.canOpenURL(emailUrl);
    
    if (canOpen) {
      await Linking.openURL(emailUrl);
    } else {
      Alert.alert(
        'Email Not Available',
        'Please contact us directly at contact@clearskinai.ca',
        [
          {
            text: 'Copy Email',
            onPress: () => {
              // You could implement clipboard functionality here if needed
              Alert.alert('Contact Email', 'contact@clearskinai.ca');
            }
          },
          { text: 'OK' }
        ]
      );
    }
  } catch (error) {
    console.error('Error opening email client:', error);
    Alert.alert(
      'Error',
      'Failed to open email client. Please contact us directly at contact@clearskinai.ca'
    );
  }
}

/**
 * Sends contact message via Supabase edge function
 * This is the preferred method when the edge function is deployed
 */
export async function sendContactMessage(
  subject: string,
  message: string,
  userEmail: string,
  userName: string,
  authToken: string
) {
  // --- SECURITY: Client-side input validation before API call ---
  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    throw new Error('Subject is required');
  }
  if (subject.length > 100) {
    throw new Error('Subject must be 100 characters or less');
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    throw new Error('Message must be at least 10 characters');
  }
  if (message.length > 1000) {
    throw new Error('Message must be 1000 characters or less');
  }
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!SUPABASE_URL) {
    throw new Error('[SECURITY] EXPO_PUBLIC_SUPABASE_URL is not set');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-contact-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject,
      message,
      userEmail,
      userName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData);
  }

  return response.json();
}
