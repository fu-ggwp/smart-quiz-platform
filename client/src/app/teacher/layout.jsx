import { Navbar } from "@/components/layout/navbar";

export default function TeacherLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
