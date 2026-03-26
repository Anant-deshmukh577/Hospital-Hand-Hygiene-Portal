import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const Loader = ({ fullScreen = false, text = 'Loading...' }) => {
  const content = (
    <>
      <LottieView
        source={require('../../../assets/Sandy Loading.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
      {text && <Text style={styles.text}>{text}</Text>}
    </>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return <View style={styles.inline}>{content}</View>;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  inline: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 120,
    height: 120,
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default Loader;