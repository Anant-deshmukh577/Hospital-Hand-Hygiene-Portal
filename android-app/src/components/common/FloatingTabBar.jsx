import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * FloatingTabBar - Custom floating pill-shaped tab bar
 * Matches the reference image design
 */
const FloatingTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View 
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        pointerEvents: 'box-none',
      }}
    >
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          backgroundColor: '#1F2937',
          borderRadius: 50,
          paddingVertical: 12,
          paddingHorizontal: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 15,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // Get icon name based on route
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Leaderboard') {
            iconName = 'trophy';
          } else if (route.name === 'Rewards') {
            iconName = 'gift';
          } else if (route.name === 'Reports') {
            iconName = 'document-text';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'AdminDashboard') {
            iconName = 'speedometer';
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View 
                style={{
                  width: 48,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: isFocused ? '#3B82F6' : 'transparent',
                }}
              >
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default FloatingTabBar;
