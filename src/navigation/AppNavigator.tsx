import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {useAppSelector} from '../store/hooks';
import {RootStackParamList} from '../types';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminNavigator from './AdminNavigator';
import ManagerNavigator from './ManagerNavigator';
import InstallerNavigator from './InstallerNavigator';
import QANavigator from './QANavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const currentUser = useAppSelector(s => s.auth.currentUser);

  const getRoleScreen = () => {
    if (!currentUser) {return null;}
    switch (currentUser.role) {
      case 'admin':
        return (
          <Stack.Screen name="AdminMain" component={AdminNavigator} />
        );
      case 'manager':
        return (
          <Stack.Screen name="ManagerMain" component={ManagerNavigator} />
        );
      case 'installer':
        return (
          <Stack.Screen name="InstallerMain" component={InstallerNavigator} />
        );
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
