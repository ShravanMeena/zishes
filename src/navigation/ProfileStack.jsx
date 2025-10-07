import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/account/ProfileScreen';
import MyListingsScreen from '../screens/profile/MyListingsScreen';
import TournamentsWonScreen from '../screens/profile/TournamentsWonScreen';
import EditProfileScreen from '../screens/account/EditProfileScreen';
import SettingsScreen from '../screens/account/SettingsScreen';
import ChangePasswordScreen from '../screens/account/ChangePasswordScreen';
import PaymentMethodsManageScreen from '../screens/account/PaymentMethodsManageScreen';
import DefaultWithdrawalScreen from '../screens/account/DefaultWithdrawalScreen';
import ReportIssueScreen from '../screens/account/ReportIssueScreen';
import IssueHistoryScreen from '../screens/account/IssueHistoryScreen';
import CommunityFeedbackScreen from '../screens/account/CommunityFeedbackScreen';
import SellerReviewScreen from '../screens/profile/SellerReviewScreen';
import ManageAccountScreen from '../screens/account/ManageAccountScreen';
import MembershipTierScreen from '../screens/account/MembershipTierScreen';
import UploadProofScreen from '../screens/profile/UploadProofScreen';
import AcknowledgeReceiptScreen from '../screens/profile/AcknowledgeReceiptScreen';
import ReceiptsScreen from '../screens/profile/ReceiptsScreen';
import LeaderboardScreen from '../screens/profile/LeaderboardScreen';
import PolicyViewerScreen from '../screens/misc/PolicyViewerScreen';
import DraftsScreen from '../screens/profile/DraftsScreen';
import CountrySelectScreen from '../screens/auth/CountrySelectScreen';
import DetailsScreen from '../screens/home/DetailsScreen';
import UnityScreen from '../screens/home/UnityScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="MyListings" component={MyListingsScreen} />
      <Stack.Screen name="Drafts" component={DraftsScreen} />
      <Stack.Screen name="TournamentsWon" component={TournamentsWonScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="PaymentMethodsManage" component={PaymentMethodsManageScreen} />
      <Stack.Screen name="DefaultWithdrawal" component={DefaultWithdrawalScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="IssueHistory" component={IssueHistoryScreen} />
      <Stack.Screen name="CommunityFeedback" component={CommunityFeedbackScreen} />
      <Stack.Screen name="ManageAccount" component={ManageAccountScreen} />
      <Stack.Screen name="SellerReview" component={SellerReviewScreen} />
      <Stack.Screen name="MembershipTier" component={MembershipTierScreen} />
      <Stack.Screen name="UploadProof" component={UploadProofScreen} />
      <Stack.Screen name="AcknowledgeReceipt" component={AcknowledgeReceiptScreen} />
      <Stack.Screen name="Receipts" component={ReceiptsScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="PolicyViewer" component={PolicyViewerScreen} />
      <Stack.Screen name="CountrySelect" component={CountrySelectScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen
        name="UnityGame"
        component={UnityScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
