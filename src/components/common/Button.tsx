import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle 
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    let buttonStyle: StyleProp<ViewStyle> = [styles.button];

    // Variant styles
    switch (variant) {
      case 'primary':
        buttonStyle = [...buttonStyle, styles.primaryButton];
        break;
      case 'secondary':
        buttonStyle = [...buttonStyle, styles.secondaryButton];
        break;
      case 'outline':
        buttonStyle = [...buttonStyle, styles.outlineButton];
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        buttonStyle = [...buttonStyle, styles.smallButton];
        break;
      case 'medium':
        buttonStyle = [...buttonStyle, styles.mediumButton];
        break;
      case 'large':
        buttonStyle = [...buttonStyle, styles.largeButton];
        break;
    }

    // Disabled state
    if (disabled || isLoading) {
      buttonStyle = [...buttonStyle, styles.disabledButton];
    }

    // Custom styles
    if (style) {
      buttonStyle = [...buttonStyle, style];
    }

    return buttonStyle;
  };

  const getTextStyle = () => {
    let textStyleArray: StyleProp<TextStyle> = [styles.buttonText];

    // Variant text styles
    switch (variant) {
      case 'primary':
        textStyleArray = [...textStyleArray, styles.primaryText];
        break;
      case 'secondary':
        textStyleArray = [...textStyleArray, styles.secondaryText];
        break;
      case 'outline':
        textStyleArray = [...textStyleArray, styles.outlineText];
        break;
    }

    // Size text styles
    switch (size) {
      case 'small':
        textStyleArray = [...textStyleArray, styles.smallText];
        break;
      case 'large':
        textStyleArray = [...textStyleArray, styles.largeText];
        break;
    }

    // Disabled state
    if (disabled) {
      textStyleArray = [...textStyleArray, styles.disabledText];
    }

    // Custom text style
    if (textStyle) {
      textStyleArray = [...textStyleArray, textStyle];
    }

    return textStyleArray;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#3498db' : '#fff'}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Variants
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: '#2c3e50',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  // Sizes
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mediumButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  largeButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  // States
  disabledButton: {
    opacity: 0.6,
  },
  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#3498db',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.8,
  },
});

export default Button;
