import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";

interface DropdownProps {
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  numberOfLines?: number;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onSelect,
  placeholder = "Select",
  numberOfLines = 1,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text
          style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}
          numberOfLines={numberOfLines}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownItem}
                onPress={() => handleSelect(option)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === option && styles.dropdownItemTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 999,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: "#1F2937",
    flex: 1,
  },
  dropdownPlaceholder: {
    color: "#9CA3AF",
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: 4,
    zIndex: 9999,
    elevation: 999,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#1F2937",
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});

export default Dropdown;
