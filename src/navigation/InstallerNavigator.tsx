import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../theme';
import {InstallerStackParamList} from '../types';
import InstallerDashboardScreen from '../screens/installer/DashboardScreen';
import InstallerTaskDetailScreen from '../screens/installer/TaskDetailScreen';
import InstallerTaskSubmissionScreen from '../screens/installer/TaskSubmissionScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<InstallerStackParamList>();

function InstallerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.tabBarInactive,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
      }}>
      <Tab.Screen
        name="MyTasks"
        component={InstallerDashboardScreen}
        options={{
          tabBarLabel: 'My Tasks',
          tabBarIcon: ({color, focused}) => (
            <Icon name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({color, focused}) => (
            <Icon name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function InstallerNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="InstallerTabs" component={InstallerTabs} />
      <Stack.Screen name="InstallerTaskDetail" component={InstallerTaskDetailScreen} />
      <Stack.Screen name="InstallerTaskSubmission" component={InstallerTaskSubmissionScreen} />
    </Stack.Navigator>
  );
}
