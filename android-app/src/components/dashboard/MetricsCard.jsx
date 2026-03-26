import React from 'react';
import { View, Text } from 'react-native';
import BentoCard from './BentoCard';

/**
 * MetricsCard - Card displaying multiple metrics in a row
 * Used for showing nutritional info, stats, etc.
 */
const MetricsCard = ({ 
  title,
  subtitle,
  icon,
  iconColor = '#6B7280',
  bgColor = 'bg-pastel-pink',
  metrics = [],
  onPress,
  onEdit,
}) => {
  return (
    <BentoCard
      bgColor={bgColor}
      icon={icon}
      iconColor={iconColor}
      title={title}
      subtitle={subtitle}
      onPress={onPress}
    >
      {/* Metrics row */}
      <View className="flex-row justify-between items-end mt-4">
        {metrics.map((metric, index) => (
          <View key={index} className="items-center flex-1">
            <Text className="text-xs text-gray-500 mb-1">
              {metric.label}
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>
              {metric.value}
            </Text>
            {metric.unit && (
              <Text className="text-xs text-gray-500 mt-0.5">
                {metric.unit}
              </Text>
            )}
          </View>
        ))}
      </View>
    </BentoCard>
  );
};

export default MetricsCard;
