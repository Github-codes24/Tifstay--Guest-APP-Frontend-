import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
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
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<View>(null);

  const measureTrigger = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPosition({
        top: y + height + 4, // trigger ke neeche thoda gap
        left: x,
        width,
      });
      setIsOpen(true);
    });
  };

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsOpen(false);
  };

  const closeDropdown = () => setIsOpen(false);

  return (
    <View style={styles.container}>
      {/* Dropdown Trigger */}
      <TouchableOpacity
        ref={triggerRef}
        style={styles.dropdown}
        onPress={measureTrigger}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}
          numberOfLines={numberOfLines}
        >
          {value || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {/* Modal with exact positioning */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.modalOverlay}>
            {/* Stop propagation inside dropdown list */}
            <View
              style={[
                styles.dropdownListContainer,
                {
                  position: "absolute",
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                },
              ]}
              onStartShouldSetResponder={() => true} // Important: prevent touch from bubbling to overlay
            >
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 250 }}>
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
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent", // no dim
  },

  dropdownListContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    maxHeight: 300,
    overflow: "hidden",
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