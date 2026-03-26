import React from 'react';
import { View, Text, Image } from 'react-native';
import BentoCard from './BentoCard';

/**
 * ActivityRecapCard - Card with image and call-to-action
 * Used for activity recaps and promotional content
 */
const ActivityRecapCard = ({ 
  title = 'My Activity Recaps',
  subtitle = 'Everything you need to know about your health.',
  buttonText = 'Get Started',
  imageSource,
  bgColor = 'bg-white',
  onPress,
}) => {
  return (
    <BentoCard
      bgColor={bgColor}
      onPress={onPress}
      className="mb-4"
    >
      <Text className="text-base font-semibold text-brand-dark mb-1">
        {title}
      </Text>
      <Text className="text-xs text-brand-gray mb-4">
        {subtitle}
      </Text>
      
      {/* Image placeholder */}
      {imageSource ? (
        <Image 
          source={imageSource}
          className="w-full h-32 rounded-2xl mb-3"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-32 bg-gray-100 rounded-2xl mb-3 items-center justify-center">
          <Text className="text-xs text-brand-gray">Activity Image</Text>
        </View>
      )}
      
      {/* CTA Button */}
      <View className="bg-brand-dark rounded-full py-3 items-center">
        <Text className="text-sm font-semibold text-white">
          {buttonText}
        </Text>
      </View>
    </BentoCard>
  );
};

export default ActivityRecapCard;
