import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../theme';
import {QAStackParamList} from '../types';
import QADashboardScreen from '../screens/qa/DashboardScreen';
import QAJobMonitorScreen from '../screens/qa/JobMonitorScreen';
import QAFinalReviewScreen from '../screens/qa/FinalReviewScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<QAStackParamList>();

function QATabs() {
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
        name="QAJobs"
        component={QADashboardScreen}
        options={{
          tabBarLabel: 'My Jobs',
          tabBarIcon: ({color, focused}) => (
            <Icon name={focused ? 'search' : 'search-outline'} size={22} color={color} />
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

export default function QANavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="QATabs" component={QATabs} />
      <Stack.Screen name="QAJobMonitor" component={QAJobMonitorScreen} />
      <Stack.Screen name="QAFinalReview" component={QAFinalReviewScreen} />
    </Stack.Navigator>
  );
}
