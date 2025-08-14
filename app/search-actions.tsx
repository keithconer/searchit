"use client";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Device } from "react-native-ble-plx";
import { SafeAreaView } from "react-native-safe-area-context";

type ObjectType = {
  name: string;
  description: string;
  tag: string;
  password: string;
  deviceId?: string;
};

interface SearchActionsProps {
  object: ObjectType;
  rssi: number | null;
  onBack: () => void;
  connectedDevice: Device | null;
  bluetoothOff?: boolean;
}

const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const CHARACTERISTIC_UUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
const WRITE_CHARACTERISTIC_UUID = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";

const getProximity = (rssi: number | null) => {
  if (rssi === null) return "";
  if (rssi >= -55) return "Super Near";
  if (rssi >= -65) return "Near";
  if (rssi >= -80) return "Far";
  return "Super Far";
};

const getSignalColor = (rssi: number | null) => {
  if (rssi === null) return "#9ca3af";
  if (rssi >= -55) return "#10b981";
  if (rssi >= -65) return "#f59e0b";
  if (rssi >= -80) return "#f97316";
  return "#ef4444";
};

const getSignalIcon = (rssi: number | null) => {
  if (rssi === null) return "signal-off";
  if (rssi >= -55) return "signal-cellular-3";
  if (rssi >= -65) return "signal-cellular-2";
  if (rssi >= -80) return "signal-cellular-1";
  return "signal-cellular-outline";
};

