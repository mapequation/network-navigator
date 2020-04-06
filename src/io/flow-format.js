/**
 * Format a decimal number such that it resembles the output of Infomap.
 *
 * @param {number} flow the flow to format
 * @return {string} formatted number as string
 */
export default function(flow) {
  if (!flow) return "0";

  if (flow > 0 && flow < 1e-4 && flow > Number.EPSILON) {
    let [significand, exponent] = flow
      .toExponential()
      .split("e");

    const abs = Math.abs(Number(exponent));
    if (abs < 10) {
      const sign = Math.sign(Number(exponent)) < 0 ? "-" : "+";
      exponent = `${sign}0${abs}`;
    }

    return [
      significand.substr(0, Math.min(significand.length + 2, 7)),
      exponent
    ].join("e");
  } else if (flow > 0 && flow < 10 && flow.toString().length > 11) {
    return flow.toFixed(9);
  }

  return flow.toString();
}
