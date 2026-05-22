import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../theme';
import {ManagerStackParamList} from '../types';
import ManagerDashboardScreen from '../screens/manager/DashboardScreen';
import ManagerJobDetailScreen from '../screens/manager/JobDetailScreen';
import ManagerCreateTaskScreen from '../screens/manager/CreateTaskScreen';
import ManagerTaskReviewScreen from '../screens/manager/TaskReviewScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<ManagerStackParamList>();

function ManagerTabs() {
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
        name="MyJobs"
        component={ManagerDashboardScreen}
        options={{
          tabBarLabel: 'My Jobs',
          tabBarIcon: ({color, focused}) => (
            <Icon name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
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

export default function ManagerNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ManagerTabs" component={ManagerTabs} />
      <Stack.Screen name="ManagerJobDetail" component={ManagerJobDetailScreen} />
      <Stack.Screen name="ManagerCreateTask" component={ManagerCreateTaskScreen} />
      <Stack.Screen name="ManagerTaskReview" component={ManagerTaskReviewScreen} />
    </Stack.Navigator>
  );
}