export default function SearchActions({
  object,
  rssi,
  onBack,
  connectedDevice,
  bluetoothOff = false,
}: SearchActionsProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [currentRssi, setCurrentRssi] = useState(rssi);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);

  const [buzzerState, setBuzzerState] = useState(false);
  const [buzzerLoading, setBuzzerLoading] = useState(false);

  const [ledState, setLedState] = useState(false);
  const [ledLoading, setLedLoading] = useState(false);

  useEffect(() => {
    if (!connectedDevice) return;
    const interval = setInterval(async () => {
      try {
        const updatedDevice = await connectedDevice.readRSSI();
        const rssiValue = updatedDevice.rssi;
        if (typeof rssiValue === "number") setCurrentRssi(rssiValue);

        if (rssiValue === null || rssiValue < -90) {
          setDisconnectModalVisible(true);
        }
      } catch {
        setDisconnectModalVisible(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [connectedDevice]);

  useEffect(() => {
    if (bluetoothOff) setDisconnectModalVisible(true);
  }, [bluetoothOff]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  useEffect(() => {
    if (!connectedDevice) return;

    const setupNotifications = async () => {
      try {
        await connectedDevice.monitorCharacteristicForService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          (error, characteristic) => {
            if (error) {
              console.log("Notification error:", error);
              return;
            }

            if (characteristic?.value) {
              const response = Buffer.from(
                characteristic.value,
                "base64"
              ).toString("utf8");

              console.log("Received response:", response);

              if (response === "BUZZER_ON") {
                setBuzzerState(true);
                setBuzzerLoading(false);
              } else if (response === "BUZZER_OFF") {
                setBuzzerState(false);
                setBuzzerLoading(false);
              } else if (response === "LED_ON") {
                setLedState(true);
                setLedLoading(false);
              } else if (response === "LED_OFF") {
                setLedState(false);
                setLedLoading(false);
              }
            }
          }
        );
      } catch (error) {
        console.log("Failed to setup notifications:", error);
      }
    };

    setupNotifications();
  }, [connectedDevice]);

  const sendToggleCommand = async (command: string) => {
    if (!connectedDevice) {
      Alert.alert("Error", "Device not connected");
      return;
    }

    const base64Command = Buffer.from(command, "utf8").toString("base64");

    await connectedDevice.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      WRITE_CHARACTERISTIC_UUID,
      base64Command
    );
  };

  const handleBuzzerPress = async () => {
    setBuzzerLoading(true);
    try {
      await sendToggleCommand("BUZZ_TOGGLE");
      setTimeout(() => setBuzzerLoading(false), 3000); // Fallback
    } catch (error) {
      console.log("Buzzer error:", error);
      setBuzzerLoading(false);
      Alert.alert("Error", "Failed to control buzzer");
    }
  };

  const handleLightPress = async () => {
    setLedLoading(true);
    try {
      await sendToggleCommand("LED_TOGGLE");
      setTimeout(() => setLedLoading(false), 3000); // Fallback
    } catch (error) {
      console.log("LED error:", error);
      setLedLoading(false);
      Alert.alert("Error", "Failed to control LED");
    }
  };

  const handleDisconnectModalClose = () => {
    setDisconnectModalVisible(false);
    setBuzzerState(false);
    setLedState(false);
    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{object.name}</Text>
        <Text style={styles.headerSubtitle}>Device Connection Status</Text>
      </View>

      <View style={styles.mainContent}>
        <View
          style={[
            styles.signalCard,
            {
              backgroundColor: getSignalColor(currentRssi) + "08",
              borderColor: getSignalColor(currentRssi) + "20",
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getSignalColor(currentRssi) + "15" },
            ]}
          >
            <MaterialCommunityIcons
              name={getSignalIcon(currentRssi)}
              size={48}
              color={getSignalColor(currentRssi)}
            />
          </View>

          <Animated.Text
            style={[
              styles.rssiValue,
              { color: getSignalColor(currentRssi), opacity },
            ]}
          >
            {currentRssi !== null ? `${currentRssi} dBm` : "No Signal"}
          </Animated.Text>

          <View
            style={[
              styles.proximityBadge,
              { backgroundColor: getSignalColor(currentRssi) },
            ]}
          >
            <Text style={styles.proximityText}>
              {getProximity(currentRssi)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.modernButton,
              buzzerState ? styles.buzzerActiveButton : styles.inactiveButton,
            ]}
            onPress={handleBuzzerPress}
            disabled={buzzerLoading}
          >
            {buzzerLoading ? (
              <Animated.View style={{ opacity }}>
                <Ionicons
                  name="volume-high-outline"
                  size={24}
                  color="#247eff"
                />
              </Animated.View>
            ) : (
              <Ionicons
                name={buzzerState ? "volume-high" : "volume-high-outline"}
                size={24}
                color={buzzerState ? "#ffffff" : "#247eff"}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                { color: buzzerState ? "#ffffff" : "#247eff" },
              ]}
            >
              {buzzerLoading
                ? "Loading..."
                : buzzerState
                ? "Buzzer ON"
                : "Buzzer"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernButton,
              ledState ? styles.ledActiveButton : styles.inactiveButton,
            ]}
            onPress={handleLightPress}
            disabled={ledLoading}
          >
            {ledLoading ? (
              <Animated.View style={{ opacity }}>
                <Ionicons name="flash-outline" size={24} color="#247eff" />
              </Animated.View>
            ) : (
              <Ionicons
                name={ledState ? "flash" : "flash-outline"}
                size={24}
                color={ledState ? "#ffffff" : "#247eff"}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                { color: ledState ? "#ffffff" : "#247eff" },
              ]}
            >
              {ledLoading ? "Loading..." : ledState ? "LED ON" : "LED"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={disconnectModalVisible}
        onRequestClose={handleDisconnectModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modernModal}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Connection Lost</Text>
            <Text style={styles.modalDescription}>
              You have been disconnected due to distance limitations or
              Bluetooth is off. Ensure you are within 10–15 meters from the
              microcontroller and keep Bluetooth on.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleDisconnectModalClose}
            >
              <Text style={styles.modalButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "400",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  signalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  rssiValue: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  proximityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    backgroundColor: "#f3f4f6",
  },
  proximityText: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "500",
  },
  controlsContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
  },
  modernButton: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  inactiveButton: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
  },
  buzzerActiveButton: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  ledActiveButton: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  buttonText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modernModal: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    width: "100%",
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
