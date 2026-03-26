import React from 'react';
import { View, Text } from 'react-native';
import BentoCard from './BentoCard';

/**
 * QuickActionCard - Small card for quick actions
 * Used in the Bento Grid for navigation shortcuts
 */
const QuickActionCard = ({ 
  title,
  subtitle,
  icon,
  iconColor = '#6B7280',
  bgColor = 'bg-pastel-beige',
  onPress,
}) => {
  return (
    <BentoCard
      bgColor={bgColor}
      icon={icon}
      iconColor={iconColor}
      onPress={onPress}
      showArrow={true}
      className="flex-1"
    >
      <View className="mt-6">
        <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-gray-500 mt-1">
            {subtitle}
          </Text>
        )}
      </View>
    </BentoCard>
  );
};

export default QuickActionCard;
