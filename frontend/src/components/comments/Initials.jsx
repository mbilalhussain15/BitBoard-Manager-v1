import React from "react";

export default function Initials({ text = "US", size = 36, src, alt = "" }) {
  const style = { width: size, height: size, minWidth: size };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || text}
        className="rounded-full object-cover"
        style={style}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-red-600 text-white flex items-center justify-center"
      style={style}
    >
      <span className="text-xs font-semibold">{text}</span>
    </div>
  );
}











// import React from "react";

// export default function Initials({ text = "US", size = 36 }) {
//   return (
//     <div
//       className="rounded-full bg-red-600 text-white flex items-center justify-center"
//       style={{ width: size, height: size, minWidth: size }}
//     >
//       <span className="text-xs font-semibold">{text}</span>
//     </div>
//   );
// }
