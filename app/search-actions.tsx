"use client"

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { Buffer } from "buffer"
import { useEffect, useRef, useState } from "react"
import { Alert, Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import type { Device } from "react-native-ble-plx"
import { SafeAreaView } from "react-native-safe-area-context"

type ObjectType = {
  name: string
  description: string
  tag: string
  password: string
  deviceId?: string
}

interface SearchActionsProps {
  object: ObjectType
  rssi: number | null
  onBack: () => void
  connectedDevice: Device | null
  bluetoothOff?: boolean
}

const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
const CHARACTERISTIC_UUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
const WRITE_CHARACTERISTIC_UUID = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

const getProximity = (rssi: number | null) => {
  if (rssi === null) return ""
  if (rssi >= -55) return "Super Near"
  if (rssi >= -65) return "Near"
  if (rssi >= -80) return "Far"
  return "Super Far"
}

const getSignalIcon = (rssi: number | null) => {
  if (rssi === null) return "signal-off"
  if (rssi >= -55) return "signal-cellular-3"
  if (rssi >= -65) return "signal-cellular-2"
  if (rssi >= -80) return "signal-cellular-1"
  return "signal-cellular-outline"
}

const getSignalColor = (rssi: number | null) => {
  if (rssi === null) return "#9ca3af"
  if (rssi >= -55) return "#10b981" // Green for excellent signal
  if (rssi >= -65) return "#f59e0b" // Yellow for good signal
  if (rssi >= -80) return "#f97316" // Orange for fair signal
  return "#ef4444" // Red for poor signal
}

export default function SearchActions({
  object,
  rssi,
  onBack,
  connectedDevice,
  bluetoothOff = false,
}: SearchActionsProps) {
  const opacity = useRef(new Animated.Value(1)).current
  const shakeAnimation = useRef(new Animated.Value(0)).current
  const rotateAnimation = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(1)).current
  const [currentRssi, setCurrentRssi] = useState(rssi)
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false)

  const [buzzerState, setBuzzerState] = useState(false)
  const [buzzerLoading, setBuzzerLoading] = useState(false)

  const [ledState, setLedState] = useState(false)
  const [ledLoading, setLedLoading] = useState(false)

  useEffect(() => {
    if (!connectedDevice) return
    const interval = setInterval(async () => {
      try {
        const updatedDevice = await connectedDevice.readRSSI()
        const rssiValue = updatedDevice.rssi
        if (typeof rssiValue === "number") setCurrentRssi(rssiValue)

        if (rssiValue === null || rssiValue < -90) {
          setDisconnectModalVisible(true)
        }
      } catch {
        setDisconnectModalVisible(true)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [connectedDevice])

  useEffect(() => {
    if (bluetoothOff) setDisconnectModalVisible(true)
  }, [bluetoothOff])

  useEffect(() => {
    console.log("[v0] Animation effect triggered - buzzerState:", buzzerState, "ledState:", ledState) // Added animation debug logging
    if (buzzerState || ledState) {
      console.log("[v0] Starting shake animation sequence")
      const shakeSequence = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(shakeAnimation, {
              toValue: 20,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: -20,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: 15,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: -15,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: 8,
              duration: 40,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: -8,
              duration: 40,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: 0,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.delay(200),
          ]),
          Animated.sequence([
            Animated.timing(rotateAnimation, {
              toValue: 0.1,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnimation, {
              toValue: -0.1,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnimation, {
              toValue: 0.08,
              duration: 70,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnimation, {
              toValue: -0.08,
              duration: 70,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnimation, {
              toValue: 0.05,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnimation, {
              toValue: -0.05,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnimation, {
              toValue: 0,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.delay(200),
          ]),
          Animated.sequence([
            Animated.timing(scaleAnimation, {
              toValue: 1.05,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 0.98,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 1.03,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 0.99,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 1.01,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.delay(200),
          ]),
        ]),
      )
      shakeSequence.start()
      return () => shakeSequence.stop()
    } else {
      Animated.parallel([
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [buzzerState, ledState, shakeAnimation, rotateAnimation, scaleAnimation])

  useEffect(() => {
    if (!connectedDevice) return

    const setupNotifications = async () => {
      try {
        await connectedDevice.monitorCharacteristicForService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          (error, characteristic) => {
            if (error) {
              console.log("Notification error:", error)
              return
            }

            if (characteristic?.value) {
              const response = Buffer.from(characteristic.value, "base64").toString("utf8")

              console.log("Received response:", response)

              if (response === "BUZZER_ON") {
                setBuzzerState(true)
                setBuzzerLoading(false)
              } else if (response === "BUZZER_OFF") {
                setBuzzerState(false)
                setBuzzerLoading(false)
              } else if (response === "LED_ON") {
                setLedState(true)
                setLedLoading(false)
              } else if (response === "LED_OFF") {
                setLedState(false)
                setLedLoading(false)
              }
            }
          },
        )
      } catch (error) {
        console.log("Failed to setup notifications:", error)
      }
    }

    setupNotifications()
  }, [connectedDevice])

  const sendToggleCommand = async (command: string) => {
    if (!connectedDevice) {
      Alert.alert("Error", "Device not connected")
      return
    }

    const base64Command = Buffer.from(command, "utf8").toString("base64")

    await connectedDevice.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      WRITE_CHARACTERISTIC_UUID,
      base64Command,
    )
  }

  const handleBuzzerPress = async () => {
    console.log("[v0] Buzzer button pressed!") // Added debug logging
    setBuzzerLoading(true)

    const newBuzzerState = !buzzerState
    setBuzzerState(newBuzzerState)
    console.log("[v0] Buzzer state toggled to:", newBuzzerState)

    try {
      await sendToggleCommand("BUZZ_TOGGLE")
      console.log("[v0] BUZZ_TOGGLE command sent successfully")
      setTimeout(() => setBuzzerLoading(false), 3000) // Fallback
    } catch (error) {
      console.log("[v0] Buzzer error:", error)
      setBuzzerLoading(false)
      setBuzzerState(!newBuzzerState) // Reset state on error
      Alert.alert("Error", "Failed to control buzzer")
    }
  }

  const handleLightPress = async () => {
    console.log("[v0] LED button pressed!") // Added debug logging
    setLedLoading(true)

    const newLedState = !ledState
    setLedState(newLedState)
    console.log("[v0] LED state toggled to:", newLedState)

    try {
      await sendToggleCommand("LED_TOGGLE")
      console.log("[v0] LED_TOGGLE command sent successfully")
      setTimeout(() => setLedLoading(false), 3000) // Fallback
    } catch (error) {
      console.log("[v0] LED error:", error)
      setLedLoading(false)
      setLedState(!newLedState) // Reset state on error
      Alert.alert("Error", "Failed to control LED")
    }
  }

  const handleDisconnectModalClose = () => {
    setDisconnectModalVisible(false)
    setBuzzerState(false)
    setLedState(false)
    onBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{object.name}</Text>
        <Text style={styles.headerSubtitle}>Device Connection Status</Text>
      </View>

      <View style={styles.imageContainer}>
        <Animated.View
          style={[
            styles.imageWrapper,
            {
              transform: [
                { translateX: shakeAnimation },
                {
                  rotate: rotateAnimation.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ["-10deg", "10deg"],
                  }),
                },
                { scale: scaleAnimation },
              ],
            },
          ]}
        >
          <Image source={require("../assets/images/shakableImage2.png")} style={styles.shakableImage} />
        </Animated.View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.compactSignalCard}>
          <View style={styles.compactIconContainer}>
            <MaterialCommunityIcons name={getSignalIcon(currentRssi)} size={20} color={getSignalColor(currentRssi)} />
          </View>
          <View style={styles.signalInfo}>
            <Animated.Text style={[styles.compactRssiValue, { opacity }]}>
              {currentRssi !== null ? `${currentRssi} dBm` : "No Signal"}
            </Animated.Text>
            <Text style={styles.compactProximityText}>{getProximity(currentRssi)}</Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.modernButton, styles.inactiveButton]}
              onPress={handleBuzzerPress}
              disabled={buzzerLoading}
            >
              {buzzerLoading ? (
                <Animated.View style={{ opacity }}>
                  <Ionicons name="volume-high-outline" size={24} color="#247eff" />
                </Animated.View>
              ) : (
                <Ionicons name={buzzerState ? "volume-high" : "volume-high-outline"} size={24} color="#247eff" />
              )}
              <Text style={[styles.buttonText, { color: "#247eff" }]}>
                {buzzerLoading ? "Loading..." : buzzerState ? "Buzzer ON" : "Buzzer OFF"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modernButton, styles.inactiveButton]}
              onPress={handleLightPress}
              disabled={ledLoading}
            >
              {ledLoading ? (
                <Animated.View style={{ opacity }}>
                  <Ionicons name="flash-outline" size={24} color="#247eff" />
                </Animated.View>
              ) : (
                <Ionicons name={ledState ? "flash" : "flash-outline"} size={24} color="#247eff" />
              )}
              <Text style={[styles.buttonText, { color: "#247eff" }]}>
                {ledLoading ? "Loading..." : ledState ? "LED ON" : "LED OFF"}
              </Text>
            </TouchableOpacity>
          </View>
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
              You have been disconnected due to distance limitations or Bluetooth is off. Ensure you are within 10–15
              meters from the microcontroller and keep Bluetooth on.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleDisconnectModalClose}>
              <Text style={styles.modalButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
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
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  shakableImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  compactSignalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 6,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 0.5,
  },
  compactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#f9fafb",
  },
  signalInfo: {
    flex: 1,
  },
  compactRssiValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280", // Low opacity gray as requested
    marginBottom: 2,
  },
  compactProximityText: {
    color: "#9ca3af", // Low opacity gray as requested
    fontSize: 10,
    fontWeight: "400",
  },
  controlsContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 8,
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
})
