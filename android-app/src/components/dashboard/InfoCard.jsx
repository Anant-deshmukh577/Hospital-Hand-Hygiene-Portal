import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Color mapping
const COLORS = {
  'bg-pastel-pink': '#FFE5E5',
  'bg-pastel-mint': '#D4F4F4',
  'bg-pastel-beige': '#FFE8D6',
  'bg-pastel-lavender': '#E5E5FF',
  'bg-pastel-coral': '#FFD4D4',
  'bg-white': '#FFFFFF',
  // Hospital/Medical theme colors
  'bg-medical-blue': '#E0F2FE',
  'bg-medical-green': '#D1FAE5',
  'bg-medical-teal': '#CCFBF1',
  'bg-medical-purple': '#EDE9FE',
  'bg-medical-cyan': '#CFFAFE',
};

/**
 * InfoCard - Small card for displaying single metric
 * Used for current weight, today's calories, etc.
 */
const InfoCard = ({ 
  title,
  value,
  subtitle,
  icon,
  iconColor = '#6B7280',
  bgColor = 'bg-white',
}) => {
  const backgroundColor = COLORS[bgColor] || '#FFFFFF';
  
  return (
    <View 
      className="p-4 flex-1"
      style={{
        backgroundColor,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <View className="flex-row items-center gap-2 mb-3">
        {icon && (
          <Ionicons name={icon} size={18} color={iconColor} />
        )}
        <Text className="text-xs font-medium text-gray-900 flex-1">
          {title}
        </Text>
      </View>
      
      <Text className="text-3xl font-bold text-gray-900 mb-1">
        {value}
      </Text>
      
      {subtitle && (
        <Text className="text-xs text-gray-500">
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export default InfoCard;
