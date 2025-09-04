import React from 'react';
import { View, Text } from 'react-native';

export default function TermsContent({ compact = false }) {
  return (
    <View style={{ padding: compact ? 0 : 12 }}>
      <Text style={{ color: '#E6F0FF', fontWeight: '800', fontSize: 18 }}>Terms & Conditions</Text>
      <Text style={{ color: '#AFC1DC', marginTop: 8 }}>
        By using this application, you agree to the collection and use of information in accordance with this policy. You must not misuse our services or help anyone else to do so. We reserve the right to suspend or terminate access for any reason at any time.
      </Text>
      <Text style={{ color: '#AFC1DC', marginTop: 8 }}>
        You retain ownership of your content; however, by posting, you grant us a worldwide, non-exclusive license to use, host, store, reproduce, and modify your content solely to provide the service.
      </Text>
      <Text style={{ color: '#AFC1DC', marginTop: 8 }}>
        The service is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we disclaim all warranties and will not be liable for any loss or damage arising from your use of the service.
      </Text>
      <Text style={{ color: '#AFC1DC', marginTop: 8 }}>
        These terms may be updated from time to time. Continued use constitutes acceptance of the revised terms.
      </Text>
    </View>
  );
}

