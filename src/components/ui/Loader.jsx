import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1 }}
        style={{
          width: 40,
          height: 40,
          border: "4px solid #e2e8f0",
          borderTop: "4px solid #2563eb",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}