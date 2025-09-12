import React, { useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { StyleSheet, View, Text, Image, ViewStyle, TextStyle } from "react-native";
import colors from "@/constants/colors";

type Props = {
  label?: string;
  items: { label: string; value: string }[];
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  placeholder?: string;
  containerStyle?: object;
  dropdownStyle?: ViewStyle;
  placeholderStyle?: TextStyle;
  dropdownStyleContainer?:ViewStyle;
  labelStyle?: TextStyle;
};

const CommonDropdown: React.FC<Props> = ({
  label,
  items,
  value,
  setValue,
  placeholder = "Select an option",
  containerStyle,
  dropdownStyle,
  placeholderStyle,
  dropdownStyleContainer,
  labelStyle
}) => {
  const [open, setOpen] = useState(false);
  const [listItems, setListItems] = useState(items);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={[styles.label , labelStyle]}>{label}</Text>}
      <DropDownPicker
        open={open}
        value={value}
        items={listItems}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setListItems}
        placeholder={placeholder}
        style={[styles.dropdown , dropdownStyle]}
        dropDownContainerStyle={[styles.dropdownContainer , dropdownStyleContainer]}
        textStyle={styles.text}
        placeholderStyle={placeholderStyle}
        ArrowDownIconComponent={() => (
          <Image
            source={require("../assets/images/dropdown.png")}
            style={{ height: 12, width: 12, resizeMode: "contain" ,}}
          />
        )}
        ArrowUpIconComponent={() => (
          <Image
            source={require("../assets/images/dropdown.png")}
            style={{
              height: 12,
              width: 12,
              resizeMode: "contain",
              transform: [{ rotate: "180deg" }],
            }}
          />
        )}
      />
    </View>
  );
};

export default CommonDropdown;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    zIndex: 999,
  },
  label: {
    fontSize: 12,
    color: colors.title,
    marginBottom: 8,
    // fontFamily: fonts.interRegular,
  },
  dropdown: {
    borderColor: colors.inputColor,
    borderRadius: 8,
    backgroundColor: colors.inputColor,
    minHeight: 48,
  },
  dropdownContainer: {
    borderColor: colors.title,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  text: {
    fontSize: 14,
    fontWeight:'400',
    // fontFamily: fonts.interRegular,
    color: "#666060",
    paddingHorizontal:6
  },  
});
