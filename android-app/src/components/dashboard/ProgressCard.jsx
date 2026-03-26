import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import BentoCard from './BentoCard';

/**
 * ProgressCard - Large card with circular progress indicator
 * Used for displaying main metrics like compliance rate
 */
const ProgressCard = ({ 
  title = 'Your Progress',
  percentage = 0,
  value,
  valueLabel = 'Points',
  date,
  bgColor = 'bg-pastel-lavender',
}) => {
  // Circle progress calculations
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = circumference - (percentage / 100) * circumference;

  return (
    <BentoCard 
      bgColor={bgColor}
      icon="stats-chart"
      iconColor="#6366F1"
      title={title}
      className="mb-4"
    >
      <View className="flex-row items-center justify-between mt-2">
        {/* Left side - Percentage */}
        <View className="flex-1">
          <Text style={{ fontSize: 60, fontWeight: '900', color: '#111827' }}>
            {percentage}%
          </Text>
          {date && (
            <Text className="text-xs text-gray-500 mt-2">
              {date}
            </Text>
          )}
        </View>
        
        {/* Right side - Circular Progress */}
        <View className="items-center justify-center">
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E0E7FF"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#6366F1"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          
          {/* Center value */}
          <View className="absolute items-center">
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>
              {value}
            </Text>
            <Text className="text-xs text-gray-500">
              {valueLabel}
            </Text>
          </View>
        </View>
      </View>
    </BentoCard>
  );
};

export default ProgressCard;
