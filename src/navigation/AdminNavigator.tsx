import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../theme';
import {AdminStackParamList} from '../types';
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import AdminJobsScreen from '../screens/admin/JobsScreen';
import AdminUsersScreen from '../screens/admin/UsersScreen';
import AdminInstallerTypesScreen from '../screens/admin/InstallerTypesScreen';
import AdminJobDetailScreen from '../screens/admin/JobDetailScreen';
import AdminCreateJobScreen from '../screens/admin/CreateJobScreen';
import AdminCreateUserScreen from '../screens/admin/CreateUserScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
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
        tabBarIcon: ({color, size}) => {
          const icons: Record<string, string> = {
            Dashboard: 'grid',
            Jobs: 'briefcase',
            Users: 'people',
            Categories: 'construct',
            Profile: 'person-circle',
          };
          const outlineIcons: Record<string, string> = {
            Dashboard: 'grid-outline',
            Jobs: 'briefcase-outline',
            Users: 'people-outline',
            Categories: 'construct-outline',
            Profile: 'person-circle-outline',
          };
          const focused = !outlineIcons[route.name];
          return <Icon name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({color, focused}) => (
            <Icon name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={AdminJobsScreen}
        options={{
          tabBarIcon: ({color, focused}) => (
            <Icon name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          tabBarIcon: ({color, focused}) => (
            <Icon name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={AdminInstallerTypesScreen}
        options={{
          tabBarIcon: ({color, focused}) => (
            <Icon name={focused ? 'construct' : 'construct-outline'} size={22} color={color} />
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

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminJobDetail" component={AdminJobDetailScreen} />
      <Stack.Screen name="AdminCreateJob" component={AdminCreateJobScreen} />
      <Stack.Screen name="AdminCreateUser" component={AdminCreateUserScreen} />
    </Stack.Navigator>
  );
}
