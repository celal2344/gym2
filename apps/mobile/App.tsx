import { StatusBar } from "expo-status-bar";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { demoServices } from "@repo/domain";
import { t } from "@repo/domain/i18n";

const slots = [
  { id: "1", time: "09:00", service: "Pool", capacity: "12 left" },
  { id: "2", time: "11:30", service: "Massage", capacity: "1 left" },
  { id: "3", time: "14:00", service: "Day pass", capacity: "Open" },
];

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{t("app.name")}</Text>
        <Text style={styles.title}>Book, enter, and track your gym access.</Text>
      </View>

      <View style={styles.pass}>
        <View>
          <Text style={styles.passLabel}>Today&apos;s QR pass</Text>
          <Text style={styles.passCode}>GYM-24-8139</Text>
        </View>
        <View style={styles.qr}>
          <Text style={styles.qrText}>QR</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Bookable services</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={demoServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.serviceList}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <Text style={styles.serviceKind}>{t(`service.${item.kind}` as never)}</Text>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceMeta}>{item.durationMin} min</Text>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Available slots</Text>
      <View style={styles.slotList}>
        {slots.map((slot) => (
          <Pressable key={slot.id} style={styles.slotRow}>
            <View>
              <Text style={styles.slotTime}>{slot.time}</Text>
              <Text style={styles.slotService}>{slot.service}</Text>
            </View>
            <Text style={styles.slotCapacity}>{slot.capacity}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f2",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    gap: 8,
    marginBottom: 18,
  },
  eyebrow: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  title: {
    color: "#18181b",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  pass: {
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 22,
  },
  passLabel: {
    color: "#71717a",
    fontSize: 13,
  },
  passCode: {
    color: "#18181b",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  qr: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: "#18181b",
    alignItems: "center",
    justifyContent: "center",
  },
  qrText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18181b",
    marginBottom: 10,
  },
  serviceList: {
    gap: 10,
    paddingBottom: 18,
  },
  serviceCard: {
    width: 190,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 14,
    gap: 8,
  },
  serviceKind: {
    color: "#0e7490",
    fontWeight: "700",
  },
  serviceName: {
    color: "#18181b",
    fontSize: 16,
    fontWeight: "700",
  },
  serviceMeta: {
    color: "#71717a",
  },
  slotList: {
    gap: 10,
  },
  slotRow: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotTime: {
    color: "#18181b",
    fontSize: 18,
    fontWeight: "700",
  },
  slotService: {
    color: "#71717a",
    marginTop: 2,
  },
  slotCapacity: {
    color: "#047857",
    fontWeight: "700",
  },
});
