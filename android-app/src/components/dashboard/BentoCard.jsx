import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Color mapping for pastel backgrounds
const COLORS = {
  'bg-pastel-pink': '#FFE5E5',
  'bg-pastel-mint': '#D4F4F4',
  'bg-pastel-beige': '#FFE8D6',
  'bg-pastel-lavender': '#E5E5FF',
  'bg-pastel-coral': '#FFD4D4',
  'bg-white': '#FFFFFF',
  // Hospital/Medical theme colors
  'bg-medical-blue': '#E0F2FE',      // Light blue - clean/sterile
  'bg-medical-green': '#D1FAE5',     // Light green - hygiene/health
  'bg-medical-teal': '#CCFBF1',      // Light teal - medical
  'bg-medical-purple': '#EDE9FE',    // Light purple - healthcare
  'bg-medical-cyan': '#CFFAFE',      // Light cyan - fresh/clean
};

/**
 * BentoCard - Base card component for Bento Grid layout
 * Supports different background colors, sizes, and optional actions
 */
const BentoCard = ({ 
  children, 
  bgColor = 'bg-white', 
  onPress, 
  className = '',
  icon,
  iconColor = '#6B7280',
  title,
  subtitle,
  showArrow = false,
}) => {
  const CardWrapper = onPress ? Pressable : View;
  const backgroundColor = COLORS[bgColor] || '#FFFFFF';
  
  return (
    <CardWrapper
      onPress={onPress}
      className={`p-5 ${className}`}
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
      {/* Header with icon and title */}
      {(icon || title) && (
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            {icon && (
              <Ionicons name={icon} size={20} color={iconColor} />
            )}
            {title && (
              <View className="flex-1">
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>
                  {title}
                </Text>
                {subtitle && (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {subtitle}
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {showArrow && (
            <Ionicons name="arrow-forward" size={20} color={iconColor} />
          )}
        </View>
      )}
      
      {/* Card content */}
      {children}
    </CardWrapper>
  );
};

export default BentoCard;
