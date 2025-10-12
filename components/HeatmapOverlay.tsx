import { View, Image, StyleSheet } from "react-native";
import Svg, { Polygon } from "react-native-svg";

type Mode = "breakouts" | "oiliness" | "dryness" | "redness";

type Props = {
  photoUri: string;
  overlays?: {
    front?: Record<Mode, number[][][]>;
    left?:  Record<Mode, number[][][]>;
    right?: Record<Mode, number[][][]>;
  } | null;
  which?: "front" | "left" | "right";
  mode: Mode;
};

// severity bucket -> color
function bucketToColor(bucket: 0|1|2|3, alpha = 0.32) {
  const colors = [
    `rgba(0,200,0,${alpha})`,   // green (low)
    `rgba(255,215,0,${alpha})`, // yellow
    `rgba(255,140,0,${alpha})`, // orange
    `rgba(255,0,0,${alpha})`,   // red (high)
  ];
  return colors[bucket];
}

/**
 * If you later pass per-polygon intensities, map 0..100 -> bucket.
 * For now we just vary by index so overlapping areas are distinguishable.
 */
function indexToBucket(i: number): 0|1|2|3 {
  return Math.min(3, Math.max(0, i)) as 0|1|2|3;
}

export default function HeatmapOverlay({ photoUri, overlays, which = "front", mode }: Props) {
  const polys = overlays?.[which]?.[mode] ?? [];

  return (
    <View style={styles.wrap}>
      <Image source={{ uri: photoUri }} style={styles.img} resizeMode="cover" />
      <Svg style={StyleSheet.absoluteFill as any} viewBox="0 0 100 100" preserveAspectRatio="none">
        {polys
          .filter((poly) => Array.isArray(poly) && poly.length > 0)
          .map((poly, i) => {
            const fill = bucketToColor(indexToBucket(i));
            const points = poly.map(([x, y]) => `${x},${y}`).join(" ");
            return (
              <Polygon
                key={i}
                points={points}
                fill={fill}
                stroke="rgba(0,0,0,0.25)"    // subtle outline to read shapes
                strokeWidth={0.6}
              />
            );
          })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", aspectRatio: 3 / 4, borderRadius: 16, overflow: "hidden" },
  img: { width: "100%", height: "100%" },
});
