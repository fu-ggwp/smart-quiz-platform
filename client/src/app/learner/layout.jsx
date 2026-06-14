import { Navbar } from "@/components/layout/navbar";

export default function LearnerLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
