import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createScanSession, uploadThreePhotos, callAnalyzeFunction, waitForScanComplete } from "../../src/lib/scan";

export default function Loading() {
  const { front, left, right } = useLocalSearchParams<{ front: string; left: string; right: string }>();
  const [msg, setMsg] = useState("Starting…");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        setMsg("Creating session…");
        const { scanId, userId } = await createScanSession();

        setMsg("Uploading photos…");
        const paths = await uploadThreePhotos(scanId, userId, { front: front!, left: left!, right: right! });

        setMsg("Analyzing…");
        await callAnalyzeFunction(scanId, paths);

        setMsg("Finishing…");
        const row = await waitForScanComplete(scanId, 90_000, 2000);

        if (row.status === "complete") {
          router.replace({ pathname: "/scan/result", params: { id: scanId } });
        } else {
          setErr("Analysis failed. Please try again.");
        }
      } catch (e: any) {
        setErr(e.message ?? String(e));
      }
    })();
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      <Text className="text-xl mb-2">{err ? "Error" : "Analyzing your skin"}</Text>
      <Text className="text-gray-600">{err ?? msg}</Text>
    </View>
  );
}
