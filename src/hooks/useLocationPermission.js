import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export default function useLocationPermission() {
  const ensure = async () => {
    if (Platform.OS === 'android') {
      try {
        // Request both coarse and fine; coarse is often enough and may auto-grant
        const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
        const results = await PermissionsAndroid.requestMultiple([coarse, fine]);
        const statuses = Object.values(results || {});
        if (statuses.includes(PermissionsAndroid.RESULTS.GRANTED)) return true;
        if (statuses.includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)) {
          Alert.alert(
            'Location Permission Needed',
            'Please enable Location in Settings to detect your country automatically.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      } catch (e) {
        return false;
      }
    }

    // iOS: Geolocation API will prompt when Info.plist has usage string
    return true;
  };

  return ensure;
}

