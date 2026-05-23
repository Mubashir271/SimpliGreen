import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {initAuth} from '../store/slices/authSlice';
import {fetchUsers} from '../store/slices/usersSlice';
import {fetchInstallerTypes} from '../store/slices/installerTypesSlice';
import {RootStackParamList} from '../types';
import {COLORS} from '../theme';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminNavigator from './AdminNavigator';
import ManagerNavigator from './ManagerNavigator';
import InstallerNavigator from './InstallerNavigator';
import QANavigator from './QANavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(s => s.auth.currentUser);
  const initializing = useAppSelector(s => s.auth.initializing);

  // Check persisted token on startup
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // Fetch global data after authentication
  useEffect(() => {
    if (currentUser) {
      dispatch(fetchUsers());
      dispatch(fetchInstallerTypes());
    }
  }, [currentUser?.id, dispatch]);

  if (initializing) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getRoleScreen = () => {
    if (!currentUser) {
      return null;
    }
    switch (currentUser.role) {
      case 'admin':
        return <Stack.Screen name="AdminMain" component={AdminNavigator} />;
      case 'manager':
        return <Stack.Screen name="ManagerMain" component={ManagerNavigator} />;
      case 'installer':
        return <Stack.Screen name="InstallerMain" component={InstallerNavigator} />;
      case 'qa':
        return <Stack.Screen name="QAMain" component={QANavigator} />;
      default:
        return null;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          getRoleScreen()
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
