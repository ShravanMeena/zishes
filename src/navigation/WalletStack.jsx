import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WalletScreen from '../screens/wallet/WalletScreen';
import PaymentMethodsScreen from '../screens/wallet/PaymentMethodsScreen';
import BuyCoinsScreen from '../screens/wallet/BuyCoinsScreen';
import WithdrawScreen from '../screens/wallet/WithdrawScreen';
import UploadProofScreen from '../screens/profile/UploadProofScreen';
import TransactionHistoryScreen from '../screens/wallet/TransactionHistoryScreen';

const Stack = createNativeStackNavigator();

export default function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletHome" component={WalletScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="BuyCoins" component={BuyCoinsScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      {/** Register here so Wallet can navigate directly to UploadProof */}
      <Stack.Screen name="UploadProof" component={UploadProofScreen} />
    </Stack.Navigator>
  );
}
