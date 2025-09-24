import colors from "@/constants/colors";
import * as React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
  ImageSourcePropType,
  TouchableOpacity,
  Platform,
} from "react-native";

type LabeledInputProps = TextInputProps & {
  label?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  inputContainerStyle?: ViewStyle;
  leftAdornment?: React.ReactNode;
  leftIconSource?: ImageSourcePropType;
  leftIconStyle?: ImageStyle;
  rightAdornment?: React.ReactNode;
  rightIconSource?: ImageSourcePropType;
  rightIconStyle?: ImageStyle;
  onPress?: () => void;
};

export default function  LabeledInput({
  label,
  containerStyle,
  labelStyle,
  inputStyle,
  inputContainerStyle,
  leftAdornment,
  leftIconSource,
  leftIconStyle,
  rightAdornment,
  rightIconSource,
  rightIconStyle,
  onPress,
  ...inputProps
}: LabeledInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={[styles.inputWrapper, inputContainerStyle]}>
        {leftAdornment ? (
          <View style={styles.adornment}>{leftAdornment}</View>
        ) : leftIconSource ? (
          <View style={styles.adornment}>
            <Image
              source={leftIconSource}
              style={[styles.icon, leftIconStyle]}
            />
          </View>
        ) : null}
        <TextInput
          style={[
            styles.input,
            inputStyle,
            inputProps.multiline
              ? { textAlignVertical: "top" }
              : { textAlignVertical: "center" },
          ]}
          placeholderTextColor={colors.grey}
          {...inputProps}
        />

        {rightAdornment ? (
          <View style={styles.adornmentRight}>{rightAdornment}</View>
        ) : rightIconSource ? (
          <TouchableOpacity style={styles.adornmentRight} onPress={onPress}>
            <Image
              source={rightIconSource}
              style={[styles.icon, rightIconStyle]}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 8,
    // fontFamily: fonts.interRegular,
  },
  inputWrapper: {
    backgroundColor: colors.inputColor,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 13,
    // fontFamily: fonts.interRegular,
    paddingVertical: 0,
    marginTop: Platform.OS === 'ios' ? 0 : 4,
    color: colors.grey,
  },  
  adornment: {
    marginRight: 20,
  },
  adornmentRight: {
    marginLeft: 8,
  },
  icon: {
    width: 20,
    height: 20,
  },
});
