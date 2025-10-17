import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";

interface VegFilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilter: "all" | "veg";
  onApply: (filter: "all" | "veg") => void;
}

const VegFilterModal: React.FC<VegFilterModalProps> = ({
  visible,
  onClose,
  currentFilter,
  onApply,
}) => {
  const [selectedFilter, setSelectedFilter] = useState(currentFilter);

  const handleDone = () => {
    onApply(selectedFilter);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1}>
            <Text style={styles.title}>I want to see veg choices from:</Text>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedFilter("all")}
            >
              <View style={styles.radioCircle}>
                {selectedFilter === "all" && (
                  <View style={styles.radioSelected} />
                )}
              </View>
              <Text style={styles.radioText}>All Restaurants</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedFilter("veg")}
            >
              <View style={styles.radioCircle}>
                {selectedFilter === "veg" && (
                  <View style={styles.radioSelected} />
                )}
              </View>
              <Text style={styles.radioText}>Pure Veg only</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
    color: "#000",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioText: {
    fontSize: 16,
    color: "#000",
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default VegFilterModal;
