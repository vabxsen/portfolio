// A CSS fade keeps server and client markup identical, including with reduced motion.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
