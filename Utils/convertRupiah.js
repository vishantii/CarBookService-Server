export function formatRupiah(number) {
  let rupiah = "";
  const numRev = number.toString().split("").reverse().join("");
  for (let i = 0; i < numRev.length; i++)
    if (i % 3 === 0) rupiah += numRev.substr(i, 3) + ".";
  return (
    "Rp. " +
    rupiah
      .split("", rupiah.length - 1)
      .reverse()
      .join("")
  );
}
