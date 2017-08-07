export const Quality = {
  /**
   * - real device pixel size
   * - furthest `far` distance
   * */
  HIGH: "HIGH",
  /**
   * - css pixel size
   * - normal `far` distance
   * */
  MEDIUM: 'MEDIUM',
  /**
   * - much less pixels for rendering and scales it larger
   * - closer `far` distance
   * */
  LOW: 'LOW'
};

export function getInitialQuality() {
  return Quality.HIGH;
}
